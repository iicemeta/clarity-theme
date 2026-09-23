import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
/* eslint-disable no-console -- command progress is useful during long E2E runs */
import { readFileSync, rmSync } from 'node:fs'
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

it('source CLI generates an independent consumer that installs, typechecks, and generates', { timeout: 20 * 60 * 1000 }, () => {
	const workDir = createWorkDirectory('create-clarity-consumer-')
	console.log(`  Work directory: ${workDir}`)

	try {
		const generated = spawnSync(process.execPath, [
			cliPath,
			'my-blog',
			'--yes',
			'--package-manager',
			'pnpm',
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
		const lockfile = readFileSync(join(consumer, 'pnpm-lock.yaml'), 'utf8')
		assert.match(lockfile, /clarity-theme@0\.1\.2:/)
		assert.doesNotMatch(lockfile, /clarity-theme@(?:file|link):/)
		run('pnpm', ['exec', 'nuxt', 'typecheck'], consumer)
		run('pnpm', ['exec', 'nuxt', 'generate'], consumer)
		assertGenerateOutput(consumer)

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
