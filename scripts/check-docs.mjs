#!/usr/bin/env node
/**
 * Documentation governance checks（文档宪法的可执行子集，详见 docs/maintainers/documentation.md）
 *
 *  1. 当前 package.json 版本不得出现在 README* / docs/**（CHANGELOG 与 docs/history 冻结记录除外）
 *  2. 禁止按版本拆分的文档：RELEASE-NOTES-*.md / VERSION-*.md / CHANGELOG-*.md
 *  3. 双语文件配对（docs/history 冻结记录豁免）
 *  4. Markdown 相对链接可解析
 *  5. CHANGELOG 发布章节保持 SemVer 严格倒序（允许顶部一个 Unreleased）
 *  6. README 过大时输出 warning（不阻断）
 *
 * 仅依赖 Node 内置模块；运行：pnpm docs:check
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(readFileSync(join(themeDir, 'package.json'), 'utf8'))
const changelogPath = join(themeDir, 'CHANGELOG.md')

const failures = []
const warnings = []

function toPosix(path) {
	return path.replaceAll('\\', '/')
}

function walk(dir, predicate = () => true) {
	const out = []
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name)
		if (entry.isDirectory()) {
			out.push(...walk(full, predicate))
		}
		else if (predicate(full)) {
			out.push(full)
		}
	}
	return out
}

const isMarkdown = path => basename(path).endsWith('.md')
const docFiles = walk(join(themeDir, 'docs'), isMarkdown)
const readmeFiles = [
	join(themeDir, 'README.md'),
	join(themeDir, 'README.zh-CN.md'),
].filter(existsSync)
const checkedFiles = [...docFiles, ...readmeFiles, changelogPath]
const isHistory = path => toPosix(relative(themeDir, path)).startsWith('docs/history/')
const isChangelog = path => resolve(path) === resolve(changelogPath)

console.log('▶ Documentation Checks\n')

// ---------------------------------------------------------------------------
// [1] 版本污染：当前 release 版本只允许出现在 CHANGELOG 与历史冻结记录中
// ---------------------------------------------------------------------------
console.log('[1/6] Release-version pollution')
const versionPattern = new RegExp(`(?<![\\d.])${pkg.version.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)}(?!\\d)`)
let versionChecked = 0
for (const file of checkedFiles) {
	if (isChangelog(file) || isHistory(file)) {
		continue
	}
	versionChecked++
	const rel = toPosix(relative(themeDir, file))
	const offending = readFileSync(file, 'utf8')
		.split(/\r?\n/)
		.map((line, index) => (versionPattern.test(line) ? index + 1 : 0))
		.filter(Boolean)
	if (offending.length > 0) {
		failures.push(`[version] ${rel} 第 ${offending.join(', ')} 行包含当前版本 ${pkg.version}；发布版本只应记录在 CHANGELOG.md`)
	}
}
console.log(`  ✓ 已检查 ${versionChecked} 个非历史文档（CHANGELOG 与 docs/history 豁免）`)

// ---------------------------------------------------------------------------
// [2] 禁止按版本拆分的文档文件
// ---------------------------------------------------------------------------
console.log('[2/6] Per-version document files')
const forbiddenDocPattern = /^(?:RELEASE-NOTES|VERSION|CHANGELOG)-[\w.-]+\.md$/i
const forbiddenDocs = docFiles.filter(file => forbiddenDocPattern.test(basename(file)))
if (forbiddenDocs.length > 0) {
	for (const file of forbiddenDocs) {
		failures.push(`[per-version] 发现按版本拆分的文档 ${toPosix(relative(themeDir, file))}；请把内容合并进 CHANGELOG.md 后删除`)
	}
}
else {
	console.log('  ✓ 不存在 RELEASE-NOTES-* / VERSION-* / CHANGELOG-* 文档')
}

// ---------------------------------------------------------------------------
// [3] 双语配对：docs/history 之外，foo.md 与 foo.zh-CN.md 必须成对出现
// ---------------------------------------------------------------------------
console.log('[3/6] Bilingual pairing')
const pairableFiles = [...docFiles.filter(file => !isHistory(file)), ...readmeFiles]
const pairableSet = new Set(pairableFiles.map(file => toPosix(file)))
for (const file of pairableFiles) {
	const name = basename(file)
	const sibling = name.endsWith('.zh-CN.md')
		? join(dirname(file), name.replace(/\.zh-CN\.md$/, '.md'))
		: join(dirname(file), name.replace(/\.md$/, '.zh-CN.md'))
	if (!pairableSet.has(toPosix(sibling))) {
		failures.push(`[pairing] ${toPosix(relative(themeDir, file))} 缺少双语姊妹文件 ${basename(sibling)}`)
	}
}
console.log(`  ✓ 已检查 ${pairableFiles.length} 个文件的配对（docs/history 豁免）`)

// ---------------------------------------------------------------------------
// [4] Markdown 相对链接可解析
// ---------------------------------------------------------------------------
console.log('[4/6] Markdown internal links')
const linkPattern = /(!?)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
let linkCount = 0
for (const file of checkedFiles) {
	const rel = toPosix(relative(themeDir, file))
	const content = readFileSync(file, 'utf8')
	for (const [, , rawTarget] of content.matchAll(linkPattern)) {
		const target = rawTarget.trim()
		if (/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(target)) {
			continue
		}
		linkCount++
		const pathPart = decodeURIComponent(target.split('#')[0].split('?')[0])
		if (pathPart === '') {
			continue
		}
		const resolved = resolve(dirname(file), pathPart)
		if (!existsSync(resolved)) {
			failures.push(`[link] ${rel} 中的链接 ${target} 无法解析（${toPosix(relative(themeDir, resolved))}）`)
		}
	}
}
console.log(`  ✓ 已检查 ${linkCount} 条相对链接`)

// ---------------------------------------------------------------------------
// [5] CHANGELOG 严格倒序（允许顶部一个 Unreleased）
// ---------------------------------------------------------------------------
console.log('[5/6] CHANGELOG ordering')
const changelog = readFileSync(changelogPath, 'utf8')
const releaseHeading = /^## (Unreleased|(\d+)\.(\d+)\.(\d+)(?:-[\w.]+)?)(?: - (\d{4}-\d{2}-\d{2}))?\s*$/gm
const sections = [...changelog.matchAll(releaseHeading)].map(match => ({
	name: match[1],
	major: Number(match[2] ?? 0),
	minor: Number(match[3] ?? 0),
	patch: Number(match[4] ?? 0),
	date: match[5],
}))
if (sections.length === 0) {
	failures.push('[changelog] CHANGELOG.md 中没有 `## <version> - YYYY-MM-DD` 发布章节')
}
else {
	if (sections[0].name !== 'Unreleased' && sections.some(section => section.name === 'Unreleased')) {
		failures.push('[changelog] Unreleased 章节必须位于最顶部')
	}
	const unreleasedCount = sections.filter(section => section.name === 'Unreleased').length
	if (unreleasedCount > 1) {
		failures.push(`[changelog] 存在 ${unreleasedCount} 个 Unreleased 章节，最多允许 1 个`)
	}
	for (const section of sections) {
		if (section.name !== 'Unreleased' && !section.date) {
			failures.push(`[changelog] 发布章节 ${section.name} 缺少 \` - YYYY-MM-DD\` 日期`)
		}
	}
	const released = sections.filter(section => section.name !== 'Unreleased')
	for (let i = 1; i < released.length; i++) {
		const prev = released[i - 1]
		const current = released[i]
		const outOfOrder = prev.major < current.major
			|| (prev.major === current.major && prev.minor < current.minor)
			|| (prev.major === current.major && prev.minor === current.minor && prev.patch < current.patch)
		if (outOfOrder) {
			failures.push(`[changelog] 版本顺序错误：${current.name} 不应位于 ${prev.name} 之下（必须严格倒序）`)
		}
	}
	if (!failures.some(failure => failure.startsWith('[changelog]'))) {
		console.log(`  ✓ ${sections.length} 个章节（含 ${released.length} 个发布版本）保持倒序`)
	}
}

// ---------------------------------------------------------------------------
// [6] README 体积（warning，不阻断）
// ---------------------------------------------------------------------------
console.log('[6/6] README size')
for (const readme of readmeFiles) {
	const rel = toPosix(relative(themeDir, readme))
	const lines = readFileSync(readme, 'utf8').split(/\r?\n/).length
	if (lines > 300) {
		warnings.push(`${rel} 已有 ${lines} 行（>300）；README 应保持为落地页，详细内容请移入 docs/`)
	}
}
console.log('  ✓ README 体积检查完成')

// ---------------------------------------------------------------------------
// 汇总
// ---------------------------------------------------------------------------
if (warnings.length > 0) {
	console.log(`\n⚠ 非阻断告警 ${warnings.length} 条：`)
	for (const warning of warnings) {
		console.log(`  - ${warning}`)
	}
}
if (failures.length > 0) {
	console.error(`\n✖ 文档检查失败 ${failures.length} 项：`)
	for (const failure of failures) {
		console.error(`  - ${failure}`)
	}
	process.exitCode = 1
}
else {
	console.log('\n✔ 文档治理检查全部通过')
}
