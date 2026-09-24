#!/usr/bin/env node
/**
 * transform 面治理门（transform parity gate）
 *
 * sync-manifest.json 的 include 同步面不覆盖 nuxt.config.ts 等派生配置
 * （它们在 manifest 中属于 transform 分类：上游变更时需要人工重新设计）。
 * source parity 因此对这些文件恒绿——upstream 新增重要 head.link / module /
 * css 入口时，Theme 侧可能静默遗漏（0.1.4 的 DOUYIN 字体事故即此模式）。
 *
 * 本门禁以 manifest commit 的 upstream nuxt.config.ts 为基准，对可机械
 * 判定的面（head.link / modules / css / vite.optimizeDeps）强制：
 *
 *   - upstream 字面量条目必须在 Theme 中逐字存在；
 *   - upstream 配置派生条目（blogConfig.*）必须登记为 TRANSFORM；
 *   - Theme 侧额外条目必须登记为 CLARITY-ONLY；
 *   - 登记缺席即失败， forcing 人工重新审查（与 docs/maintainers/transform-parity.md 对应）。
 *
 * 完整的人工映射表（含 DROP 项与理由）见该文档；此处只固化其中可自动判定的子集。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
// eslint-disable-next-line test/no-import-node-test
import { it as test } from 'node:test'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const manifest = JSON.parse(readFileSync(join(themeDir, 'sync-manifest.json'), 'utf8'))
const commit = manifest.upstream.commit

/** head.link 中 href 为字面量、但由 clarity-config 模块注入的条目（TRANSFORM） */
const TRANSFORM_HREFS = new Set([
	// features.atom 开启时由 clarity-config 注入 <link rel="alternate">
	'/atom.xml',
])
/** upstream modules 中有意不随 Layer 注册的条目（DROP，见 transform-parity 文档） */
const DROP_MODULES = new Set([
	// devDeps 保留但 Layer 不注册：alpha 阶段模块不强制下发给 consumer
	'@nuxt/a11y',
	// 同上：开发期提示模块，属 consumer 可选体验
	'@nuxt/hints',
	// 改为 vite.plugins 直挂 [Yaml()]，避免向 consumer 注入无法解析的 compilerOptions.types
	'unplugin-yaml/nuxt',
])
/** Theme 侧额外注册的模块（CLARITY-ONLY） */
const CLARITY_ONLY_MODULES = new Set([
	'clarity-source-layout',
	'clarity-config',
	'anti-mirror',
])

const upstreamSource = readUpstreamNuxtConfig()
const claritySource = readFileSync(join(themeDir, 'nuxt.config.ts'), 'utf8')

test('upstream nuxt.config.ts 在 manifest 基线可解析', () => {
	const entries = extractHeadLink(upstreamSource)
	// 基线 f6ea97d 的已知形状：9 个 link 条目。上游形状变化时此处失败，
	// 强制更新本门禁与 docs/maintainers/transform-parity.md 的映射表。
	if (entries.length !== 9) {
		throw new Error(`upstream head.link 条目数 ${entries.length} ≠ 9，请重新审查 transform 映射表`)
	}
})

test('head.link：upstream 字面量条目必须逐字下发（DOUYIN 字体回归）', () => {
	const upstreamEntries = extractHeadLink(upstreamSource)
	const clarityHrefs = extractHeadLink(claritySource).map(e => e.href)

	for (const entry of upstreamEntries) {
		if (entry.href === undefined) {
			continue // blogConfig.* 配置派生条目，由 clarity-config 注入（TRANSFORM）
		}
		if (TRANSFORM_HREFS.has(entry.href)) {
			continue
		}
		if (!clarityHrefs.includes(entry.href)) {
			throw new Error(
				`upstream head.link 的 ${entry.href} 未随 Layer 下发。`
				+ '若属有意行为，请先更新 docs/maintainers/transform-parity.md 并在此登记。',
			)
		}
	}
})

test('head.link：Theme 侧额外条目必须登记为 CLARITY-ONLY', () => {
	const upstreamLiteralHrefs = extractHeadLink(upstreamSource)
		.filter(e => e.href !== undefined)
		.map(e => e.href)
	const clarityHrefs = extractHeadLink(claritySource).map(e => e.href)

	for (const href of clarityHrefs) {
		if (!upstreamLiteralHrefs.includes(href) && !TRANSFORM_HREFS.has(href)) {
			throw new Error(`Theme head.link 的 ${href} 未在 upstream 基线出现，属 CLARITY-ONLY，需登记映射表`)
		}
	}
})

test('css：六个上游样式入口按原顺序注入（仅路径前缀差异）', () => {
	const upstreamCss = extractArrayEntries(upstreamSource, 'css: [')
	const clarityCss = extractArrayEntries(claritySource, 'css: [')
	const strip = path => path.replace(/^.*\//u, '')

	if (upstreamCss.length !== 6 || clarityCss.length !== 6) {
		throw new Error(`css 入口数异常：upstream ${upstreamCss.length} / clarity ${clarityCss.length}（基线各为 6）`)
	}
	for (let i = 0; i < 6; i++) {
		if (strip(upstreamCss[i]) !== strip(clarityCss[i])) {
			throw new Error(`css 入口第 ${i + 1} 项不一致：upstream ${upstreamCss[i]} vs clarity ${clarityCss[i]}`)
		}
	}
})

test('modules：upstream 模块除登记 DROP 外必须全部注册', () => {
	// toThemePath('src/modules/xxx') 归一为模块名；@scope/pkg 保持原样
	const normalise = name => name.startsWith('@') ? name : name.replace(/^.*\//u, '')
	const upstreamModules = extractArrayEntries(upstreamSource, '// @keep-sorted\n\tmodules: [')
	const clarityModules = extractArrayEntries(claritySource, '// @keep-sorted\n\tmodules: [').map(normalise)

	for (const name of upstreamModules) {
		if (DROP_MODULES.has(name)) {
			continue
		}
		if (!clarityModules.includes(name)) {
			throw new Error(
				`upstream 模块 ${name} 未随 Layer 注册。`
				+ '若属有意行为，请先更新 docs/maintainers/transform-parity.md 并在 DROP_MODULES 登记。',
			)
		}
	}
	for (const name of clarityModules) {
		if (!upstreamModules.includes(name) && !CLARITY_ONLY_MODULES.has(name)) {
			throw new Error(`Theme 模块 ${name} 属 CLARITY-ONLY，需登记映射表与 CLARITY_ONLY_MODULES`)
		}
	}
})

test('vite.optimizeDeps.include：依赖预构建清单与上游一致', () => {
	const upstreamInclude = extractInlineArray(upstreamSource)
	const clarityInclude = extractInlineArray(claritySource)
	const missing = upstreamInclude.filter(name => !clarityInclude.includes(name))
	if (missing.length) {
		throw new Error(`vite.optimizeDeps.include 缺失上游条目：${missing.join(', ')}`)
	}
})

/** 读取 manifest commit 的 upstream nuxt.config.ts（解析顺序与 source parity 门一致） */
function readUpstreamNuxtConfig() {
	const candidates = [
		process.env.CLARITY_UPSTREAM_DIR,
		resolve(themeDir, '../blog-v3-upstream'),
	].filter(Boolean)
	for (const dir of candidates) {
		if (existsSync(dir) && hasCommit(dir)) {
			return execFileSync('git', ['show', `${commit}:nuxt.config.ts`], { cwd: dir, encoding: 'utf8', maxBuffer: 1024 * 1024 })
		}
	}
	const tempDir = mkdtempSync(join(tmpdir(), 'clarity-transform-'))
	console.error(`未找到本地 upstream 仓库，拉取 ${manifest.upstream.repo}@${commit.slice(0, 7)} 到临时目录……`)
	try {
		execFileSync('git', ['init', '--quiet', tempDir])
		execFileSync('git', ['remote', 'add', 'origin', manifest.upstream.repo], { cwd: tempDir })
		execFileSync('git', ['fetch', '--quiet', '--depth', '1', 'origin', commit], { cwd: tempDir, stdio: ['ignore', 2, 2] })
		return execFileSync('git', ['show', `${commit}:nuxt.config.ts`], { cwd: tempDir, encoding: 'utf8', maxBuffer: 1024 * 1024 })
	}
	finally {
		rmSync(tempDir, { recursive: true, force: true })
	}
}

function hasCommit(dir) {
	try {
		execFileSync('git', ['cat-file', '-e', `${commit}^{commit}`], { cwd: dir, stdio: 'ignore' })
		return true
	}
	catch {
		return false
	}
}

/**
 * 提取 head.link 数组的逐条目 { rel, href? }。
 * 两份配置该数组均为一行一条目的字面量格式；href 为 blogConfig.* 派生时
 * 视为配置注入（TRANSFORM），href 返回 undefined。
 */
function extractHeadLink(source) {
	const entries = []
	for (const line of arrayLines(source, 'link: [')) {
		const rel = line.match(/rel: '([^']+)'/)?.[1]
		const hrefMatch = line.match(/href: '([^']+)'/)
		if (rel !== undefined) {
			entries.push({ rel, href: hrefMatch?.[1] })
		}
	}
	return entries
}

/** 提取多行数组（如 css / modules）中的字符串条目，剥离注释与 toThemePath 包裹 */
function extractArrayEntries(source, marker) {
	return arrayLines(source, marker)
		.map(line => line.match(/'([^']+)'/)?.[1])
		.filter(Boolean)
}

/** 提取单行数组字面量（optimizeDeps.include）中的字符串条目 */
function extractInlineArray(source) {
	const blockStart = source.indexOf('optimizeDeps: {')
	if (blockStart === -1) {
		throw new Error('未找到 vite.optimizeDeps 块')
	}
	const start = source.indexOf('include: [', blockStart)
	const end = source.indexOf(']', start)
	return [...source.slice(start, end).matchAll(/'([^']+)'/g)].map(m => m[1])
}

/** 返回 marker 起始的多行数组中、直到闭合 ] 之前的非空行（仅剥离整行注释，URL 含 // 不受影响） */
function arrayLines(source, marker) {
	const start = source.indexOf(marker)
	if (start === -1) {
		throw new Error(`未找到 ${JSON.stringify(marker)} 标记`)
	}
	const end = source.indexOf(']', start)
	return source.slice(start, end)
		.split('\n')
		.map(line => line.trim())
		.filter(line => line !== '' && !line.startsWith('//'))
}
