#!/usr/bin/env node
/**
 * 上游同步器（devdoc2.0 Phase F）
 *
 * 模式：
 * - check   检查 upstream/main 是否有新 commit
 * - diff    对比基线与最新 commit 的文件变化，按 include / transform / manual 分类
 * - apply   将 include 类变更安全地应用到 Theme：
 *     · 上游新文件 → 复制
 *     · 本地文件与基线一致（未被 Theme 适配）→ 快进更新
 *     · 本地文件已被 Theme 适配（与基线有差异）→ 标记冲突，跳过并报告
 *     · transform / manual 文件 → 永不自动覆盖，仅报告
 *     · 完成后更新 sync-manifest.json 的基线 commit
 * - verify  校验 manifest 基线状态 + 运行提纯验证
 *
 * apply 前要求 Theme 工作树干净（避免覆盖未提交修改）。
 */
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const manifestPath = join(themeDir, 'sync-manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

const mode = process.argv[2] ?? 'check'
const { repo, branch, commit } = manifest.upstream

if (mode === 'verify') {
	verify()
	process.exit(0)
}

const head = execSync(`git ls-remote ${repo} refs/heads/${branch}`, { encoding: 'utf8' })
	.split('\t')[0]
	.trim()

if (head === commit) {
	console.log(`✔ 上游已是最新：${short(commit)}`)
	process.exit(0)
}

console.log(`⚠ 上游有新提交：${short(commit)} → ${short(head)}`)

if (mode === 'check') {
	// CI 中用 --fail-on-update 让「有更新」以非零码退出，便于 workflow 判断
	if (process.argv.includes('--fail-on-update')) {
		process.exit(1)
	}
	console.log('运行 `node scripts/sync-upstream.mjs diff` 查看变更明细，或 `apply` 应用同步。')
	process.exit(0)
}

if (mode !== 'diff' && mode !== 'apply') {
	console.error(`未知模式：${mode}（支持 check / diff / apply / verify）`)
	process.exit(1)
}

if (mode === 'apply' && execSync('git status --porcelain', { cwd: themeDir, encoding: 'utf8' }).trim()) {
	console.error('✖ apply 要求 Theme 工作树干净，请先提交或暂存（stash）本地修改。')
	process.exit(1)
}

const tempDir = join(tmpdir(), `clarity-sync-${Date.now()}`)
mkdirSync(tempDir, { recursive: true })

try {
	execSync(`git clone --quiet ${repo} ${JSON.stringify(tempDir)}`, { stdio: 'ignore' })
	const output = execSync(`git diff --name-status ${commit}..${head}`, { cwd: tempDir, encoding: 'utf8' })
	const changes = output.trim().split('\n').filter(Boolean).map((line) => {
		const [status, ...rest] = line.split('\t')
		return { status, path: rest.join('\t') }
	})

	const buckets = { include: [], transform: [], manual: [], exclude: [], unknown: [] }
	for (const change of changes) {
		const bucket = buckets[classify(change.path)]
		if (bucket) {
			bucket.push(change)
		}
		else {
			buckets.unknown.push(change)
		}
	}

	printSection('可直接同步（include）', buckets.include)
	printSection('派生文件（transform，需按上游变更重构 Theme 版本）', buckets.transform)
	printSection('需人工审查（manual）', buckets.manual)
	printSection('已排除（exclude，忽略）', buckets.exclude)
	printSection('未分类（请更新 sync-manifest.json）', buckets.unknown)

	console.log(`\n共 ${changes.length} 个文件变更。`)

	if (mode === 'diff') {
		process.exit(0)
	}

	// ---- apply：仅 include 类，且以「本地是否偏离基线」判定可否快进 ----
	const copied = []
	const conflicts = []
	const deletions = []
	for (const { status, path } of buckets.include) {
		const localPath = join(themeDir, path)
		if (status === 'D') {
			if (existsSync(localPath) && fileEqualsBaseline(path, localPath, tempDir)) {
				rmSync(localPath)
				deletions.push(path)
			}
			continue
		}
		const upstreamFile = join(tempDir, path)
		if (!existsSync(upstreamFile)) {
			continue
		}
		if (existsSync(localPath) && !fileEqualsBaseline(path, localPath, tempDir)) {
			conflicts.push(path)
			continue
		}
		mkdirSync(join(localPath, '..'), { recursive: true })
		copyFileSync(upstreamFile, localPath)
		copied.push(path)
	}

	console.log(`\n✔ 已快进更新 ${copied.length} 个文件：`)
	for (const path of copied) {
		console.log(`  + ${path}`)
	}
	if (deletions.length) {
		console.log(`\n✔ 已删除 ${deletions.length} 个上游删除且本地未适配的文件：`)
		for (const path of deletions) {
			console.log(`  - ${path}`)
		}
	}
	if (conflicts.length) {
		console.log(`\n⚠ ${conflicts.length} 个文件被 Theme 适配过、上游又有变更，需手动合并（基线 ${short(commit)} → ${short(head)}）：`)
		for (const path of conflicts) {
			console.log(`  ! ${path}`)
		}
	}

	// 更新基线 commit
	manifest.upstream.commit = head
	manifest.upstream.syncedAt = new Date().toISOString()
	writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
	console.log(`\n✔ sync-manifest.json 基线已更新为 ${short(head)}`)

	console.log('\n后续请手动执行：')
	console.log('  pnpm lint && pnpm typecheck && pnpm generate && pnpm verify')
	console.log('  （transform / manual 文件如有变更，需先对照上游重构）')
}
finally {
	rmSync(tempDir, { recursive: true, force: true })
}

function verify() {
	console.log('▶ 提纯验证（作者信息 / 站点文件 / 跨项目路径）')
	execSync('node scripts/verify-theme.mjs', { cwd: themeDir, stdio: 'inherit' })
	console.log('▶ manifest 基线可达性')
	const ls = execSync(`git ls-remote ${repo} refs/heads/${branch}`, { encoding: 'utf8' })
	if (!ls.startsWith(manifest.upstream.commit)) {
		console.log(`⚠ 基线 ${short(manifest.upstream.commit)} 不是 ${branch} 最新（最新：${short(ls.split('\t')[0])}），可运行 apply 同步。`)
	}
	else {
		console.log(`✔ 基线 ${short(manifest.upstream.commit)} 即 ${branch} 最新提交`)
	}
}

/** 判断本地文件是否与上游基线一致（一致 = 未被 Theme 适配，可安全快进） */
function fileEqualsBaseline(path, localPath, tempDir) {
	try {
		const baseline = execSync(`git show ${commit}:${JSON.stringify(path)}`, { cwd: tempDir, encoding: 'buffer' })
		const local = readFileSync(localPath)
		return baseline.equals(local)
	}
	catch {
		return false
	}
}

function classify(path) {
	if (manifest.include.some(glob => matchGlob(glob, path))) {
		return 'include'
	}
	if (manifest.exclude.some(glob => matchGlob(glob, path))) {
		return 'exclude'
	}
	if (manifest.transform?.some(glob => matchGlob(glob, path))) {
		return 'transform'
	}
	if (manifest.manual.some(glob => matchGlob(glob, path))) {
		return 'manual'
	}
	return 'unknown'
}

function matchGlob(glob, path) {
	const regex = glob
		.replace(/[.+^${}()|[\]\\]/g, '\\$&')
		.replace(/\*\*\/(.*)$/, '(?:$1|.*/$1)')
		.replace(/\*\*/g, '.*')
		.replace(/\*/g, '[^/]*')
	return new RegExp(`^${regex}$`).test(path)
}

function printSection(title, changes) {
	if (!changes.length) {
		return
	}
	console.log(`\n${title}（${changes.length}）：`)
	for (const { status, path } of changes) {
		console.log(`  ${status}\t${path}`)
	}
}

function short(sha) {
	return sha.slice(0, 7)
}
