#!/usr/bin/env node
/**
 * 上游忠实度回归门（upstream parity gate）
 *
 * 以 sync-manifest.json 记录的 upstream commit 为基准，逐文件比较
 * include 同步面内的 upstream 文件与 Theme 文件：
 *
 * - identical   （默认）必须与 upstream blob 内容一致（统一按 LF 比较）
 * - mechanical  按 manifest 中显式声明的机械替换（Layer import 路径）转换后必须完全一致
 * - boundary    Layer / 消费项目边界文件：内容 hash 锁定，任何改动都必须
 *               重新审查并更新 tests/upstream-parity.manifest.json 中的记录
 * - bugfix      同 boundary，但必须附带上游问题说明
 *
 * 未登记的 Theme 侧额外文件、缺失文件、内容漂移都会导致失败，
 * 防止再次出现「为了 Theme 纯净而随手改写 upstream 组件」的分叉。
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))

// Windows 下 git 子进程若继承调用方的 stdin 句柄，可能以 `spawnSync git EBUSY`
// 失败（句柄被并发占用）。门禁只读取 git 的 stdout，因此统一忽略 stdin，
// 让脚本在任意宿主终端（IDE、CI、管道）下行为一致。
const GIT_STDIO = ['ignore', 'pipe', 'pipe']

const manifest = JSON.parse(readFileSync(join(themeDir, 'sync-manifest.json'), 'utf8'))
const parityPath = join(themeDir, 'tests/upstream-parity.manifest.json')
const parity = JSON.parse(readFileSync(parityPath, 'utf8'))
const updateHashes = process.argv.includes('--update-hashes')
const listJson = process.argv.includes('--list-json')
const commit = manifest.upstream.commit

const upstreamDir = resolveUpstreamDir()
const counts = { identical: 0, mechanical: 0, boundary: 0, bugfix: 0 }
const failures = []
const hashUpdates = []

try {
	if (listJson) {
		listRecords()
	}
	else {
		run()
	}
}
catch (error) {
	console.error(`✖ upstream parity 无法执行：${error.message}`)
	process.exitCode = 1
}

/** 输出 { themePath: class } 的 JSON 清单，供 verify-theme 等工具复用 */
function listRecords() {
	const out = {}
	const upstreamFiles = execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', commit], {
		cwd: upstreamDir,
		encoding: 'utf8',
		maxBuffer: 1024 * 1024 * 64,
		stdio: GIT_STDIO,
	}).split('\0').filter(Boolean)
	for (const file of upstreamFiles.filter(f => manifest.include.some(glob => matchGlob(glob, f)))) {
		const themePath = mapUpstreamPath(file)
		out[themePath] = parity.records[themePath]?.class ?? 'identical'
	}
	for (const [themePath, record] of Object.entries(parity.records)) {
		if (record.class === 'boundary' || record.class === 'bugfix') {
			out[themePath] ??= record.class
		}
	}
	console.log(JSON.stringify(out))
}

function run() {
	const upstreamFiles = execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', commit], {
		cwd: upstreamDir,
		encoding: 'utf8',
		maxBuffer: 1024 * 1024 * 64,
		stdio: GIT_STDIO,
	}).split('\0').filter(Boolean)

	const includeFiles = upstreamFiles.filter(file => manifest.include.some(glob => matchGlob(glob, file)))
	const themeFiles = execFileSync('git', ['ls-files', '-z', '--', 'src'], {
		cwd: themeDir,
		encoding: 'utf8',
		maxBuffer: 1024 * 1024 * 64,
		stdio: GIT_STDIO,
	}).split('\0').filter(Boolean).map(normalizeSlash).filter(path => existsSync(join(themeDir, path)))

	const expectedThemePaths = new Set(includeFiles.map(mapUpstreamPath))

	for (const upstreamFile of includeFiles) {
		const themePath = mapUpstreamPath(upstreamFile)
		const themeAbs = join(themeDir, themePath)
		const record = parity.records[themePath]
		const klass = record?.class ?? 'identical'

		if (!existsSync(themeAbs)) {
			failures.push({ themePath, upstreamFile, klass, message: 'Theme 侧文件缺失' })
			continue
		}

		const upstreamContent = normalizeLf(gitShow(upstreamFile))
		const themeContent = normalizeLf(readFileSync(themeAbs, 'utf8'))

		if (klass === 'identical' || klass === 'mechanical') {
			let expected = upstreamContent
			if (klass === 'mechanical') {
				for (const [from, to] of record.replacements) {
					if (!expected.includes(from)) {
						failures.push({ themePath, upstreamFile, klass, message: `机械替换源不存在于 upstream：${from}` })
						expected = null
						break
					}
					expected = expected.split(from).join(to)
				}
			}
			if (expected !== null && expected !== themeContent) {
				failures.push({
					themePath,
					upstreamFile,
					klass,
					message: klass === 'identical' ? '内容与 upstream 不一致' : '机械转换后与 Theme 文件不一致',
					diff: unifiedDiff(expected.split('\n'), themeContent.split('\n'), { fromLabel: klass === 'identical' ? `upstream:${upstreamFile}` : `upstream+transform:${upstreamFile}`, toLabel: `theme:${themePath}` }),
				})
				continue
			}
			counts[klass]++
		}
		else if (klass === 'boundary' || klass === 'bugfix') {
			const hash = sha256(themeContent)
			if (updateHashes) {
				if (record.hash !== hash) {
					hashUpdates.push({ themePath, hash })
					record.hash = hash
				}
			}
			else if (record.hash !== hash) {
				failures.push({
					themePath,
					upstreamFile,
					klass,
					message: `边界文件内容变化（记录 ${record.hash?.slice(0, 12) ?? '(无)'} → 实际 ${hash.slice(0, 12)}）；请审查差异，确认后运行 pnpm test:upstream-parity -- --update-hashes 更新记录`,
				})
				continue
			}
			counts[klass]++
		}
		else {
			failures.push({ themePath, upstreamFile, klass, message: `未知差异分类：${klass}` })
		}
	}

	// Theme 侧出现在同步面内、但 upstream 不存在且未登记的文件
	for (const themePath of themeFiles) {
		const impliedUpstream = reverseMapThemePath(themePath)
		if (impliedUpstream === undefined || expectedThemePaths.has(themePath)) {
			continue
		}
		if (!manifest.include.some(glob => matchGlob(glob, impliedUpstream))) {
			continue
		}
		if (parity.records[themePath]) {
			const klass = parity.records[themePath].class
			if (klass === 'boundary' || klass === 'bugfix') {
				const hash = sha256(normalizeLf(readFileSync(join(themeDir, themePath), 'utf8')))
				if (updateHashes && parity.records[themePath].hash !== hash) {
					hashUpdates.push({ themePath, hash })
					parity.records[themePath].hash = hash
				}
				else if (!updateHashes && parity.records[themePath].hash !== hash) {
					failures.push({ themePath, upstreamFile: impliedUpstream, klass, message: '边界文件内容变化（hash 不匹配）' })
				}
				else {
					counts[klass]++
				}
			}
			continue
		}
		failures.push({ themePath, upstreamFile: impliedUpstream, klass: 'unclassified', message: 'Theme 侧额外文件未在 upstream parity manifest 中登记' })
	}

	if (updateHashes && hashUpdates.length) {
		writeFileSync(parityPath, `${JSON.stringify(parity, null, '\t')}\n`)
	}

	report(includeFiles.length)
}

function report(total) {
	console.log(`upstream baseline: ${manifest.upstream.repo}@${commit.slice(0, 7)}（${manifest.upstream.version}）`)
	console.log(`include 同步面文件：${total}`)
	console.log(`  identical  ${counts.identical}`)
	console.log(`  mechanical ${counts.mechanical}`)
	console.log(`  boundary   ${counts.boundary}`)
	console.log(`  bugfix     ${counts.bugfix}`)

	if (hashUpdates.length) {
		console.log(`\n已更新 ${hashUpdates.length} 个边界文件 hash：`)
		for (const { themePath } of hashUpdates) {
			console.log(`  ~ ${themePath}`)
		}
	}

	if (failures.length) {
		console.error(`\n✖ upstream parity 失败（${failures.length} 个问题）：`)
		for (const { upstreamFile, themePath, klass, message, diff } of failures) {
			console.error(`\n  ! [${klass}] ${upstreamFile} -> ${themePath}`)
			console.error(`      ${message}`)
			if (diff) {
				console.error(diff.split('\n').map(line => `      ${line}`).join('\n'))
			}
		}
		process.exitCode = 1
		return
	}
	console.log('\n✔ upstream parity 通过：同步面内无未声明的上游漂移')
}

function resolveUpstreamDir() {
	// 上游内容解析顺序：CLARITY_UPSTREAM_DIR 覆盖 → 仓库同级 blog-v3-upstream
	// checkout（本地开发便捷路径）→ 克隆 manifest commit 到临时目录。
	// CLARITY_PARITY_FORCE_CLONE=1 跳过本地候选，用于在仓库独立内容
	// （CI / 发布包）环境中验证克隆路径。
	const forceClone = process.env.CLARITY_PARITY_FORCE_CLONE === '1'
	const candidates = forceClone
		? []
		: [
				process.env.CLARITY_UPSTREAM_DIR,
				resolve(themeDir, '../blog-v3-upstream'),
			].filter(Boolean)
	for (const dir of candidates) {
		if (existsSync(dir) && hasCommit(dir)) {
			return dir
		}
	}
	const tempDir = mkdtempSync(join(tmpdir(), 'clarity-parity-'))
	// 诊断信息与子进程进度一律走 stderr：--list-json 模式下 stdout 是纯 JSON 通道
	console.error(`未找到本地 upstream 仓库，拉取 ${manifest.upstream.repo}@${commit.slice(0, 7)} 到临时目录……`)
	let available = false
	try {
		// 单 commit depth-1 fetch：一次请求拿到该 commit 的完整 snapshot
		// （commit/tree/blob），后续逐文件读取全部本地命中；
		// blobless clone 会让每个 git show 都触发一次网络懒加载（120 次请求）。
		execFileSync('git', ['init', '--quiet', tempDir], { stdio: GIT_STDIO })
		execFileSync('git', ['remote', 'add', 'origin', manifest.upstream.repo], { cwd: tempDir, stdio: GIT_STDIO })
		execFileSync('git', ['fetch', '--quiet', '--depth', '1', 'origin', commit], { cwd: tempDir, stdio: ['ignore', 2, 2] })
		available = hasCommit(tempDir)
	}
	catch {
		available = false
	}
	if (!available) {
		// 回退：服务端拒绝按 SHA fetch 时使用 blobless 全历史 clone
		rmSync(tempDir, { recursive: true, force: true })
		mkdirSync(tempDir, { recursive: true })
		execFileSync('git', ['clone', '--filter=blob:none', '--no-checkout', manifest.upstream.repo, tempDir], { stdio: ['ignore', 2, 2] })
	}
	if (!hasCommit(tempDir)) {
		rmSync(tempDir, { recursive: true, force: true })
		throw new Error(`upstream 仓库中不存在 commit ${commit}`)
	}
	process.on('exit', () => rmSync(tempDir, { recursive: true, force: true }))
	return tempDir
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

function gitShow(path) {
	return execFileSync('git', ['show', `${commit}:${path}`], {
		cwd: upstreamDir,
		encoding: 'utf8',
		maxBuffer: 1024 * 1024 * 16,
		stdio: GIT_STDIO,
	})
}

function mapUpstreamPath(path) {
	for (const [from, to] of Object.entries(manifest.pathMap)) {
		if (path.startsWith(from)) {
			return `${to}${path.slice(from.length)}`
		}
	}
	return path
}

/** Theme 路径 → 隐含的 upstream 路径（仅用于判断是否落在同步面内） */
function reverseMapThemePath(themePath) {
	const reversed = Object.entries(manifest.pathMap)
		.map(([from, to]) => [to, from])
		.sort(([a], [b]) => b.length - a.length)
	for (const [themePrefix, upstreamPrefix] of reversed) {
		if (themePath.startsWith(themePrefix)) {
			return `${upstreamPrefix}${themePath.slice(themePrefix.length)}`
		}
	}
	return undefined
}

function matchGlob(glob, path) {
	return new RegExp(`^${globToRegExpSource(glob)}$`).test(path)
}

function globToRegExpSource(glob) {
	let source = ''
	let index = 0
	while (index < glob.length) {
		if (glob.startsWith('**/', index)) {
			source += '(?:[^/]+/)*'
			index += 3
		}
		else if (glob.startsWith('**', index)) {
			source += '.*'
			index += 2
		}
		else if (glob[index] === '*') {
			source += '[^/]*'
			index += 1
		}
		else {
			source += glob[index].replace(/[.+^${}()|[\]\\]/g, '\\$&')
			index += 1
		}
	}
	return source
}

function normalizeLf(content) {
	return content.replace(/\r\n/g, '\n')
}

function normalizeSlash(path) {
	return path.replaceAll('\\', '/')
}

function sha256(content) {
	return createHash('sha256').update(content).digest('hex')
}

function unifiedDiff(expected, actual, { fromLabel, toLabel }, maxLines = 40) {
	const n = expected.length
	const m = actual.length
	const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) {
			lcs[i][j] = expected[i] === actual[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
		}
	}
	const lines = [`--- ${fromLabel}`, `+++ ${toLabel}`]
	let i = 0
	let j = 0
	while (i < n && j < m) {
		if (expected[i] === actual[j]) {
			i++
			j++
		}
		else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
			lines.push(`- ${expected[i++]}`)
		}
		else {
			lines.push(`+ ${actual[j++]}`)
		}
	}
	while (i < n) lines.push(`- ${expected[i++]}`)
	while (j < m) lines.push(`+ ${actual[j++]}`)
	if (lines.length - 2 === 0) {
		return undefined
	}
	return lines.slice(0, maxLines + 2).join('\n') + (lines.length > maxLines + 2 ? `\n      …（共 ${lines.length - 2} 行差异）` : '')
}
