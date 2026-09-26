import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
// The sync regression suite intentionally uses Node's built-in runner.
// eslint-disable-next-line test/no-import-node-test
import { it } from 'node:test'
import { fileURLToPath } from 'node:url'

const syncScript = fileURLToPath(new URL('../scripts/sync-upstream.mjs', import.meta.url))
// 子进程 stdin 必须显式 ignore：默认（管道）stdio 在部分 Windows 宿主上会以
// `spawnSync ... EBUSY` 直接失败，被测脚本根本不会启动（与 scripts/*.mjs 内
// git 调用同一原因；Phase 5 只硬化了实现，漏掉了本 harness）。
const CHILD_STDIO = ['ignore', 'pipe', 'pipe']
const initialFiles = {
	'app/clean.vue': 'clean-old\n',
	'app/conflict.vue': 'conflict-old\n',
	'app/deleted.vue': 'deleted-old\n',
	'config/transform.ts': 'transform-old\n',
	'config/manual.ts': 'manual-old\n',
	'config/excluded.txt': 'excluded-old\n',
	'config/overlap.txt': 'overlap-old\n',
}

it('clean include file fast-forwards and updates the manifest', () => {
	const fixture = createFixture({
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'app/clean.vue'), 'clean-new\n')
			commit(upstream, 'update clean')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 0)
	assert.equal(read(fixture, 'app/clean.vue'), 'clean-new\n')
	assert.equal(manifest(fixture).upstream.commit, fixture.head)
	assert.notEqual(manifest(fixture).upstream.syncedAt, '2000-01-01T00:00:00.000Z')
})

it('modified local file is a conflict and blocks every apply operation', () => {
	const fixture = createFixture({
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'app/clean.vue'), 'clean-new\n')
			writeFileSync(join(upstream, 'app/conflict.vue'), 'upstream-new\n')
			commit(upstream, 'update files')
		},
		updateTheme(theme) {
			writeFileSync(join(theme, 'app/conflict.vue'), 'theme-new\n')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 1)
	assert.match(result.stderr, /存在冲突/)
	assert.equal(read(fixture, 'app/clean.vue'), 'clean-old\n')
	assert.equal(read(fixture, 'app/conflict.vue'), 'theme-new\n')
	assert.equal(manifest(fixture).upstream.commit, fixture.baseline)
})

it('unmodified upstream deletion is synchronized safely', () => {
	const fixture = createFixture({
		updateUpstream(upstream) {
			rmSync(join(upstream, 'app/deleted.vue'))
			commit(upstream, 'delete file')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 0)
	assert.equal(exists(join(fixture.theme, 'app/deleted.vue')), false)
	assert.equal(manifest(fixture).upstream.commit, fixture.head)
})

it('modified upstream deletion stays local and keeps the old baseline', () => {
	const fixture = createFixture({
		updateUpstream(upstream) {
			rmSync(join(upstream, 'app/deleted.vue'))
			commit(upstream, 'delete file')
		},
		updateTheme(theme) {
			writeFileSync(join(theme, 'app/deleted.vue'), 'theme-deletion-adapter\n')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 1)
	assert.equal(read(fixture, 'app/deleted.vue'), 'theme-deletion-adapter\n')
	assert.equal(manifest(fixture).upstream.commit, fixture.baseline)
})

it('upstream new file is copied when the local path is empty', () => {
	const fixture = createFixture({
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'app/new.vue'), 'new\n')
			commit(upstream, 'add file')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 0)
	assert.equal(read(fixture, 'app/new.vue'), 'new\n')
	assert.equal(manifest(fixture).upstream.commit, fixture.head)
})

it('upstream new file conflicts with an existing Theme file', () => {
	const fixture = createFixture({
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'app/new.vue'), 'upstream-new\n')
			commit(upstream, 'add file')
		},
		updateTheme(theme) {
			writeFileSync(join(theme, 'app/new.vue'), 'theme-new\n')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 1)
	assert.equal(read(fixture, 'app/new.vue'), 'theme-new\n')
	assert.equal(manifest(fixture).upstream.commit, fixture.baseline)
})

it('transform changes are reported but never copied over Theme files', () => {
	const fixture = createFixture({
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'config/transform.ts'), 'transform-new\n')
			commit(upstream, 'update transform')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 0)
	assert.equal(read(fixture, 'config/transform.ts'), 'transform-old\n')
	assert.match(result.stdout, /派生文件/)
	assert.equal(manifest(fixture).upstream.commit, fixture.head)
})

it('manual changes are reported but never copied over Theme files', () => {
	const fixture = createFixture({
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'config/manual.ts'), 'manual-new\n')
			commit(upstream, 'update manual')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 0)
	assert.equal(read(fixture, 'config/manual.ts'), 'manual-old\n')
	assert.match(result.stdout, /需人工审查/)
	assert.equal(manifest(fixture).upstream.commit, fixture.head)
})

it('upstream rename deletes the old include path and creates the new path', () => {
	const fixture = createFixture({
		updateUpstream(upstream) {
			git(['mv', 'app/clean.vue', 'app/renamed.vue'], upstream)
			commit(upstream, 'rename file')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 0)
	assert.equal(exists(join(fixture.theme, 'app/clean.vue')), false)
	assert.equal(read(fixture, 'app/renamed.vue'), 'clean-old\n')
	assert.equal(manifest(fixture).upstream.commit, fixture.head)
})

it('unknown changes block apply and preserve the baseline', () => {
	const fixture = createFixture({
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'app/clean.vue'), 'clean-new\n')
			writeFileSync(join(upstream, 'not-classified.txt'), 'unknown\n')
			commit(upstream, 'unknown file')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 1)
	assert.match(result.stderr, /存在 1 个未分类文件/)
	assert.equal(read(fixture, 'app/clean.vue'), 'clean-old\n')
	assert.equal(manifest(fixture).upstream.commit, fixture.baseline)
})

it('exclude, transform, and manual take precedence over broad include patterns', () => {
	const fixture = createFixture({
		manifestPatch: {
			include: ['app/**', 'config/**'],
			exclude: ['config/excluded.txt', 'config/overlap.txt'],
			transform: ['config/transform.ts', 'config/overlap.txt'],
			manual: ['config/manual.ts', 'config/overlap.txt'],
		},
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'app/clean.vue'), 'clean-new\n')
			for (const path of ['config/excluded.txt', 'config/transform.ts', 'config/manual.ts', 'config/overlap.txt']) {
				writeFileSync(join(upstream, path), `${path}-new\n`)
			}
			commit(upstream, 'priority')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 0)
	assert.equal(read(fixture, 'app/clean.vue'), 'clean-new\n')
	assert.equal(read(fixture, 'config/excluded.txt'), 'excluded-old\n')
	assert.equal(read(fixture, 'config/transform.ts'), 'transform-old\n')
	assert.equal(read(fixture, 'config/manual.ts'), 'manual-old\n')
	assert.equal(read(fixture, 'config/overlap.txt'), 'overlap-old\n')
	assert.match(result.stdout, /已排除（exclude，忽略）（2）：[\s\S]*config\/overlap\.txt/)
	assert.doesNotMatch(result.stdout, /派生文件（transform，需按上游变更重构 Theme 版本）（2）：[\s\S]*config\/overlap\.txt/)
	assert.equal(manifest(fixture).upstream.commit, fixture.head)
})

it('verify fails when the manifest baseline is behind upstream', () => {
	const fixture = createFixture()
	writeFileSync(join(fixture.upstream, 'app/clean.vue'), 'clean-new\n')
	commit(fixture.upstream, 'advance upstream')

	const result = spawnSync(process.execPath, [fixture.script, 'verify'], {
		cwd: fixture.theme,
		encoding: 'utf8',
		stdio: CHILD_STDIO,
	})

	assert.equal(result.status, 1)
	assert.match(result.stderr, /基线 .* 落后于/)
})

it('failed post-apply verify rolls back all files and the manifest', () => {
	const fixture = createFixture({
		verifyFails: true,
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'app/clean.vue'), 'clean-new\n')
			writeFileSync(join(upstream, 'app/new.vue'), 'new\n')
			commit(upstream, 'update')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 1)
	assert.match(result.stderr, /同步提交失败，已回滚/)
	assert.equal(read(fixture, 'app/clean.vue'), 'clean-old\n')
	assert.equal(exists(join(fixture.theme, 'app/new.vue')), false)
	assert.equal(manifest(fixture).upstream.commit, fixture.baseline)
	assert.equal(gitStatus(fixture.theme), '')
})

/** 与真实 sync-manifest.json 保持一致的 src/ 源码布局映射 */
const srcLayoutPathMap = {
	'app/': 'src/',
	'modules/': 'src/modules/',
	'public/': 'src/public/',
	'remark-plugins/': 'src/remark-plugins/',
	'server/': 'src/server/',
	'shared/': 'src/shared/',
}

const mappedInitialFiles = {
	'app/assets/logo.svg': 'logo-old\n',
	'app/components/Clean.vue': 'clean-old\n',
	'modules/site.ts': 'module-old\n',
	'public/assets/atom.css': 'atom-old\n',
	'remark-plugins/remark-test.mjs': 'plugin-old\n',
	'server/api/hello.get.ts': 'hello-old\n',
	'shared/utils/link.ts': 'link-old\n',
	'unmapped/keep.txt': 'keep-old\n',
}

const mappedInclude = [
	'app/**',
	'modules/**',
	'public/**',
	'remark-plugins/**',
	'server/**',
	'shared/**',
	'unmapped/**',
]

it('pathMap applies every synced upstream prefix into the src/ layout', () => {
	const updates = {
		'app/assets/logo.svg': 'logo-new\n',
		'app/components/Clean.vue': 'clean-new\n',
		'modules/site.ts': 'module-new\n',
		'public/assets/atom.css': 'atom-new\n',
		'remark-plugins/remark-test.mjs': 'plugin-new\n',
		'server/api/hello.get.ts': 'hello-new\n',
		'shared/utils/link.ts': 'link-new\n',
	}
	const fixture = createFixture({
		files: mappedInitialFiles,
		manifestPatch: {
			include: mappedInclude,
			pathMap: srcLayoutPathMap,
		},
		updateUpstream(upstream) {
			for (const [path, value] of Object.entries(updates)) {
				writeFileSync(join(upstream, path), value)
			}
			commit(upstream, 'update all mapped prefixes')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 0)
	assert.equal(read(fixture, 'src/assets/logo.svg'), 'logo-new\n')
	assert.equal(read(fixture, 'src/components/Clean.vue'), 'clean-new\n')
	assert.equal(read(fixture, 'src/modules/site.ts'), 'module-new\n')
	assert.equal(read(fixture, 'src/public/assets/atom.css'), 'atom-new\n')
	assert.equal(read(fixture, 'src/remark-plugins/remark-test.mjs'), 'plugin-new\n')
	assert.equal(read(fixture, 'src/server/api/hello.get.ts'), 'hello-new\n')
	assert.equal(read(fixture, 'src/shared/utils/link.ts'), 'link-new\n')
	assert.match(result.stdout, /\+ src\/components\/Clean\.vue/)
	assert.doesNotMatch(result.stdout, /\+ app\/components\/Clean\.vue/)
	assert.equal(manifest(fixture).upstream.commit, fixture.head)
})

it('pathMap maps upstream deletions to their src/ destination', () => {
	const fixture = createFixture({
		files: mappedInitialFiles,
		manifestPatch: {
			include: mappedInclude,
			pathMap: srcLayoutPathMap,
		},
		updateUpstream(upstream) {
			rmSync(join(upstream, 'app/components/Clean.vue'))
			commit(upstream, 'delete mapped file')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 0)
	assert.equal(exists(join(fixture.theme, 'src/components/Clean.vue')), false)
	assert.equal(read(fixture, 'src/assets/logo.svg'), 'logo-old\n')
	assert.equal(manifest(fixture).upstream.commit, fixture.head)
})

it('pathMap conflicts compare the mapped local file against the upstream baseline', () => {
	const fixture = createFixture({
		files: mappedInitialFiles,
		manifestPatch: {
			include: mappedInclude,
			pathMap: srcLayoutPathMap,
		},
		updateTheme(theme) {
			writeFileSync(join(theme, 'src/components/Clean.vue'), 'theme-adapted\n')
		},
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'app/components/Clean.vue'), 'clean-new\n')
			writeFileSync(join(upstream, 'app/assets/logo.svg'), 'logo-new\n')
			commit(upstream, 'update mapped files')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 1)
	assert.match(result.stderr, /存在冲突/)
	assert.equal(read(fixture, 'src/components/Clean.vue'), 'theme-adapted\n')
	assert.equal(read(fixture, 'src/assets/logo.svg'), 'logo-old\n')
	assert.equal(manifest(fixture).upstream.commit, fixture.baseline)
})

it('paths outside pathMap keep identity mapping', () => {
	const fixture = createFixture({
		files: mappedInitialFiles,
		manifestPatch: {
			include: mappedInclude,
			pathMap: srcLayoutPathMap,
		},
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'unmapped/keep.txt'), 'keep-new\n')
			commit(upstream, 'update unmapped file')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 0)
	assert.equal(read(fixture, 'unmapped/keep.txt'), 'keep-new\n')
	assert.equal(manifest(fixture).upstream.commit, fixture.head)
})

it('invalid pathMap prefixes are rejected before any sync mode runs', () => {
	const fixture = createFixture({
		files: mappedInitialFiles,
		manifestPatch: {
			include: mappedInclude,
			pathMap: { app: 'src/' },
		},
	})
	const result = runApply(fixture)

	assert.notEqual(result.status, 0)
	assert.match(result.stderr, /pathMap .*必须是安全的相对目录前缀（以 \/ 结尾）/)
	assert.equal(manifest(fixture).upstream.commit, fixture.baseline)
})

// ---------------------------------------------------------------------------
// parity manifest 集成（Phase 6 演练修复）
// ---------------------------------------------------------------------------

const mechanicalFiles = {
	'app/mech.vue': 'import type { Feed } from \'~/types/feed\'\nconst label = \'old\'\n',
}
const mechanicalRecords = {
	'app/mech.vue': {
		class: 'mechanical',
		replacements: [['from \'~/types/feed\'', 'from \'../../types/feed\'']],
		reason: 'Layer 内部类型引用不能使用消费项目的 ~ 别名，改为相对路径',
	},
}

it('a newly added upstream file still receives its declared mechanical transform', () => {
	const fixture = createFixture({
		parityRecords: {
			'app/added.vue': {
				class: 'mechanical',
				replacements: [['from \'~/types/feed\'', 'from \'../../types/feed\'']],
				reason: 'Layer 内部类型引用不能使用消费项目的 ~ 别名，改为相对路径',
			},
		},
		updateUpstream(upstream) {
			// 上游新增一个仍使用消费项目别名的文件
			writeFileSync(join(upstream, 'app/added.vue'), 'import type { Feed } from \'~/types/feed\'\nadded\n')
			commit(upstream, 'add alias-using file')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 0, result.stderr)
	assert.equal(read(fixture, 'app/added.vue'), 'import type { Feed } from \'../../types/feed\'\nadded\n')
})

it('declared mechanical transform is applied when syncing an upstream change', () => {
	const fixture = createFixture({
		files: mechanicalFiles,
		parityRecords: mechanicalRecords,
		updateTheme(theme) {
			// Theme 侧存的是「基线 + 声明替换」的形态
			writeFileSync(join(theme, 'app/mech.vue'), mechanicalFiles['app/mech.vue'].replace('from \'~/types/feed\'', 'from \'../../types/feed\''))
		},
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'app/mech.vue'), 'import type { Feed } from \'~/types/feed\'\nconst label = \'new\'\n')
			commit(upstream, 'update mechanical file')
		},
	})
	const result = runApply(fixture)

	assert.equal(result.status, 0, result.stderr)
	assert.equal(
		read(fixture, 'app/mech.vue'),
		'import type { Feed } from \'../../types/feed\'\nconst label = \'new\'\n',
	)
	assert.equal(manifest(fixture).upstream.commit, fixture.head)
})

it('a stale mechanical transform fails loudly instead of writing unreplaced content', () => {
	const fixture = createFixture({
		files: mechanicalFiles,
		parityRecords: mechanicalRecords,
		updateTheme(theme) {
			writeFileSync(join(theme, 'app/mech.vue'), mechanicalFiles['app/mech.vue'].replace('from \'~/types/feed\'', 'from \'../../types/feed\''))
		},
		updateUpstream(upstream) {
			// 上游把别名换掉了：声明里的替换片段在新内容中不再存在
			writeFileSync(join(upstream, 'app/mech.vue'), 'import type { Feed } from \'~/types/other\'\nconst label = \'new\'\n')
			commit(upstream, 'rewrite alias')
		},
	})
	const result = runApply(fixture)

	assert.notEqual(result.status, 0)
	assert.match(result.stderr, /找不到声明的机械替换片段/)
	assert.equal(manifest(fixture).upstream.commit, fixture.baseline)
})

it('boundary-declared upstream changes block apply and are not reported as unknown', () => {
	const fixture = createFixture({
		parityRecords: {
			'app/clean.vue': { class: 'boundary', reason: 'Theme 边界文件' },
		},
		updateUpstream(upstream) {
			writeFileSync(join(upstream, 'app/clean.vue'), 'clean-new\n')
			commit(upstream, 'update boundary file')
		},
	})
	const result = runApply(fixture)

	assert.notEqual(result.status, 0)
	assert.match(result.stdout, /边界文件（boundary \/ bugfix/)
	assert.doesNotMatch(result.stdout, /未分类（请更新 sync-manifest\.json）/)
	assert.match(result.stderr, /边界文件的上游变更/)
	assert.equal(read(fixture, 'app/clean.vue'), 'clean-old\n')
	assert.equal(manifest(fixture).upstream.commit, fixture.baseline)
})

it('--ref targets a non-default upstream branch', () => {
	const fixture = createFixture({
		updateUpstream(upstream) {
			git(['switch', '--quiet', '-c', 'future'], upstream)
			writeFileSync(join(upstream, 'app/clean.vue'), 'future-content\n')
			commit(upstream, 'advance future branch')
			git(['switch', '--quiet', 'main'], upstream)
		},
	})
	const futureHead = git(['rev-parse', 'future'], fixture.upstream).trim()
	const result = runApply(fixture, ['apply', '--ref', 'future'])

	assert.equal(result.status, 0, result.stderr)
	assert.equal(read(fixture, 'app/clean.vue'), 'future-content\n')
	assert.equal(manifest(fixture).upstream.commit, futureHead)
	assert.notEqual(futureHead, fixture.head)
})

function createFixture(options = {}) {
	const root = mkdtempSync(join(tmpdir(), 'clarity-sync-test-'))
	const upstream = join(root, 'upstream')
	const theme = join(root, 'theme')
	const manifest = {
		upstream: {
			repo: upstream,
			branch: 'main',
			commit: '',
			syncedAt: '2000-01-01T00:00:00.000Z',
		},
		include: ['app/**'],
		exclude: ['content/**'],
		transform: ['config/transform.ts'],
		manual: ['config/manual.ts'],
		...options.manifestPatch,
	}

	initGit(upstream)
	writeInitialFiles(upstream, options.files ?? initialFiles)
	commit(upstream, 'baseline')
	manifest.upstream.commit = git(['rev-parse', 'HEAD'], upstream).trim()

	initGit(theme)
	writeInitialFiles(theme, options.files ?? initialFiles, manifest.pathMap ?? {})
	options.updateTheme?.(theme)
	mkdirSync(join(theme, 'scripts'), { recursive: true })
	writeFileSync(join(theme, 'scripts', 'verify-theme.mjs'), options.verifyFails
		? '#!/usr/bin/env node\nprocess.exit(1)\n'
		: '#!/usr/bin/env node\n')
	writeFileSync(join(theme, 'sync-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
	if (options.parityRecords) {
		mkdirSync(join(theme, 'tests'), { recursive: true })
		writeFileSync(
			join(theme, 'tests', 'upstream-parity.manifest.json'),
			`${JSON.stringify({ records: options.parityRecords }, null, 2)}\n`,
		)
	}
	const script = join(theme, 'scripts', 'sync-upstream.mjs')
	cpSync(syncScript, script)
	commit(theme, 'theme baseline')

	options.updateUpstream?.(upstream)
	return {
		root,
		upstream,
		theme,
		script,
		baseline: manifest.upstream.commit,
		head: git(['rev-parse', 'HEAD'], upstream).trim(),
	}
}

function writeInitialFiles(directory, files, pathMap = {}) {
	for (const [path, value] of Object.entries(files)) {
		const mappedPath = mapPath(path, pathMap)
		mkdirSync(join(directory, ...mappedPath.split('/').slice(0, -1)), { recursive: true })
		writeFileSync(join(directory, mappedPath), value)
	}
}

function mapPath(path, pathMap) {
	for (const [from, to] of Object.entries(pathMap)) {
		if (path.startsWith(from)) {
			return `${to}${path.slice(from.length)}`
		}
	}
	return path
}

function initGit(directory) {
	mkdirSync(directory, { recursive: true })
	git(['init', '--initial-branch=main', '.'], directory)
	git(['config', 'core.autocrlf', 'false'], directory)
	git(['config', 'user.email', 'test@example.test'], directory)
	git(['config', 'user.name', 'Clarity Test'], directory)
}

function commit(directory, message) {
	git(['add', '.'], directory)
	git(['commit', '-m', message], directory)
}

function git(args, cwd) {
	// 忽略 stdin：Windows 下继承调用方句柄会让 git 偶发 EBUSY（见 scripts/sync-upstream.mjs 同注释）
	return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function runApply(fixture, args = ['apply']) {
	return spawnSync(process.execPath, [fixture.script, ...args], {
		cwd: fixture.theme,
		encoding: 'utf8',
		stdio: CHILD_STDIO,
	})
}

function gitStatus(directory) {
	return git(['status', '--porcelain', '--untracked-files=all'], directory).trim()
}

function read(fixture, path) {
	return readFileSync(join(fixture.theme, path), 'utf8')
}

function manifest(fixture) {
	return JSON.parse(readFileSync(join(fixture.theme, 'sync-manifest.json'), 'utf8'))
}

function exists(path) {
	try {
		readFileSync(path)
		return true
	}
	catch {
		return false
	}
}
