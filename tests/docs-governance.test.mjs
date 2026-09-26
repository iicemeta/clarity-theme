/**
 * Documentation governance · 版本快照规则回归测试
 *
 * 背景（Phase 8.5）：旧规则把"当前版本字符串是否出现"当作污染判定，导致 stable
 * 发布时把文档对该发布本身的合法描述（迁移表、HISTORY 分类、"removed in"、
 * 安装范围）全部误判。新规则只拦"版本快照"——把当前版本当作当前状态断言或精确
 * 钉死、会随下一次发布过期的写法。
 *
 * 这里同时锁住两个方向：
 *  1. 真正会过期的快照必须继续被抓到（不得为了让 0.2.0 通过而放宽到失效）；
 *  2. 项目里既有合法引用必须继续放行（不得为了抓快照而误伤迁移/历史文档）。
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
// The docs-governance suite intentionally uses Node's built-in runner.
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { findVersionStamps } from '../scripts/lib/version-stamps.mjs'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const VERSION = JSON.parse(readFileSync(join(themeDir, 'package.json'), 'utf8')).version

/** @param {string} line 单行文本（其中的占位版本号会替换为当前版本） */
const stampsOf = line => findVersionStamps([line], VERSION)

// ---------------------------------------------------------------------------
// SHOULD FAIL：版本快照 —— 把当前版本当作当前状态断言 / 精确钉死
// ---------------------------------------------------------------------------
test('version stamps are flagged', () => {
	const stamps = [
		'Current version: <V>',
		'Version: <V>',
		'Latest stable version: <V>',
		'Release: <V>',
		'当前版本：<V>',
		'最新版本号：<V>',
		'| Version | <V> |',
		'| 版本 | <V> |',
		'npm install clarity-theme@<V>',
		'The latest version is <V>',
		'## <V>',
	]
	for (const template of stamps) {
		const line = template.replaceAll('<V>', VERSION)
		const found = stampsOf(line)
		assert.ok(found.length > 0, `should be flagged as a stamp: ${template}`)
	}
})

// ---------------------------------------------------------------------------
// SHOULD PASS：历史事实 / 迁移对照 / 安装范围 / 发布来源
// ---------------------------------------------------------------------------
test('historical, migration, range and provenance references are allowed', () => {
	const references = [
		'useClarityConfig was removed in <V>.',
		'<V> removed useClarityConfig.',
		'The 0.1.x compatibility surface was deleted in <V>. No live code remains.',
		'| 0.1.x | <V> |',
		'## Migration (0.1.x → 0.2)',
		'The generated `package.json` declares a caret range (for example `^<V>`).',
		'`^<V>` means `>=<V> <0.3.0`: it accepts later `0.2.x` patch releases.',
		'Requires ^<V>',
		'promoted into the second release candidate of the <V> line, which were left',
		'history: <V>',
		'0.1.x 的嵌套形式已在 <V> 移除。若迁移后的项目仍带 `clarity` 键，请删除该键。',
		'已于 <V> 整体删除。当前源码无任何活代码；保留该分类仅为让历史归档可审计。',
	]
	for (const template of references) {
		const line = template.replaceAll('<V>', VERSION)
		const found = stampsOf(line)
		assert.deepEqual(found, [], `should NOT be flagged: ${template}`)
	}
})

// ---------------------------------------------------------------------------
// 真实文档回归：这些文件里的合法引用必须保持放行
// ---------------------------------------------------------------------------
test('the release documentation stays free of stamps', () => {
	const files = [
		'docs/maintainers/legacy-policy.md',
		'docs/maintainers/legacy-policy.zh-CN.md',
		'docs/reference/api.md',
		'docs/reference/api.zh-CN.md',
		'docs/getting-started/migration-from-blog-v3.md',
		'docs/getting-started/migration-from-blog-v3.zh-CN.md',
		'docs/getting-started/new-project.md',
		'docs/getting-started/new-project.zh-CN.md',
		'docs/concepts/architecture.md',
		'docs/concepts/architecture.zh-CN.md',
		'docs/maintainers/rc2-promotion.md',
		'docs/maintainers/rc2-promotion.zh-CN.md',
	]
	for (const rel of files) {
		const lines = readFileSync(join(themeDir, rel), 'utf8').split(/\r?\n/)
		const found = findVersionStamps(lines, VERSION)
		assert.deepEqual(found, [], `${rel} unexpectedly contains version stamps`)
	}
})

// ---------------------------------------------------------------------------
// 集成：docs:check 在当前仓库状态下必须通过，且明确报告 0 处快照
// ---------------------------------------------------------------------------
test('docs:check passes and reports zero stamps', () => {
	// 固定 stdio：默认管道 stdin 在部分 Windows 宿主上会让子进程 spawn 失败
	const result = spawnSync(process.execPath, [join(themeDir, 'scripts', 'check-docs.mjs')], {
		cwd: themeDir,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	assert.equal(result.status, 0, `docs:check failed:\n${result.stdout}\n${result.stderr}`)
	assert.match(result.stdout, /发现版本快照 0 处/)
})
