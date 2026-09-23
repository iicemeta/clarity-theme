import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export function assertGeneratedFiles(consumer) {
	const required = [
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
	]
	for (const file of required) {
		assert.equal(existsSync(join(consumer, file)), true, `missing ${file}`)
	}

	const clarityConfig = readFileSync(join(consumer, 'clarity.config.ts'), 'utf8')
	assert.doesNotMatch(clarityConfig, /\{\{[A-Z0-9_]+\}\}/)
	assert.match(readFileSync(join(consumer, 'nuxt.config.ts'), 'utf8'), /extends: \['clarity-theme'\]/)

	const pkg = JSON.parse(readFileSync(join(consumer, 'package.json'), 'utf8'))
	assert.equal(pkg.scripts['new-blog'], 'node scripts/new-blog.mjs', 'new-blog script')
	assert.equal(pkg.scripts.new, 'node scripts/new-blog.mjs', 'new alias script')
}

export function assertGenerateOutput(consumer, { expectedPosts = 1, titles = [] } = {}) {
	const output = join(consumer, '.output', 'public')
	assert.equal(existsSync(output), true, 'generate output exists')

	const welcome = readGeneratedPage(output, 'welcome')
	assert.match(welcome, /Welcome to Clarity Theme/)
	for (const title of titles) {
		assert.equal(findGeneratedTitle(output, title), true, `generated page contains ${title}`)
	}
	const atom = readFileSync(join(output, 'atom.xml'), 'utf8')
	assert.match(atom, /https:\/\/create-e2e\.example\.com\//)
	assert.equal(existsSync(join(output, 'subscriptions.opml')), true, 'OPML output exists')
	const stats = JSON.parse(readFileSync(join(output, 'api', 'stats'), 'utf8'))
	assert.equal(stats.total?.posts, expectedPosts)
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

function findGeneratedTitle(directory, title) {
	for (const entry of readdirSync(directory)) {
		const fullPath = join(directory, entry)
		if (statSync(fullPath).isDirectory()) {
			if (findGeneratedTitle(fullPath, title)) {
				return true
			}
			continue
		}
		if (!entry.endsWith('.html')) {
			continue
		}
		if (readFileSync(fullPath, 'utf8').includes(title)) {
			return true
		}
	}
	return false
}
