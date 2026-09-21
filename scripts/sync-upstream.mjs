#!/usr/bin/env node
/**
 * 上游同步器（当前支持 check / diff 两个模式）
 *
 * - check：检查 upstream/main 是否有新 commit
 * - diff：对比清单中各文件在基线与最新 commit 间的变化，按 include/manual 分类
 *
 * apply / verify 模式将在 Theme 架构稳定后补全（见 devdoc Phase 6）。
 */
import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const manifestPath = join(themeDir, 'sync-manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

const mode = process.argv[2] ?? 'check'
const { repo, branch, commit } = manifest.upstream

const head = execSync(`git ls-remote ${repo} refs/heads/${branch}`, { encoding: 'utf8' })
	.split('\t')[0]
	.trim()

if (head === commit) {
	console.log(`✔ 上游已是最新：${short(commit)}`)
	process.exit(0)
}

console.log(`⚠ 上游有新提交：${short(commit)} → ${short(head)}`)

if (mode === 'check') {
	console.log('运行 `node scripts/sync-upstream.mjs diff` 查看变更明细。')
	process.exit(0)
}

if (mode !== 'diff') {
	console.error(`未知模式：${mode}（支持 check / diff）`)
	process.exit(1)
}

const tempDir = mkdtempSync(join(tmpdir(), 'clarity-sync-'))
try {
	execSync(`git clone --quiet --no-checkout ${repo} ${JSON.stringify(tempDir)}`, { stdio: 'inherit' })
	const output = execSync(`git diff --name-status ${commit}..${head}`, { cwd: tempDir, encoding: 'utf8' })
	const changes = output.trim().split('\n').filter(Boolean).map((line) => {
		const [status, path] = line.split('\t')
		return { status, path }
	})

	const buckets = { include: [], manual: [], siteOnly: [], unknown: [] }
	for (const change of changes) {
		const bucket = buckets[classify(change.path)] ?? buckets.unknown
		bucket.push(change)
	}

	printSection('可直接同步（include）', buckets.include)
	printSection('需人工审查（manual）', buckets.manual)
	printSection('站点文件（siteOnly，忽略）', buckets.siteOnly)
	printSection('未分类', buckets.unknown)

	console.log(`\n共 ${changes.length} 个文件变更。apply 模式将在架构稳定后提供。`)
}
finally {
	rmSync(tempDir, { recursive: true, force: true })
}

function classify(path) {
	if (manifest.include.some(glob => matchGlob(glob, path))) {
		return 'include'
	}
	if (manifest.manual.some(glob => matchGlob(glob, path))) {
		return 'manual'
	}
	if (manifest.siteOnly.some(glob => matchGlob(glob, path))) {
		return 'siteOnly'
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
