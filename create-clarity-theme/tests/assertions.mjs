import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function assertGeneratedFiles(consumer) {
	const required = [
		'app/app.config.ts',
		'content/posts/welcome.md',
		'public/favicon.svg',
		'clarity.config.ts',
		'content.config.ts',
		'feeds.ts',
		'nuxt.config.ts',
		'package.json',
		'pnpm-workspace.yaml',
		'tsconfig.json',
		'.gitignore',
	]
	for (const file of required) {
		assert.equal(existsSync(join(consumer, file)), true, `missing ${file}`)
	}

	const clarityConfig = readFileSync(join(consumer, 'clarity.config.ts'), 'utf8')
	assert.doesNotMatch(clarityConfig, /\{\{[A-Z0-9_]+\}\}/)
	assert.match(readFileSync(join(consumer, 'nuxt.config.ts'), 'utf8'), /extends: \['clarity-theme'\]/)
}

export function assertGenerateOutput(consumer) {
	const output = join(consumer, '.output', 'public')
	assert.equal(existsSync(output), true, 'generate output exists')

	const welcome = readGeneratedPage(output, 'welcome')
	assert.match(welcome, /Welcome to Clarity Theme/)
	const atom = readFileSync(join(output, 'atom.xml'), 'utf8')
	assert.match(atom, /https:\/\/create-e2e\.example\.com\//)
	const stats = JSON.parse(readFileSync(join(output, 'api', 'stats'), 'utf8'))
	assert.equal(stats.total?.posts, 1)
}

function readGeneratedPage(output, route) {
	const candidates = [
		join(output, route, 'index.html'),
		join(output, `${route}.html`),
	]
	const file = candidates.find(existsSync)
	assert.ok(file, `welcome output exists (${candidates.join(' or ')})`)
	return readFileSync(file, 'utf8')
}
