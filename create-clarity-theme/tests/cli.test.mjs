import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
// The CLI regression suite intentionally uses Node's built-in runner.
// eslint-disable-next-line test/no-import-node-test
import { it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { detectTimezone, FALLBACK_TIMEZONE } from '../src/timezone.mjs'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const cliPath = join(packageRoot, 'src', 'cli.mjs')
const cliPackage = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
const templatePackage = JSON.parse(readFileSync(join(packageRoot, 'templates', 'default', 'package.json'), 'utf8'))
const templateThemeRange = templatePackage.dependencies['clarity-theme']

it('cLI prints help', () => {
	const result = runCli(['--help'])

	assert.equal(result.status, 0, result.stderr)
	assert.match(result.stdout, /create-clarity-theme \[project-directory\]/)
	assert.match(result.stdout, /--no-install/)
})

it('cLI prints its version', () => {
	const result = runCli(['--version'])

	assert.equal(result.status, 0, result.stderr)
	assert.equal(result.stdout.trim(), cliPackage.version)
})

it('cLI prompts for a missing project directory and accepts defaults', () => {
	withTemporaryDirectory((workDir) => {
		const result = runCli(['--no-install'], {
			cwd: workDir,
			input: `${['my-blog', '', '', '', '', '', ''].join('\n')}\n`,
		})
		const project = join(workDir, 'my-blog')

		assert.equal(result.status, 0, result.stderr)
		assert.match(result.stdout, /\? Project name/)
		assert.match(result.stdout, /\? Site title › My Blog/)
		assert.match(result.stdout, /\? Site description › My personal blog built with Clarity Theme/)
		assert.match(result.stdout, /\? Site URL › https:\/\/example\.com\//)
		assert.match(result.stdout, /\? Author name › Your Name/)
		assert.match(result.stdout, /\? Language › zh-CN/)
		assert.match(result.stdout, /Detected from your system/)
		assert.match(result.stdout, new RegExp(`\\? Timezone › ${escapeRegExp(detectTimezone())}`))
		assertGeneratedProject(project, {
			name: 'my-blog',
			title: 'My Blog',
			url: 'https://example.com/',
			author: 'Your Name',
			language: 'zh-CN',
			timezone: detectTimezone(),
		})
	})
})

it('cLI creates a project in an empty directory with --yes', () => {
	withTemporaryDirectory((workDir) => {
		const result = runCli(['my-blog', '--yes', '--no-install'], { cwd: workDir })
		const project = join(workDir, 'my-blog')

		assert.equal(result.status, 0, result.stderr)
		assertGeneratedProject(project, {
			name: 'my-blog',
			title: 'My Blog',
			url: 'https://example.com/',
			author: 'Your Name',
			language: 'zh-CN',
			timezone: detectTimezone(),
		})
		assert.match(result.stdout, /Dependency installation skipped/)
		assert.match(result.stdout, /Upstream example content/)
		assert.match(result.stdout, /169994096/)
		assert.match(result.stdout, /app\/components\/widget\/CommGroup\.vue/)
		assert.match(result.stdout, /app\/components\/widget\/BlogLog\.vue/)
	})
})

it('cLI --yes uses the timezone detected in its own process environment', () => {
	withTemporaryDirectory((workDir) => {
		const shouldHonorTzEnv = process.platform !== 'win32'
		const result = runCli(['tz-blog', '--yes', '--no-install'], {
			cwd: workDir,
			env: shouldHonorTzEnv ? { TZ: 'Asia/Tokyo' } : undefined,
		})
		const expectedTimezone = shouldHonorTzEnv ? 'Asia/Tokyo' : detectTimezone()

		assert.equal(result.status, 0, result.stderr)
		assertGeneratedProject(join(workDir, 'tz-blog'), {
			name: 'tz-blog',
			title: 'Tz Blog',
			url: 'https://example.com/',
			author: 'Your Name',
			language: 'zh-CN',
			timezone: expectedTimezone,
		})
	})
})

it('cLI --timezone overrides the detected system timezone', () => {
	withTemporaryDirectory((workDir) => {
		const result = runCli(['tz-blog', '--yes', '--no-install', '--timezone', 'America/New_York'], {
			cwd: workDir,
			env: process.platform === 'win32' ? undefined : { TZ: 'Asia/Tokyo' },
		})

		assert.equal(result.status, 0, result.stderr)
		assertGeneratedProject(join(workDir, 'tz-blog'), {
			name: 'tz-blog',
			title: 'Tz Blog',
			url: 'https://example.com/',
			author: 'Your Name',
			language: 'zh-CN',
			timezone: 'America/New_York',
		})
	})
})

it('timezone detection validates ICU output and falls back to UTC', () => {
	assert.equal(FALLBACK_TIMEZONE, 'UTC')
	assert.equal(detectTimezone(() => 'Asia/Tokyo'), 'Asia/Tokyo')
	assert.equal(detectTimezone(() => undefined), 'UTC')
	assert.equal(detectTimezone(() => 'Not/AZone'), 'UTC')
	assert.equal(detectTimezone(() => {
		throw new Error('ICU unavailable')
	}), 'UTC')
})

it('cLI cancels cleanly on the Ctrl+C byte without writing a project', () => {
	withTemporaryDirectory((workDir) => {
		const result = runCli(['--no-install'], { cwd: workDir, input: '\x03' })

		assert.notEqual(result.status, 0)
		assert.match(result.stderr, /Prompt cancelled\./)
		assert.equal(existsSync(join(workDir, 'my-blog')), false)
	})
})

it('cLI replaces Unicode template variables and normalizes the URL', () => {
	withTemporaryDirectory((workDir) => {
		const result = runCli([
			'my-blog',
			'--yes',
			'--no-install',
			'--title',
			'你好，Miku\'s "Clarity" Blog',
			'--description',
			'一個可以立即執行的 Nuxt\\Blog 部落格',
			'--url',
			'https://example.com',
			'--author',
			'Miku',
			'--language',
			'zh-TW',
			'--timezone',
			'Asia/Taipei',
		], { cwd: workDir })
		const project = join(workDir, 'my-blog')

		assert.equal(result.status, 0, result.stderr)
		assertGeneratedProject(project, {
			name: 'my-blog',
			title: '你好，Miku\'s "Clarity" Blog',
			description: '一個可以立即執行的 Nuxt\\Blog 部落格',
			url: 'https://example.com/',
			author: 'Miku',
			language: 'zh-TW',
			timezone: 'Asia/Taipei',
		})
	})
})

it('cLI creates nested projects from Windows-style paths', () => {
	withTemporaryDirectory((workDir) => {
		const projectArgument = join('apps', 'my-blog')
		const result = runCli([projectArgument, '--yes', '--no-install'], { cwd: workDir })
		const project = join(workDir, 'apps', 'my-blog')

		assert.equal(result.status, 0, result.stderr)
		assert.equal(existsSync(join(project, 'package.json')), true)
		assert.equal(JSON.parse(readFileSync(join(project, 'package.json'), 'utf8')).name, 'my-blog')
	})
})

it('cLI selects a safe package manager and validates explicit values', () => {
	withTemporaryDirectory((workDir) => {
		const result = runCli(['my-blog', '--yes', '--no-install', '--package-manager', 'npm'], { cwd: workDir })

		assert.equal(result.status, 0, result.stderr)
		assert.match(result.stdout, /npm install/)
		assert.match(result.stdout, /npm run dev/)

		const invalid = runCli(['invalid-package-manager', '--yes', '--no-install', '--pm', 'shell-injection'], { cwd: workDir })
		assert.notEqual(invalid.status, 0)
		assert.match(invalid.stderr, /Package manager must be pnpm, npm, or yarn\./)
	})
})

it('cLI rejects traversal outside the current directory', () => {
	withTemporaryDirectory((workDir) => {
		const result = runCli([join('..', 'escape'), '--yes', '--no-install'], { cwd: workDir })

		assert.notEqual(result.status, 0)
		assert.match(result.stderr, /must be a new path inside the current directory/)
	})
})

it('cLI rejects invalid URL values before writing files', () => {
	withTemporaryDirectory((workDir) => {
		const result = runCli(['my-blog', '--yes', '--no-install', '--url', 'example.com'], { cwd: workDir })

		assert.notEqual(result.status, 0)
		assert.match(result.stderr, /valid URL/)
		assert.equal(existsSync(join(workDir, 'my-blog')), false)
	})
})

it('cLI refuses a non-empty directory unless explicitly confirmed', () => {
	withTemporaryDirectory((workDir) => {
		const project = join(workDir, 'existing')
		mkdirSync(project, { recursive: true })
		writeFileSync(join(project, 'notes.txt'), 'keep me\n')

		const rejected = runCli([project, '--yes', '--no-install'], { cwd: workDir })
		assert.notEqual(rejected.status, 0)
		assert.match(rejected.stderr, /non-empty directory/)
		assert.equal(readFileSync(join(project, 'notes.txt'), 'utf8'), 'keep me\n')

		const accepted = runCli([
			project,
			'--no-install',
			'--title',
			'Existing',
			'--description',
			'Existing site',
			'--url',
			'https://existing.example.com/',
			'--author',
			'Existing Author',
			'--language',
			'en',
			'--timezone',
			'UTC',
		], { cwd: workDir, input: 'y\n' })

		assert.equal(accepted.status, 0, accepted.stderr)
		assert.equal(readFileSync(join(project, 'notes.txt'), 'utf8'), 'keep me\n')
		assert.equal(existsSync(join(project, 'package.json')), true)
	})
})

it('cLI refuses directories containing a critical project file', () => {
	withTemporaryDirectory((workDir) => {
		const project = join(workDir, 'existing')
		mkdirSync(project, { recursive: true })
		writeFileSync(join(project, 'package.json'), '{"name":"existing"}\n')

		const packageResult = runCli([project, '--yes', '--no-install'], { cwd: workDir })
		assert.notEqual(packageResult.status, 0)
		assert.match(packageResult.stderr, /Refusing to overwrite an existing project/)
		assert.equal(JSON.parse(readFileSync(join(project, 'package.json'), 'utf8')).name, 'existing')

		rmSync(project, { recursive: true, force: true })
		mkdirSync(project, { recursive: true })
		mkdirSync(join(project, 'content'), { recursive: true })
		const contentResult = runCli([project, '--yes', '--no-install'], { cwd: workDir })
		assert.notEqual(contentResult.status, 0)
		assert.match(contentResult.stderr, /Refusing to overwrite an existing project/)
	})
})

it('cLI validates generated JSON and leaves no template variables', () => {
	withTemporaryDirectory((workDir) => {
		const result = runCli(['my-blog', '--yes', '--no-install'], { cwd: workDir })
		const project = join(workDir, 'my-blog')
		assert.equal(result.status, 0, result.stderr)

		const generatedFiles = [
			'package.json',
			'clarity.config.ts',
			'content.config.ts',
			'feeds.ts',
			'nuxt.config.ts',
			'README.md',
		]
		for (const file of generatedFiles) {
			assert.doesNotMatch(readFileSync(join(project, file), 'utf8'), /\{\{[A-Z0-9_]+\}\}/, file)
		}
		assert.doesNotThrow(() => JSON.parse(readFileSync(join(project, 'package.json'), 'utf8')))
		assert.doesNotThrow(() => JSON.parse(readFileSync(join(project, 'tsconfig.json'), 'utf8')))
	})
})

function runCli(args, options = {}) {
	return spawnSync(process.execPath, [cliPath, ...args], {
		cwd: options.cwd ?? packageRoot,
		encoding: 'utf8',
		input: options.input ?? '',
		env: {
			...process.env,
			...options.env,
			NO_COLOR: '1',
			npm_config_user_agent: 'pnpm/12.4.1 node/v24.15.0',
		},
	})
}

function assertGeneratedProject(project, expected) {
	const requiredFiles = [
		'app/app.config.ts',
		'content/posts/welcome.md',
		'scripts/new-blog.mjs',
		'public/favicon.svg',
		'clarity.config.ts',
		'content.config.ts',
		'feeds.ts',
		'nuxt.config.ts',
		'package.json',
		'pnpm-workspace.yaml',
		'tsconfig.json',
		'.gitignore',
		'README.md',
	]
	for (const file of requiredFiles) {
		assert.equal(existsSync(join(project, file)), true, `missing ${file}`)
	}
	assert.equal(existsSync(join(project, 'gitignore')), false, 'unrenamed gitignore template leaked into the consumer')

	const pkg = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8'))
	assert.equal(pkg.name, expected.name)
	assert.equal(pkg.private, true)
	assert.match(templateThemeRange, /^\^\d+\.\d+\.\d+$/, 'template must declare a caret Theme range')
	assert.equal(pkg.dependencies['clarity-theme'], templateThemeRange)
	assert.equal(pkg.scripts['new-blog'], 'node scripts/new-blog.mjs')
	assert.equal(pkg.scripts.new, 'node scripts/new-blog.mjs')
	assert.equal(pkg.scripts['dev:host'], 'nuxt dev --host')

	const clarityConfig = readFileSync(join(project, 'clarity.config.ts'), 'utf8')
	assert.equal(existsSync(join(project, 'nuxt.config.ts')), true)
	assert.match(readFileSync(join(project, 'nuxt.config.ts'), 'utf8'), /extends: \['clarity-theme'\]/)
	assert.match(clarityConfig, new RegExp(`title: '${escapeRegExp(toTypeScriptLiteral(expected.title))}'`))
	assert.match(clarityConfig, new RegExp(`url: '${expected.url}'`))
	assert.match(clarityConfig, new RegExp(`language: '${expected.language}'`))
	assert.match(clarityConfig, new RegExp(`timezone: '${expected.timezone}'`))
	assert.match(clarityConfig, /established: '\d{4}-\d{2}-\d{2}'/)
	if (expected.description) {
		assert.match(clarityConfig, new RegExp(`description: '${escapeRegExp(toTypeScriptLiteral(expected.description))}'`))
	}
	if (expected.author) {
		assert.match(clarityConfig, new RegExp(`name: '${escapeRegExp(expected.author)}'`))
	}
}

function withTemporaryDirectory(callback) {
	const directory = mkdtempSync(join(tmpdir(), 'create-clarity-cli-'))
	let failed = false
	try {
		callback(directory)
	}
	catch (error) {
		failed = true
		throw error
	}
	finally {
		if (failed) {
			console.error(`  Debug directory retained: ${directory}`)
		}
		else {
			rmSync(directory, { recursive: true, force: true })
		}
	}
}

function escapeRegExp(value) {
	return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toTypeScriptLiteral(value) {
	return value.replace(/[\\'"]/g, character => (
		character === '\\' ? '\\\\' : `\\${character}`
	))
}
