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
			execFileSync('git', ['mv', 'app/clean.vue', 'app/renamed.vue'], { cwd: upstream })
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
	writeInitialFiles(upstream)
	commit(upstream, 'baseline')
	manifest.upstream.commit = git(['rev-parse', 'HEAD'], upstream).trim()

	initGit(theme)
	writeInitialFiles(theme)
	options.updateTheme?.(theme)
	mkdirSync(join(theme, 'scripts'), { recursive: true })
	writeFileSync(join(theme, 'scripts', 'verify-theme.mjs'), options.verifyFails
		? '#!/usr/bin/env node\nprocess.exit(1)\n'
		: '#!/usr/bin/env node\n')
	writeFileSync(join(theme, 'sync-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
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

function writeInitialFiles(directory) {
	for (const [path, value] of Object.entries(initialFiles)) {
		mkdirSync(join(directory, ...path.split('/').slice(0, -1)), { recursive: true })
		writeFileSync(join(directory, path), value)
	}
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
	return execFileSync('git', args, { cwd, encoding: 'utf8' })
}

function runApply(fixture) {
	return spawnSync(process.execPath, [fixture.script, 'apply'], {
		cwd: fixture.theme,
		encoding: 'utf8',
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
