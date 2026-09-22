#!/usr/bin/env node
/**
 * Content Rendering Regression Test
 *
 * 将 playground/content/compatibility 的兼容性基准页从「人工查看」升级为自动回归：
 *
 *   0. Compatibility Contract → 契约完整性 + docs/COMPATIBILITY.md 同步校验
 *   1. 生产构建日志扫描     → Nuxt / Vue runtime error、Content parser error、missing component
 *   2. 生产 SSR 路由断言    → 状态码（含 404 / permalink / 隐藏 /posts 前缀）+ 关键 HTML 结构 + payload
 *   3. 浏览器（生产构建）   → Shiki / Mermaid / abcjs 等客户端渲染结果 + runtime error
 *   4. 浏览器（dev 构建）   → hydration mismatch、Failed to resolve component 等仅开发模式可见的告警
 *
 * 不引入测试框架与浏览器依赖：HTTP 用原生 fetch，浏览器通过 Chrome/Edge 的 CDP +
 * Node 原生 WebSocket 驱动。CI（ubuntu-latest 自带 Chrome）可非交互执行。
 *
 * 用法：
 *   node scripts/test-compatibility.mjs                 # 完整执行
 *   node scripts/test-compatibility.mjs --filter mdc    # 只跑 id 匹配的用例
 *   node scripts/test-compatibility.mjs --no-build      # 复用 playground/.output
 *   node scripts/test-compatibility.mjs --no-browser    # 跳过浏览器阶段（降级为 SSR + 日志）
 *   node scripts/test-compatibility.mjs --no-dev        # 跳过 dev hydration 阶段
 *   node scripts/test-compatibility.mjs --contract-only # 只校验契约与文档同步（无构建）
 *   node scripts/test-compatibility.mjs --update-docs   # 由契约重新生成 docs/COMPATIBILITY.md
 */
import { spawn } from 'node:child_process'
import { createWriteStream, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import {
	browserCases,
	compatibilityContract,
	consoleAllowRules,
	consoleFailureRules,
	contractGroups,
	hydrationRoutes,
	logAllowRules,
	logFailureRules,
	requiredContractFeatures,
	ssrCases,
} from './compatibility-cases.mjs'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const playgroundDir = join(themeDir, 'playground')
const compatibilityDocPath = join(themeDir, 'docs', 'COMPATIBILITY.md')
const nuxtBin = join(playgroundDir, 'node_modules', 'nuxt', 'bin', 'nuxt.mjs')
const serverEntry = join(playgroundDir, '.output', 'server', 'index.mjs')

const flags = parseFlags(process.argv.slice(2))

const reportDir = mkdtempSync(join(tmpdir(), 'clarity-compat-'))
const failures = []
const skipped = []
const warnings = new Map()
let passedCount = 0
const timers = {}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const READYSTATE_EXPRESSION = 'document.readyState === \'complete\' && location.href !== \'about:blank\''

async function main() {
	console.log('▶ Content Rendering Regression Test')
	console.log(`  报告目录：${reportDir}\n`)

	let browser = null
	let prodServer = null
	let devServer = null

	try {
		// ---- 0. Compatibility Contract（不依赖构建，先 fail fast）----
		if (flags.updateDocs) {
			writeFileSync(compatibilityDocPath, renderCompatibilityDoc())
			console.log('[1/7] 已根据契约重新生成 docs/COMPATIBILITY.md')
		}
		verifyCompatibilityContract()

		if (flags.contractOnly) {
			console.log('[2/7] --contract-only / --update-docs：跳过构建与渲染阶段')
			skipped.push('构建 / SSR / 浏览器阶段被 --contract-only 跳过')
			// 提前 return 前必须设置退出码，否则契约失败时 CI 仍会绿
			process.exitCode = failures.length > 0 ? 1 : 0
			return
		}

		if (!existsSync(nuxtBin))
			throw new Error(`未找到 ${nuxtBin}，请先在仓库根目录执行 pnpm install`)

		// ---- 1. 生产构建 ----
		timers.build = start()
		if (flags.noBuild && existsSync(serverEntry)) {
			console.log('[2/7] 复用现有生产构建（--no-build）')
		}
		else {
			console.log('[2/7] 生产构建 playground（nuxt build）')
			await runLogged(
				[process.execPath, nuxtBin, 'build'],
				{ cwd: playgroundDir },
				join(reportDir, 'build.log'),
				{ tail: 12 },
			)
			console.log(`      ✓ 构建成功（${elapsed(timers.build)}）`)
		}

		// ---- 2. 构建日志扫描 ----
		console.log('[3/7] 构建日志扫描（runtime / parser / missing component）')
		scanLogFile(join(reportDir, 'build.log'), 'build')

		// ---- 3. 生产 SSR + 浏览器 ----
		prodServer = await startServer({
			log: 'server.log',
			title: '[4/7] 启动生产 SSR 服务',
		})
		const baseUrl = prodServer.baseUrl

		console.log(`[5/7] SSR 路由断言（${baseUrl}）`)
		await assertSsrCases(baseUrl)

		if (!flags.noBrowser) {
			browser = await launchBrowser()
			if (browser) {
				console.log(`[6/7] 浏览器客户端渲染断言（${browser.name}）`)
				await assertBrowserCases(browser, baseUrl, browserCases)
			}
			else {
				const message = '未找到 Chrome / Edge，跳过浏览器与 hydration 阶段'
				console.log(`[6/7] ${message}`)
				skipped.push(message)
			}
		}
		else {
			console.log('[6/7] 跳过浏览器阶段（--no-browser）')
			skipped.push('浏览器阶段被 --no-browser 跳过')
		}

		await stopServer(prodServer)
		prodServer = null
		scanLogFile(join(reportDir, 'server.log'), 'server')

		// ---- 4. dev 模式 hydration ----
		if (browser && !flags.noDev) {
			devServer = await startServer({
				log: 'dev.log',
				title: '[7/7] 启动 dev 服务（Vue 开发版告警）',
				dev: true,
				timeout: 240000,
			})
			console.log(`      hydration / 组件解析告警检查（${devServer.baseUrl}）`)
			await assertBrowserCases(browser, devServer.baseUrl, hydrationRoutes.map(route => ({
				...route,
				group: 'Hydration',
				evals: [
					[`${route.id} app mounted`, `document.readyState === 'complete' && !!document.querySelector('#blog-root ${route.selector ?? 'article.article'}')`],
				],
			})))
			await stopServer(devServer)
			devServer = null
			scanLogFile(join(reportDir, 'dev.log'), 'dev')
		}

		// ---- 5. dev 模式 anti-mirror 真实导航（P0-3）----
		// 用 127.0.0.1 模拟镜像主机、localhost 作为规范主机：
		// 注入脚本必须把浏览器从 127.0.0.1:<port> 导航回 localhost:<port>。
		if (browser && !flags.noDev) {
			const mirrorPort = 20000 + Math.floor(Math.random() * 20000)
			const mirrorServer = await startServer({
				log: 'mirror-dev.log',
				title: '启动 dev 服务（anti-mirror 导航验证）',
				dev: true,
				port: mirrorPort,
				timeout: 240000,
				env: {
					CLARITY_COMPAT_SITE_URL: `http://localhost:${mirrorPort}/`,
					CLARITY_COMPAT_ANTI_MIRROR_BLACKLIST: '127.0.0.1',
				},
			})
			try {
				await assertAntiMirrorNavigation(browser, mirrorServer.baseUrl, `localhost:${mirrorPort}`)
			}
			finally {
				await stopServer(mirrorServer)
				scanLogFile(join(reportDir, 'mirror-dev.log'), 'dev')
			}
		}
		else if (!flags.noBrowser) {
			console.log('[7/7] 跳过 dev hydration 阶段')
			skipped.push('dev hydration 阶段被 --no-dev 跳过或无浏览器')
		}
	}
	catch (error) {
		failures.push({ case: 'runner', dimension: 'test runner', message: error?.stack || String(error) })
	}
	finally {
		// 无论成败都回收子进程，避免 CI 中悬挂的 node / chrome
		await stopServer(prodServer).catch(() => {})
		await stopServer(devServer).catch(() => {})
		await browser?.close().catch(() => {})
		printSummary()
		if (failures.length === 0 && !flags.keep)
			rmSync(reportDir, { recursive: true, force: true })
	}

	process.exitCode = failures.length > 0 ? 1 : 0
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

function parseFlags(argv) {
	const value = (name) => {
		const prefix = `--${name}=`
		const item = argv.find(arg => arg.startsWith(prefix))
		return item ? item.slice(prefix.length) : undefined
	}
	return {
		contractOnly: argv.includes('--contract-only') || argv.includes('--update-docs'),
		noBuild: argv.includes('--no-build'),
		noBrowser: argv.includes('--no-browser'),
		noDev: argv.includes('--no-dev'),
		updateDocs: argv.includes('--update-docs'),
		filter: (value('filter') ?? value('f') ?? '').toLowerCase(),
		keep: argv.includes('--keep'),
	}
}

/* ------------------------------------------------------------------ */
/* 进程与日志                                                          */
/* ------------------------------------------------------------------ */

function start() {
	return Date.now()
}

function elapsed(from) {
	const seconds = Math.round((Date.now() - from) / 1000)
	return seconds >= 60 ? `${Math.floor(seconds / 60)}m${seconds % 60}s` : `${seconds}s`
}

/** 运行命令：stdout/stderr 同时写日志文件，失败时打印末尾日志 */
async function runLogged(command, options, logFile, { tail = 15 } = {}) {
	const [cmd, ...cmdArgs] = command
	const logStream = createWriteStream(logFile, { flags: 'w' })
	const lines = []
	const code = await new Promise((resolve, reject) => {
		const child = spawn(cmd, cmdArgs, { ...options, shell: false, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } })
		child.stdout.on('data', chunk => collect(chunk))
		child.stderr.on('data', chunk => collect(chunk))
		child.on('error', reject)
		child.on('close', code => resolve(code))

		function collect(chunk) {
			const text = chunk.toString()
			logStream.write(text)
			lines.push(text)
			while (lines.length > 400)
				lines.shift()
		}
	})
	logStream.end()
	if (code !== 0) {
		console.error(lines.join('').split('\n').slice(-tail).join('\n'))
		throw new Error(`命令退出码 ${code}：${cmd} ${cmdArgs.join(' ')}（完整日志：${logFile}）`)
	}
}

/** 日志扫描：已知噪音放行，其余命中失败规则即报告 */
function scanLogFile(logFile, label) {
	if (!existsSync(logFile)) {
		skipped.push(`${label} 日志不存在，跳过扫描`)
		return
	}
	const text = readFileSync(logFile, 'utf8')
	const seen = new Set()
	for (const line of text.split(/\r?\n/)) {
		if (!line || logAllowRules.some(re => re.test(line)))
			continue
		const rule = logFailureRules.find(rule => rule.re.test(line))
		if (!rule)
			continue
		const key = `${rule.dimension}:${line.slice(0, 160)}`
		if (seen.has(key))
			continue
		seen.add(key)
		failures.push({ case: `${label} log`, dimension: rule.dimension, message: line.slice(0, 400) })
	}
	passedCount += 1
	console.log(`      ✓ ${label} 日志无致命错误`)
}

/* ------------------------------------------------------------------ */
/* 服务管理                                                            */
/* ------------------------------------------------------------------ */

async function startServer({ log, title, dev = false, timeout = 90000, port, env = {} }) {
	console.log(`      ${title.replace(/^\[\d\/6\]\s*/, '')}`)
	port ??= 20000 + Math.floor(Math.random() * 20000)
	const command = dev
		? [process.execPath, nuxtBin, 'dev', '--port', String(port), '--host', '127.0.0.1']
		: [process.execPath, serverEntry]
	const logStream = createWriteStream(join(reportDir, log), { flags: 'w' })
	const child = spawn(command[0], command.slice(1), {
		cwd: playgroundDir,
		env: {
			...process.env,
			...env,
			HOST: '127.0.0.1',
			PORT: String(port),
			NITRO_PORT: String(port),
			NODE_ENV: dev ? process.env.NODE_ENV : 'production',
			FORCE_COLOR: '0',
			NO_COLOR: '1',
		},
	})
	child.stdout.on('data', c => logStream.write(c))
	child.stderr.on('data', c => logStream.write(c))

	const baseUrl = `http://127.0.0.1:${port}`
	const started = start()
	try {
		await waitFor(async () => {
			if (child.exitCode !== null)
				throw new Error(`服务提前退出（code ${child.exitCode}），见 ${join(reportDir, log)}`)
			const res = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(2000) })
			return res.ok || res.status === 404
		}, timeout, 500)
	}
	catch (error) {
		await killTree(child)
		logStream.end()
		throw new Error(`服务启动超时/失败：${error.message}（日志：${join(reportDir, log)}）`)
	}
	console.log(`      ✓ ${dev ? 'dev' : 'production'} 服务就绪 ${baseUrl}（${elapsed(started)}）`)
	return { child, baseUrl, logStream, log }
}

async function stopServer(server) {
	await new Promise(resolve => server.logStream.end(resolve))
	await killTree(server.child)
	await waitFor(async () => server.child.exitCode !== null || server.child.signalCode !== null, 10000, 200).catch(() => {})
	await sleep(200)
}

async function killTree(child) {
	if (child.exitCode !== null || child.killed)
		return
	if (process.platform === 'win32') {
		const { execSync } = await import('node:child_process')
		try {
			execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' })
		}
		catch {}
	}
	else {
		child.kill('SIGTERM')
	}
}

async function waitFor(fn, timeout, interval = 500) {
	const deadline = Date.now() + timeout
	let lastError
	while (Date.now() < deadline) {
		try {
			if (await fn())
				return true
		}
		catch (error) {
			lastError = error
		}
		await sleep(interval)
	}
	throw new Error(lastError?.message ?? `等待超时（${timeout}ms）`)
}

/* ------------------------------------------------------------------ */
/* 断言                                                                */
/* ------------------------------------------------------------------ */

function matchFilter(id) {
	return !flags.filter || id.toLowerCase().includes(flags.filter)
}

/** 去掉 Vue SSR 的 fragment 注释，避免断言被渲染实现细节干扰 */
function normalizeVueSsrHtml(html) {
	return html
		.replaceAll('<!--[-->', '')
		.replaceAll('<!--]-->', '')
		.replaceAll('<!---->', '')
}

async function assertSsrCases(baseUrl) {
	const cases = ssrCases.filter(item => matchFilter(item.id) || matchFilter(item.group))
	let index = 0
	for (const testCase of cases) {
		index += 1
		const res = await fetch(`${baseUrl}${testCase.route}`, { redirect: 'manual' })
		const html = await res.text()
		checkEqual(testCase, `status ${testCase.status}`, res.status, testCase.status)

		if (testCase.scope) {
			const scoped = normalizeVueSsrHtml(testCase.scope(html))
			if (!scoped)
				fail(testCase, 'generated HTML', '未找到 <article> 正文区域（页面可能渲染失败）')
			for (const item of testCase.includes ?? []) {
				if (!scoped.includes(item))
					fail(testCase, 'generated HTML', `缺少关键结构：${item}`)
			}
			for (const [pattern, name] of testCase.patterns ?? []) {
				if (!pattern.test(scoped))
					fail(testCase, 'generated HTML', `结构不匹配：${name} (${pattern})`)
			}
			for (const item of testCase.excludes ?? []) {
				if (scoped.includes(item))
					fail(testCase, 'generated HTML', `出现不应存在的原始语法：${item}`)
			}
		}
		else {
			const normalized = normalizeVueSsrHtml(html)
			for (const item of testCase.includes ?? []) {
				if (!normalized.includes(item))
					fail(testCase, 'generated HTML', `缺少关键结构：${item}`)
			}
			for (const [pattern, name] of testCase.patterns ?? []) {
				if (!pattern.test(normalized))
					fail(testCase, 'generated HTML', `结构不匹配：${name} (${pattern})`)
			}
			for (const item of testCase.excludes ?? []) {
				if (normalized.includes(item))
					fail(testCase, 'generated HTML', `出现不应存在的内容：${item}`)
			}
		}

		if (testCase.payload) {
			const payloadRes = await fetch(`${baseUrl}${testCase.payload.route}`)
			checkEqual(testCase, 'payload status 200', payloadRes.status, 200)
			const payload = await payloadRes.text()
			for (const item of testCase.payload.includes ?? []) {
				if (!payload.includes(item))
					fail(testCase, 'Content parser', `payload 缺少字段：${item}`)
			}
		}
		passedCount += 1
		console.log(`      ✓ [${index}/${cases.length}] ${testCase.id}`)
	}
}

async function assertBrowserCases(browser, baseUrl, cases) {
	const list = cases.filter(item => matchFilter(item.id) || matchFilter(item.group))
	let index = 0
	for (const testCase of list) {
		index += 1
		const allowRules = [...consoleAllowRules, ...(testCase.allowConsole ?? [])]
		const page = await browser.open(`${baseUrl}${testCase.route}`, {
			waitFor: testCase.waitFor,
			timeout: testCase.timeout,
			prepare: testCase.prepare,
		})

		for (const entry of page.exceptions) {
			fail(testCase, 'Nuxt / Vue runtime', `未捕获异常：${entry}`)
		}
		for (const entry of page.console) {
			if (allowRules.some(re => re.test(entry.text)))
				continue
			if (entry.type === 'error') {
				fail(testCase, 'Nuxt / Vue runtime', `console.error：${entry.text}`)
			}
			else if (entry.type === 'warning') {
				const rule = consoleFailureRules.find(rule => rule.re.test(entry.text))
				if (rule)
					fail(testCase, rule.dimension, `console.warn：${entry.text}`)
				else
					note(testCase.id, entry.text)
			}
		}

		if (testCase.waitFor && !page.selectorFound)
			fail(testCase, 'client render', `等待选择器超时：${testCase.waitFor}${page.selectorError ? `（${page.selectorError}）` : ''}`)

		for (const [name, expression] of testCase.evals ?? []) {
			try {
				const value = await browser.evaluate(expression)
				if (!value)
					fail(testCase, 'client render', `断言为假：${name}`)
			}
			catch (error) {
				fail(testCase, 'client render', `执行失败：${name} → ${error.message}`)
			}
		}
		passedCount += 1
		console.log(`      ✓ [${index}/${list.length}] ${testCase.id}${page.networkErrors.length ? `（${page.networkErrors.length} 个外部资源警告）` : ''}`)
	}
}

/**
 * P0-3：anti-mirror 真实浏览器导航验证。
 *
 * 从镜像主机（127.0.0.1:<port>，命中黑名单）打开页面后，
 * 注入脚本必须完成一次真实导航回到规范主机（localhost:<port>）。
 */
async function assertAntiMirrorNavigation(browser, baseUrl, expectedHost) {
	const testCase = { id: 'anti-mirror-navigation' }
	console.log(`      mirror 主机导航断言：${baseUrl} → ${expectedHost}`)
	const page = await browser.open(`${baseUrl}/`, { timeout: 60000 })

	for (const entry of page.exceptions) {
		fail(testCase, 'Nuxt / Vue runtime', `未捕获异常：${entry}`)
	}
	for (const entry of page.console) {
		if (entry.type === 'error' && !consoleAllowRules.some(re => re.test(entry.text))) {
			fail(testCase, 'Nuxt / Vue runtime', `console.error：${entry.text}`)
		}
	}

	let actualHost = ''
	try {
		const redirected = await waitFor(async () => {
			actualHost = await browser.evaluate('location.host')
			return actualHost === expectedHost
		}, 15000, 250)
		if (!redirected)
			throw new Error(`15s 内未导航回规范主机（当前 ${actualHost || '(unknown)'}）`)
	}
	catch (error) {
		fail(testCase, 'anti-mirror navigation', error.message)
		return
	}

	const canonical = await browser.evaluate(
		'document.querySelector(\'link[rel="canonical"]\')?.href ?? \'\'',
	).catch(() => '')
	if (canonical && !canonical.includes(expectedHost)) {
		fail(testCase, 'anti-mirror navigation', `canonical 链接仍指向镜像：${canonical}`)
		return
	}

	passedCount += 1
	console.log(`      ✓ ${testCase.id}（${baseUrl} → http://${expectedHost}/）`)
}

function checkEqual(testCase, name, actual, expected) {
	if (actual !== expected)
		fail(testCase, name.includes('status 404') ? '404' : 'routing', `${name}：期望 ${expected}，实际 ${actual}`)
}

function fail(testCase, dimension, message) {
	failures.push({ case: testCase.id, dimension, message })
	console.error(`      ✗ ${testCase.id} [${dimension}] ${message}`)
}

/** 非致命告警：不阻断 CI，但汇总展示，避免真正的错误被淹没在噪音里 */
function note(caseId, text) {
	const key = `${caseId}::${text.split('\n')[0].slice(0, 180)}`
	warnings.set(key, (warnings.get(key) ?? 0) + 1)
}

/* ------------------------------------------------------------------ */
/* Compatibility Contract                                             */
/* ------------------------------------------------------------------ */

function contractFail(message) {
	failures.push({ case: 'contract', dimension: 'compatibility contract', message })
}

/** compat:<id> 可引用的全部用例（hydration 用例带 -hydration 后缀区分阶段） */
function compatibilityCaseIds() {
	return new Set([
		...ssrCases.map(item => item.id),
		...browserCases.map(item => item.id),
		...hydrationRoutes.map(item => `${item.id}-hydration`),
		'anti-mirror-navigation',
	])
}

function verifyCompatibilityContract() {
	console.log('[1/7] Compatibility Contract 校验（必需 Feature / coverage 引用 / 文档同步）')
	const ids = compatibilityCaseIds()
	const groupIds = new Set(contractGroups.map(group => group.id))
	const allowedStatus = new Set(['automated', 'partial'])
	const seen = new Set()

	for (const entry of compatibilityContract) {
		const label = entry.feature ?? '(unnamed)'
		if (!groupIds.has(entry.group))
			contractFail(`${label} 使用未知分组：${entry.group}`)
		if (!allowedStatus.has(entry.status))
			contractFail(`${label} 使用未知状态：${entry.status}`)
		if (!Array.isArray(entry.coverage) || entry.coverage.length === 0)
			contractFail(`${label} 未声明任何自动化覆盖（coverage 为空）`)
		for (const reference of entry.coverage ?? []) {
			if (reference.startsWith('compat:') && !ids.has(reference.slice('compat:'.length)))
				contractFail(`${label} 引用不存在的 compat 用例：${reference}`)
		}
		const key = `${entry.group}::${label}`
		if (seen.has(key))
			contractFail(`契约中存在重复 Feature：${label}`)
		seen.add(key)
	}

	let requiredCount = 0
	for (const [groupId, features] of Object.entries(requiredContractFeatures)) {
		for (const feature of features) {
			requiredCount += 1
			if (!seen.has(`${groupId}::${feature}`))
				contractFail(`契约缺少必需 Feature：${groupId} / ${feature}`)
		}
	}

	const contractOnlyFailures = () => failures.filter(item => item.case === 'contract')
	if (contractOnlyFailures().length === 0) {
		const expected = renderCompatibilityDoc()
		const actual = existsSync(compatibilityDocPath)
			? readFileSync(compatibilityDocPath, 'utf8')
			: ''
		if (actual !== expected) {
			contractFail('docs/COMPATIBILITY.md 与 compatibilityContract 不同步：node scripts/test-compatibility.mjs --update-docs')
		}
	}

	if (contractOnlyFailures().length === 0) {
		passedCount += 1
		console.log(`      ✓ 契约 ${compatibilityContract.length} 项（必需 Feature ${requiredCount} 项）全部可追溯`)
	}
	else {
		for (const item of contractOnlyFailures())
			console.error(`      ✗ ${item.message}`)
	}
}

function renderCompatibilityDoc() {
	const cell = text => String(text).replaceAll('|', '\\|').replaceAll('\n', '<br>')
	const lines = [
		'# Clarity Theme Release Compatibility Matrix',
		'',
		'**English** | [简体中文](./COMPATIBILITY.zh-CN.md)',
		'',
		'> 本文档由 `scripts/compatibility-cases.mjs` 中的 `compatibilityContract` 生成，请勿手改表格。',
		'> 重新生成：`node scripts/test-compatibility.mjs --update-docs`；`pnpm test:contract` 会在 CI 中校验同步。',
		'> 中文版为人工同步的翻译快照，重新生成本文档后需手动同步 `COMPATIBILITY.zh-CN.md`。',
		'',
		'契约只断言「功能是否存在、配置是否生效、路由是否正确、输出是否正确」，不追求覆盖 UI 细节。',
		'',
		'## 运行命令',
		'',
		'| 命令 | 覆盖范围 | CI |',
		'| --- | --- | --- |',
		'| `pnpm test:contract` | 契约完整性 + 文档同步（无构建，秒级） | Layer 1 · typecheck job |',
		'| `pnpm test:compatibility` | playground 生产构建 SSR + 真实浏览器 + dev hydration | Layer 3 · consumer job |',
		'| `pnpm test:consumer` | pnpm pack → 独立 consumer 安装 → exports / typecheck → 3 组 generate 配置分支 | Layer 3 · consumer job |',
		'',
		'调试单条用例：`node scripts/test-compatibility.mjs --filter=mdc`（匹配 case id 或分组）。',
		'',
		'## 状态说明',
		'',
		'- ✅ Automated：对应测试在 CI 中必须通过；`compat:*` 为渲染回归用例，`consumer:*` 为独立消费者验收用例。',
		'- ⚙️ Partial：只锁定了契约子集（例如构建脚手架行为），边界写在 Expected behavior 中。',
		'',
	]

	for (const group of contractGroups) {
		const entries = compatibilityContract.filter(entry => entry.group === group.id)
		if (entries.length === 0)
			continue
		lines.push(`## ${group.title}`, '')
		lines.push('| Feature | Input | Expected behavior | Test command | Status |')
		lines.push('| --- | --- | --- | --- | --- |')
		for (const entry of entries) {
			const status = entry.status === 'automated' ? '✅ Automated' : '⚙️ Partial'
			const coverage = (entry.coverage ?? []).map(reference => `\`${reference}\``).join('<br>')
			const cells = [entry.feature, entry.input, entry.expected, `\`${entry.command}\``, `${status}<br>${coverage}`]
			lines.push(`| ${cells.map(cell).join(' | ')} |`)
		}
		lines.push('')
	}

	return `${lines.join('\n').trimEnd()}\n`
}

/* ------------------------------------------------------------------ */
/* CDP 浏览器（零依赖：原生 WebSocket + Chrome/Edge）                   */
/* ------------------------------------------------------------------ */

const browserCandidates = process.platform === 'win32'
	? [
			'C:/Program Files/Google/Chrome/Application/chrome.exe',
			'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
			'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
			'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
		]
	: process.platform === 'darwin'
		? [
				'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
				'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
				'/Applications/Chromium.app/Contents/MacOS/Chromium',
			]
		: [
				process.env.CHROME_PATH,
				'/usr/bin/google-chrome',
				'/usr/bin/google-chrome-stable',
				'/usr/bin/chromium',
				'/usr/bin/chromium-browser',
				'/snap/bin/chromium',
			].filter(Boolean)

async function launchBrowser() {
	if (process.env.COMPAT_BROWSER)
		browserCandidates.unshift(process.env.COMPAT_BROWSER)
	const executable = browserCandidates.find(path => path && existsSync(path))
	if (!executable)
		return null

	const userDataDir = join(reportDir, 'browser-profile')
	const args = [
		'--headless=new',
		'--remote-debugging-port=0',
		`--user-data-dir=${userDataDir}`,
		'--no-first-run',
		'--no-default-browser-check',
		'--disable-gpu',
		'--disable-dev-shm-usage',
		'--no-sandbox',
		'--window-size=1440,2000',
		'about:blank',
	]
	const child = spawn(executable, args, { stdio: ['ignore', 'pipe', 'pipe'] })
	let endpoint = ''
	const onStderr = (chunk) => {
		const match = chunk.toString().match(/DevTools listening on (ws:\/\/\S+)/)
		if (match)
			endpoint = match[1]
	}
	child.stderr.on('data', onStderr)
	child.stdout.on('data', onStderr)
	await waitFor(() => {
		if (child.exitCode !== null)
			throw new Error(`浏览器退出（code ${child.exitCode}）`)
		return Boolean(endpoint)
	}, 15000, 100).catch(() => {})
	if (!endpoint) {
		await killTree(child)
		return null
	}

	const cdp = await CdpConnection.connect(endpoint)
	const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' })
	const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
	await cdp.send('Page.enable', {}, sessionId)
	await cdp.send('Runtime.enable', {}, sessionId)
	await cdp.send('Log.enable', {}, sessionId)
	await cdp.send('Emulation.setDeviceMetricsOverride', {
		width: 1440,
		height: 2000,
		deviceScaleFactor: 1,
		mobile: false,
	}, sessionId)

	return {
		name: `${executable.split(/[\\/]/).pop()} (CDP)`,
		async open(url, options = {}) {
			const console_ = []
			const exceptions = []
			const networkErrors = []
			const offConsole = cdp.on('Runtime.consoleAPICalled', (params) => {
				const text = (params.args ?? []).map(arg => arg.value ?? arg.description ?? '').join(' ').trim()
				if (text)
					console_.push({ type: params.type, text })
			}, sessionId)
			const offException = cdp.on('Runtime.exceptionThrown', (params) => {
				const detail = params.exceptionDetails
				exceptions.push(detail.exception?.description || detail.text || 'unknown exception')
			}, sessionId)
			const offLog = cdp.on('Log.entryAdded', (params) => {
				const entry = params.entry
				if (entry.level === 'error' && entry.source === 'network')
					networkErrors.push(`${entry.url ?? ''} ${entry.text}`)
			}, sessionId)

			try {
				await cdp.send('Page.navigate', { url }, sessionId)
				// about:blank 的 readyState 也是 complete，必须同时确认 URL 已切换
				await waitFor(async () => {
					try {
						return await this.evaluate(READYSTATE_EXPRESSION)
					}
					catch {
						return false
					}
				}, options.timeout ?? 30000, 200)

				if (options.prepare)
					await this.evaluate(options.prepare).catch(() => {})

				let selectorFound = true
				let selectorError = ''
				if (options.waitFor) {
					selectorFound = await waitFor(async () => {
						try {
							return await this.evaluate(`!!document.querySelector(${JSON.stringify(options.waitFor)})`)
						}
						catch (error) {
							selectorError = error.message
							return false
						}
					}, options.timeout ?? 10000, 250).catch((error) => {
						selectorError ||= error.message
						return false
					})
				}
				await sleep(options.timeout ? 500 : 1000)
				if (process.env.COMPAT_DEBUG) {
					const info = await Promise.all([
						this.evaluate('location.href').catch(() => ''),
						this.evaluate('document.querySelector(\'article.article\')?.className ?? \'\'').catch(() => ''),
						this.evaluate('JSON.stringify(Array.from(document.querySelectorAll(\'article.article ul\')).map(ul => ul.className))').catch(() => ''),
					])
					console.log(`      [debug] url=${info[0]} article=${info[1]} lists=${info[2]}`)
				}
				return { console: console_, exceptions, networkErrors, selectorFound, selectorError }
			}
			finally {
				offConsole()
				offException()
				offLog()
			}
		},
		async evaluate(expression) {
			const res = await cdp.send('Runtime.evaluate', {
				expression,
				returnByValue: true,
				awaitPromise: true,
			}, sessionId)
			if (res.exceptionDetails)
				throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text)
			return res.result?.value
		},
		async close() {
			await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
			await cdp.send('Browser.close').catch(() => {})
			cdp.close()
			await killTree(child)
		},
	}
}

class CdpConnection {
	constructor(ws) {
		this.ws = ws
		this.seq = 0
		this.pending = new Map()
		this.handlers = new Map()
		ws.onmessage = event => this.dispatch(JSON.parse(event.data))
		ws.onclose = () => {
			for (const { reject } of this.pending.values())
				reject(new Error('CDP connection closed'))
			this.pending.clear()
		}
	}

	static async connect(url) {
		const ws = new WebSocket(url)
		await new Promise((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error('CDP WebSocket 连接超时')), 10000)
			ws.onopen = () => {
				clearTimeout(timer)
				resolve()
			}
			ws.onerror = () => {
				clearTimeout(timer)
				reject(new Error('CDP WebSocket 连接失败'))
			}
		})
		return new CdpConnection(ws)
	}

	send(method, params = {}, sessionId, timeout = 30000) {
		const id = ++this.seq
		const message = { id, method, params }
		if (sessionId)
			message.sessionId = sessionId
		return new Promise((resolvePromise, reject) => {
			const timer = setTimeout(() => {
				this.pending.delete(id)
				reject(new Error(`CDP ${method} 超时`))
			}, timeout)
			this.pending.set(id, {
				resolve: (value) => {
					clearTimeout(timer)
					resolvePromise(value)
				},
				reject: (error) => {
					clearTimeout(timer)
					reject(error)
				},
			})
			this.ws.send(JSON.stringify(message))
		})
	}

	on(method, handler, sessionId) {
		const list = this.handlers.get(method) ?? []
		const wrapped = params => handler(params)
		list.push({ handler: wrapped, sessionId })
		this.handlers.set(method, list)
		return () => {
			const remaining = (this.handlers.get(method) ?? []).filter(item => item.handler !== wrapped)
			this.handlers.set(method, remaining)
		}
	}

	dispatch(message) {
		if (message.id !== undefined) {
			this.pending.get(message.id)?.[message.error ? 'reject' : 'resolve'](message.error ?? message.result)
			this.pending.delete(message.id)
			return
		}
		for (const { handler, sessionId } of this.handlers.get(message.method) ?? []) {
			if (!sessionId || sessionId === message.sessionId)
				handler(message.params)
		}
	}

	close() {
		try {
			this.ws.close()
		}
		catch {}
	}
}

/* ------------------------------------------------------------------ */
/* 汇总                                                                */
/* ------------------------------------------------------------------ */

function printSummary() {
	console.log('\n──────────────────────────────')
	if (failures.length > 0) {
		console.log(`✖ 失败 ${failures.length} 项（通过 ${passedCount} 项）`)
		const grouped = new Map()
		for (const item of failures) {
			const list = grouped.get(item.case) ?? []
			list.push(item)
			grouped.set(item.case, list)
		}
		for (const [caseName, list] of grouped) {
			console.log(`\n[${caseName}]`)
			for (const item of list)
				console.log(`  - (${item.dimension}) ${item.message}`)
		}
		console.log(`\n报告目录：${reportDir}`)
	}
	else {
		console.log(`✔ 全部通过（${passedCount} 项断言组${skipped.length ? `，跳过 ${skipped.length} 项` : ''}）`)
		for (const item of skipped)
			console.log(`  - skip：${item}`)
		if (warnings.size > 0) {
			console.log(`\n⚠ 非致命告警（${warnings.size} 类，dev 模式 Vue 告警不阻断）：`)
			for (const [key, count] of warnings)
				console.log(`  - ${key.split('::')[0]} ×${count}：${key.split('::')[1]}`)
		}
	}
}

await main()
