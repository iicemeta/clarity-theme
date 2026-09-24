import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
/* eslint-disable no-console -- command progress is useful during long E2E runs */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
// The generated-consumer E2E intentionally uses Node's built-in runner.
// eslint-disable-next-line test/no-import-node-test
import { it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { assertGeneratedFiles, assertGenerateOutput } from './assertions.mjs'
import { createWorkDirectory, run } from './helpers.mjs'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const cliPath = join(repositoryRoot, 'create-clarity-theme', 'src', 'cli.mjs')
const themePackage = readJson(join(repositoryRoot, 'package.json'))
const templatePackage = readJson(join(repositoryRoot, 'create-clarity-theme', 'templates', 'default', 'package.json'))
const declaredRange = templatePackage.dependencies['clarity-theme']

it('source CLI generates an independent consumer that installs, typechecks, and generates', { timeout: 25 * 60 * 1000 }, () => {
	const workDir = createWorkDirectory('create-clarity-consumer-')
	console.log(`  Work directory: ${workDir}`)

	try {
		assert.match(declaredRange, /^\^\d+\.\d+\.\d+$/, 'creator template must declare a caret range for clarity-theme')

		const generated = spawnSync(process.execPath, [
			cliPath,
			'my-blog',
			'--yes',
			'--package-manager',
			'pnpm',
			'--no-install',
			'--title',
			'Create E2E',
			'--description',
			'Independent generated consumer',
			'--url',
			'https://create-e2e.example.com/',
			'--author',
			'Create E2E',
		], {
			cwd: workDir,
			encoding: 'utf8',
			env: { ...process.env, NO_COLOR: '1' },
		})
		assert.equal(generated.status, 0, generated.stderr)

		const consumer = join(workDir, 'my-blog')
		assertGeneratedFiles(consumer)
		const generatedPackage = readJson(join(consumer, 'package.json'))
		assert.equal(
			generatedPackage.dependencies['clarity-theme'],
			declaredRange,
			'CLI must carry the creator-template Theme range into package.json unchanged',
		)

		const published = latestPublishedVersion(declaredRange)
		if (published) {
			console.log(`  Theme source: npm registry (clarity-theme@${published} satisfies ${declaredRange})`)
			run('pnpm', ['install'], consumer)
			const lockfile = readFileSync(join(consumer, 'pnpm-lock.yaml'), 'utf8')
			const resolution = matchLockfileResolution(lockfile)
			assert.ok(resolution, 'pnpm-lock.yaml must record the clarity-theme resolution')
			assert.equal(resolution.specifier, declaredRange, 'lockfile specifier must equal the package.json range')
			assert.ok(
				satisfiesRange(resolution.version, declaredRange),
				`lockfile resolved version ${resolution.version} must satisfy ${declaredRange}`,
			)
			assert.doesNotMatch(lockfile, /clarity-theme@(?:file|link):/)
		}
		else {
			// Release-preparation window: the template targets the Theme release
			// being prepared, which is not published yet. Exercise the exact
			// release candidate through the packed tarball; the registry path is
			// re-verified after publishing by CI and `pnpm test:registry-consumer`.
			console.log(`  Theme source: local release tarball (${declaredRange} has no published version yet)`)
			run('pnpm', ['pack', '--pack-destination', workDir], repositoryRoot)
			const tarball = findThemeTarball(workDir)
			generatedPackage.dependencies['clarity-theme'] = `file:${tarball}`
			writeFileSync(join(consumer, 'package.json'), `${JSON.stringify(generatedPackage, null, 2)}\n`)
			run('pnpm', ['install', '--no-frozen-lockfile'], consumer)
			const installedTheme = readJson(join(consumer, 'node_modules', 'clarity-theme', 'package.json'))
			assert.equal(installedTheme.version, themePackage.version, 'local tarball must install the prepared Theme version')
		}

		run('pnpm', ['new-blog', 'Create E2E Article', '--yes'], consumer)
		const articlePath = findGeneratedArticle(consumer, 'create-e2e-article.md')
		assert.equal(existsSync(articlePath), true, `new-blog created ${articlePath}`)
		const article = readFileSync(articlePath, 'utf8')
		assert.match(article, /title: "?Create E2E Article"?/)
		assert.match(article, /draft: false/)
		assert.match(article, /type: tech/)
		assert.match(article, / {2}- "?未分类"?/)

		run('pnpm', ['exec', 'nuxt', 'typecheck'], consumer)
		run('pnpm', ['exec', 'nuxt', 'generate'], consumer)
		assertGenerateOutput(consumer, {
			expectedPosts: 2,
			titles: ['Create E2E Article'],
		})

		console.log('\n✔ Source CLI consumer E2E passed')
	}
	finally {
		if (process.exitCode !== 1) {
			rmSync(workDir, { recursive: true, force: true })
		}
		else {
			console.error(`  Debug directory retained: ${workDir}`)
		}
	}
})

function findGeneratedArticle(consumer, fileName) {
	const postsRoot = join(consumer, 'content', 'posts')
	for (const entry of readdirSync(postsRoot)) {
		const candidate = join(postsRoot, entry, fileName)
		if (existsSync(candidate)) {
			return candidate
		}
	}
	return join(postsRoot, fileName)
}

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'))
}

function findThemeTarball(directory) {
	const tarball = readdirSync(directory).find(file => /^clarity-theme-.*\.tgz$/.test(file))
	assert.ok(tarball, `expected a packed clarity-theme tarball in ${directory}`)
	return join(directory, tarball).replaceAll('\\', '/')
}

function latestPublishedVersion(range) {
	// Fixed command string + shell: avoids the Node DEP0190 args/shell escape pitfall.
	const result = spawnSync('npm view clarity-theme versions --json', {
		encoding: 'utf8',
		shell: true,
		env: { ...process.env, NO_COLOR: '1' },
	})
	assert.equal(result.status, 0, result.stderr?.trim() || 'npm view clarity-theme versions failed')
	return JSON.parse(result.stdout)
		.filter(version => /^\d+\.\d+\.\d+$/.test(version))
		.filter(version => satisfiesRange(version, range))
		.sort(compareVersions)
		.at(-1)
}

function matchLockfileResolution(lockfile) {
	const match = lockfile.match(/clarity-theme:\s+specifier:\s*(\S+)\s+version:\s*(\S+)/)
	if (!match)
		return undefined
	// pnpm may append a patch-instance suffix, for example `0.1.3(abc123…)`.
	const version = /^\d+\.\d+\.\d+/.exec(match[2])?.[0]
	return version ? { specifier: match[1], version } : undefined
}

function caretBounds(range) {
	const match = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range)
	assert.ok(match, `unsupported Theme range for E2E assertions: ${range}`)
	const [, major, minor, patch] = match
	const lower = `${major}.${minor}.${patch}`
	// npm node-semver: ^1.2.3 / ^0.2.3 allow changes that do not modify the
	// left-most non-zero digit; ^0.0.3 only allows that exact patch version.
	const upper = (Number(major) === 0 && Number(minor) === 0)
		? `0.0.${Number(patch) + 1}`
		: `${major}.${Number(minor) + 1}.0`
	return { lower, upper }
}

function satisfiesRange(version, range) {
	assert.match(version, /^\d+\.\d+\.\d+$/, `E2E range checks support stable versions only, got ${version}`)
	const { lower, upper } = caretBounds(range)
	return compareVersions(version, lower) >= 0 && compareVersions(version, upper) < 0
}

function compareVersions(a, b) {
	const left = a.split('.').map(Number)
	const right = b.split('.').map(Number)
	for (let index = 0; index < 3; index++) {
		if (left[index] !== right[index])
			return left[index] < right[index] ? -1 : 1
	}
	return 0
}
