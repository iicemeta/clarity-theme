import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
// The migration regression suite intentionally uses Node's built-in runner.
// eslint-disable-next-line test/no-import-node-test
import { describe, it } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const fixtureDir = join(themeDir, 'tests/fixtures/blog-v3-consumer')
const skillDir = join(themeDir, '.agents/skills/migrate-blog-v3-to-clarity')

const plan = readJson(join(fixtureDir, 'migration-plan.json'))

describe('migration skill contract', () => {
	it('exposes standards-compliant instructions and detailed references', () => {
		const skillPath = join(skillDir, 'SKILL.md')
		const skill = read(skillPath)
		const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/)

		assert.ok(frontmatter, 'SKILL.md must start with YAML frontmatter')
		assert.match(frontmatter[1], /^name: migrate-blog-v3-to-clarity$/m)
		assert.match(
			frontmatter[1],
			/^description: Migrate an existing Nuxt 4 blog-v3 project to the Clarity Theme Layer while preserving articles, assets, redirects, patches, custom components, and user-specific integrations\. Use when a user asks to migrate, convert, extract, or adopt Clarity Theme from blog-v3\.$/m,
		)

		for (const reference of ['migration-map.md', 'config-mapping.md', 'validation.md']) {
			assert.ok(existsSync(join(skillDir, 'references', reference)), `missing ${reference}`)
		}

		for (const [section, heading] of [
			['Discovery', '## 1. Discovery'],
			['Inventory', '## 2. Inventory'],
			['Classification', '## 3. Classification'],
			['Plan', '## 4. Plan'],
			['Apply', '## 5. Apply'],
			['Validation', '## 6. Validation'],
			['Migration report', '## 7. Migration report'],
			['Rollback', '## 8. Rollback'],
		]) {
			assert.ok(skill.includes(`\n${heading}\n`), `Skill must contain ${section} section`)
		}
		for (const classification of ['AUTO', 'REVIEW', 'KEEP', 'NEVER_TOUCH']) {
			assert.ok(skill.includes(classification), `Skill must define ${classification}`)
		}
		for (const protectedPath of ['article', 'frontmatter', 'public assets', 'redirects', 'patches', 'custom module', 'server code']) {
			assert.ok(skill.includes(protectedPath), `Skill must protect ${protectedPath}`)
		}
	})
})

describe('fake blog-v3 consumer fixture', () => {
	it('contains the source files required by discovery', () => {
		for (const path of [
			'blog.config.ts',
			'content.config.ts',
			'nuxt.config.ts',
			'app/app.config.ts',
			'app/feeds.ts',
			'app/shiki.config.ts',
			'content/posts/example.md',
			'patches/@nuxtjs__mdc.patch',
			'package.json',
		]) {
			assert.ok(existsSync(join(fixtureDir, path)), `missing discovery file: ${path}`)
		}

		assert.equal(readJson(join(fixtureDir, 'package.json')).version, '3.7.2')
		assert.equal(plan.source.project, 'blog-v3')
		assert.equal(plan.source.version, '3.7.2')
	})

	it('maps root and nested source config into the real Clarity schema', async () => {
		const { defineClarityConfig } = await import(pathToFileURL(join(themeDir, 'config/index.mjs')).href)
		const source = read(join(fixtureDir, 'blog.config.ts'))
		const mapped = defineClarityConfig(plan.expectedClarityConfig)

		assert.equal(mapped.site.title, 'Fixture Blog')
		assert.equal(mapped.site.established, '2020-01-01')
		assert.equal(mapped.site.timezone, 'Asia/Taipei')
		assert.equal(mapped.article.defaultCategory, 'General')
		assert.equal(mapped.article.useRandomPermalink, true)
		assert.equal(mapped.feed.limit, 20)
		assert.equal(mapped.feed.enableStyle, false)
		assert.deepEqual(mapped.stats.includePaths, ['posts/%'])
		assert.equal(mapped.integrations.twikoo?.envId, 'https://twikoo.fixture.example.com/')
		assert.equal(mapped.integrations.scripts.length, 2)

		assert.match(source, /timeEstablished:/)
		assert.match(source, /timeZone:/)
		assert.match(source, /useRandomPremalink:/)
		assert.doesNotMatch(source, /useRandomPermalink:/)
		assert.match(source, /defaultCategory: 'General'/)
	})

	it('keeps the mapped schema compatible with the public Content factory contract', async () => {
		const { defineClarityConfig } = await import(pathToFileURL(join(themeDir, 'config/index.mjs')).href)
		const { createClarityContentConfig } = await import(pathToFileURL(join(themeDir, 'config/content.mjs')).href)
		const config = defineClarityConfig(plan.expectedClarityConfig)
		const factorySource = read(join(themeDir, 'config/content.mjs'))

		// `defineCollection()` also converts the schema to JSON Schema and depends on
		// Nuxt's build-time module resolution. Keep this fixture static here; real
		// Nuxt generation is covered by test:consumer and test:compatibility.
		assert.equal(typeof createClarityContentConfig, 'function')
		assert.match(factorySource, /collections:\s*\{\s*content: defineCollection\(/u)
		assert.match(factorySource, /source: '\*\*'/u)
		assert.match(factorySource, /type: 'page'/u)
		assert.match(factorySource, /createArticleSchema\(parsed\)/u)
		assert.deepEqual(Object.keys(config), ['site', 'article', 'feed', 'stats', 'integrations', 'features', 'changelog'])
	})

	it('requires app config to become a UI-only override', () => {
		const source = read(join(fixtureDir, 'app/app.config.ts'))
		const moduleSource = read(join(themeDir, 'modules/clarity-config/index.ts'))
		const allowedMatch = moduleSource.match(/const uiConfigKeys = new Set\(\[(.*?)\]\)/)
		const allowed = allowedMatch?.[1]
			.split(',')
			.map(value => value.trim().replaceAll('\'', ''))
			.filter(Boolean)

		assert.deepEqual(allowed, ['component', 'footer', 'header', 'link', 'nav', 'pagination', 'themes'])
		assert.deepEqual(Object.keys(plan.expectedUi), ['component', 'header', 'nav', 'pagination'])
		assert.match(source, /\.\.\.blogConfig/)
		assert.doesNotMatch(source, /clarity\s*:/)
		assert.equal(plan.assets.find(item => item.path === 'app/app.config.ts')?.action, 'convert-to-ui-only')
	})

	it('covers Twikoo, feed, and stats migration', () => {
		const source = read(join(fixtureDir, 'blog.config.ts'))

		assert.match(source, /twikoo:/)
		assert.match(source, /feed:/)
		assert.match(source, /stats:/)
		assert.equal(plan.expectedClarityConfig.feed.limit, 20)
		assert.deepEqual(plan.expectedClarityConfig.stats.includePaths, ['posts/%'])
		assert.equal(plan.expectedClarityConfig.integrations.twikoo.envId, 'https://twikoo.fixture.example.com/')
		assert.equal(plan.expectedClarityConfig.integrations.scripts.length, 2)
		assert.ok(existsSync(join(fixtureDir, 'app/feeds.ts')))
		assert.equal(plan.assets.find(item => item.path === 'app/feeds.ts')?.action, 'map-to-root-feeds')
	})

	it('preserves redirects as consumer route data', () => {
		const redirects = readJson(join(fixtureDir, 'redirects.json'))
		const nuxtConfig = read(join(fixtureDir, 'nuxt.config.ts'))
		const asset = plan.assets.find(item => item.path === 'redirects.json')

		assert.equal(Object.keys(redirects).length, 2)
		assert.equal(redirects['/old-route'], '/fixture-article')
		assert.match(nuxtConfig, /from '\.\/redirects\.json'/)
		assert.match(nuxtConfig, /statusCode: 308/)
		assert.equal(asset?.classification, 'KEEP')
		assert.equal(asset?.action, 'preserve-and-map-route-rules')
	})

	it('preserves registered consumer patches', () => {
		const workspace = read(join(fixtureDir, 'pnpm-workspace.yaml'))
		const patchPaths = [
			'patches/@nuxtjs__mdc.patch',
			'patches/@nuxt__image.patch',
			'patches/plain-shiki.patch',
		]

		for (const path of patchPaths) {
			assert.ok(existsSync(join(fixtureDir, path)), `missing patch ${path}`)
			assert.equal(plan.assets.find(item => item.path === path)?.classification, 'KEEP')
		}
		assert.match(workspace, /'@nuxtjs\/mdc': patches\/@nuxtjs__mdc\.patch/)
		assert.match(workspace, /'@nuxt\/image': patches\/@nuxt__image\.patch/)
		assert.match(workspace, /plain-shiki: patches\/plain-shiki\.patch/)
	})

	it('recognizes consumer component and Shiki overrides', () => {
		const badge = read(join(fixtureDir, 'app/components/content/Badge.vue'))
		const shiki = read(join(fixtureDir, 'app/shiki.config.ts'))

		assert.match(badge, /data-fixture-component-override="badge"/)
		assert.match(shiki, /fixture-light\.mjs/)
		assert.match(shiki, /fixture-dark\.mjs/)
		assert.equal(plan.assets.find(item => item.path === 'app/components/content/Badge.vue')?.action, 'consumer-component-override')
		assert.equal(plan.assets.find(item => item.path === 'app/shiki.config.ts')?.action, 'consumer-shiki-override')
	})

	it('classifies user data and unknown custom code as protected', () => {
		const allowed = new Set(['AUTO', 'REVIEW', 'KEEP', 'NEVER_TOUCH'])

		assert.ok(plan.assets.length >= 15)
		for (const asset of plan.assets) {
			assert.ok(allowed.has(asset.classification), `invalid classification for ${asset.path}`)
			assert.ok(existsSync(join(fixtureDir, asset.path)), `planned asset does not exist: ${asset.path}`)
		}

		for (const path of [
			'content/posts/example.md',
			'public/avatar.svg',
			'public/favicon.svg',
			'modules/site/index.ts',
			'server/api/hello.get.ts',
		]) {
			assert.equal(plan.assets.find(item => item.path === path)?.classification, 'NEVER_TOUCH')
		}

		assert.match(read(join(fixtureDir, 'content/posts/example.md')), /^permalink: \/fixture-article$/m)
		assert.match(read(join(fixtureDir, 'modules/site/index.ts')), /fixture-site-module/)
		assert.match(read(join(fixtureDir, 'server/api/hello.get.ts')), /defineEventHandler/)
	})
})

function read(path) {
	return readFileSync(path, 'utf8')
}

function readJson(path) {
	return JSON.parse(read(path))
}
