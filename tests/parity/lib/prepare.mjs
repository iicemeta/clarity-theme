/**
 * Parity consumer 构建（prepare 阶段）
 *
 * 从 fixtures/site.mjs 单一数据源渲染两个真实 consumer：
 *
 *   upstream consumer：blog-v3 @ manifest commit 完整树 + fixture 覆盖层
 *   clarity  consumer：最小脚手架 + file: 安装当前主题 + fixture 覆盖层
 *
 * 两者读取完全相同的站点数据/内容/订阅，仅在 Layer 形态上不同。
 * 结果缓存在 <repo>/.parity-cache/（gitignored），stamp 命中时跳过重建。
 */
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { nav, site } from '../fixtures/site.mjs'

const themeDir = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const fixturesDir = join(themeDir, 'tests/parity/fixtures')
const cacheDir = join(themeDir, '.parity-cache')
const manifest = JSON.parse(readFileSync(join(themeDir, 'sync-manifest.json'), 'utf8'))
const upstreamCommit = manifest.upstream.commit

export const preparedPaths = {
	upstream: join(cacheDir, 'upstream-consumer'),
	clarity: join(cacheDir, 'clarity-consumer'),
}

function run(cmd, cwd, env = {}) {
	execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1', ...env } })
}

function computeStamp() {
	const fixtureFiles = [
		'tests/parity/fixtures/site.mjs',
		'tests/parity/fixtures/content/posts/hello-parity.md',
		'tests/parity/fixtures/content/posts/story-night.md',
		'tests/parity/fixtures/content/posts/older-note.md',
		'tests/parity/fixtures/public/favicon.svg',
		'tests/parity/lib/prepare.mjs',
	]
	const hash = createHash('sha256')
	hash.update(upstreamCommit)
	for (const file of fixtureFiles) {
		hash.update(readFileSync(join(themeDir, file)))
	}
	// 主题侧影响生成的面：HEAD 状态 + 工作区是否含未提交修改
	hash.update(execSync('git rev-parse HEAD', { cwd: themeDir, encoding: 'utf8' }))
	const dirty = execSync('git status --porcelain -- src nuxt.config.ts package.json', { cwd: themeDir, encoding: 'utf8' })
	hash.update(dirty)
	return hash.digest('hex').slice(0, 16)
}

/** 上游内容解析顺序与 test-upstream-parity 一致：env → 同级 checkout → clone manifest commit */
function resolveUpstreamSource() {
	const candidates = [
		process.env.PARITY_UPSTREAM_DIR,
		join(themeDir, '../blog-v3-upstream'),
	].filter(Boolean)
	for (const dir of candidates) {
		if (existsSync(dir) && hasCommit(dir)) {
			return { dir, local: true }
		}
	}
	const tempDir = join(tmpdir(), `clarity-parity-upstream-${Date.now()}`)
	console.log(`  · 克隆上游 ${manifest.upstream.repo}@${upstreamCommit.slice(0, 7)} ……`)
	execSync(`git clone --filter=blob:none --no-checkout ${manifest.upstream.repo} "${tempDir}"`, { stdio: 'ignore' })
	execSync(`git -C "${tempDir}" checkout ${upstreamCommit}`, { stdio: 'ignore' })
	return { dir: tempDir, local: false }
}

function hasCommit(dir) {
	try {
		execSync(`git -C "${dir}" cat-file -e ${upstreamCommit}^{commit}`, { stdio: 'ignore' })
		return true
	}
	catch {
		return false
	}
}

// ---------------------------------------------------------------------------
// 配置模板（全部由 site.mjs 渲染，禁止第二数据源）
// ---------------------------------------------------------------------------

function renderUpstreamBlogConfig() {
	const categories = Object.entries(site.categories)
		.map(([key, value]) => {
			const extra = value.color ? `, color: '${value.color}'` : ''
			return `\t\t\t${key}: { icon: '${value.icon}'${extra} },`
		})
		.join('\n')
	const types = Object.keys(site.articleTypes).map(key => `\t\t\t${key}: {},`).join('\n')
	const order = Object.entries(site.articleOrder).map(([key, value]) => `\t\t\t${key}: '${value}',`).join('\n')
	return `import type { FeedEntry } from './app/types/feed'

const basicConfig = {
	title: ${JSON.stringify(site.title)},
	subtitle: ${JSON.stringify(site.subtitle)},
	description: ${JSON.stringify(site.description)},
	author: {
		name: ${JSON.stringify(site.author.name)},
		avatar: ${JSON.stringify(site.logo)},
		email: ${JSON.stringify(site.author.email)},
		homepage: ${JSON.stringify(site.author.homepage)},
	},
	copyright: {
		abbr: ${JSON.stringify(site.copyright.abbr)},
		name: ${JSON.stringify(site.copyright.name)},
		url: ${JSON.stringify(site.copyright.url)},
	},
	favicon: ${JSON.stringify(site.favicon)},
	language: ${JSON.stringify(site.language)},
	timeEstablished: ${JSON.stringify(site.established)},
	timeZone: ${JSON.stringify(site.timezone)},
	url: ${JSON.stringify(site.url)},
	defaultCategory: ${JSON.stringify(site.defaultCategory)},
}

const blogConfig = {
	...basicConfig,

	article: {
		categories: {
${categories}
		},
		types: {
${types}
		},
		order: {
${order}
		},
		hidePostPrefix: true,
		robotsNotIndex: ['/preview', '/previews/*'],
	},

	feed: {
		limit: 50,
		enableStyle: true,
	},

	stats: {
		includePaths: [] as string[],
	},

	// 空环境 ID：两侧都不渲染评论区（clarity 侧 integrations.twikoo 同样未配置）
	twikoo: {
		envId: '',
		preload: '',
	},

	scripts: [],
}

/** 用于生成 OPML 和友链页面配置（上游文件形状要求；数据来自 fixture 站点身份） */
export const myFeed: FeedEntry = {
	author: blogConfig.author.name,
	sitenick: ${JSON.stringify(site.title)},
	title: blogConfig.title,
	desc: blogConfig.subtitle || blogConfig.description,
	link: blogConfig.url,
	feed: new URL('/atom.xml', blogConfig.url).toString(),
	icon: blogConfig.favicon,
	avatar: blogConfig.author.avatar,
	archs: ['Nuxt'],
	date: blogConfig.timeEstablished,
	comment: 'parity fixture',
}

export default blogConfig
`
}

function renderUpstreamAppConfig() {
	const iconNav = site.iconNav.map(item => `\t\t\t{ icon: '${item.icon}', text: ${JSON.stringify(item.text)}, url: '${item.url}' },`).join('\n')
	const footerNav = JSON.stringify(site.footerNav, null, '\t').replaceAll('\n', '\n\t\t')
	const navJson = JSON.stringify(nav, null, '\t').replaceAll('\n', '\n\t')
	const emoji = site.emojiTail.map(e => `'${e}'`).join(', ')
	return `import type { Nav, NavItem } from '~/types/nav'
import blogConfig from '~~/blog.config'

// parity fixture 渲染产物 —— 与 clarity consumer 的 app.config 值一一对应
export default defineAppConfig({
	...blogConfig,

	component: {
		alert: {
			defaultStyle: 'card' as 'card' | 'flat',
		},
		codeblock: {
			triggerRows: 32,
			collapsedRows: 16,
			enableIndentGuide: true,
			indent: 4,
			tabSize: 3,
		},
		excerpt: {
			animation: false,
			caret: '_',
		},
		slide: {
			showTitle: true,
		},
		stats: {
			birthYear: ${site.birthYear},
			wordCount: ${JSON.stringify(site.wordCount)},
		},
	},

	footer: {
		copyright: '© 2026 ${site.author.name}',
		iconNav: [
${iconNav}
		] satisfies NavItem[],
		nav: ${footerNav} satisfies Nav,
	},

	header: {
		logo: ${JSON.stringify(site.logo)},
		showTitle: true,
		subtitle: blogConfig.subtitle,
		emojiTail: [${emoji}],
	},

	link: {
		remindNoFeed: true,
		randomInGroup: true,
	},

	nav: ${navJson} satisfies Nav,

	pagination: {
		perPage: 10,
		sortOrder: 'date' as keyof typeof blogConfig.article.order,
		allowAscending: false,
	},

	themes: {
		light: {
			icon: 'tabler:sun',
			tip: '浅色模式',
		},
		system: {
			icon: 'tabler:device-desktop',
			tip: '跟随系统',
		},
		dark: {
			icon: 'tabler:moon',
			tip: '深色模式',
		},
	},
})
`
}

function renderUpstreamFeeds() {
	return `import type { FeedGroup } from '~/types/feed'

// parity fixture 渲染产物 —— 与 clarity consumer 的 feeds.ts 数据一致
export default ${JSON.stringify(site.feedGroups, null, '\t')} satisfies FeedGroup[]
`
}

function renderClarityConfig() {
	const categories = Object.entries(site.categories)
		.map(([key, value]) => {
			const extra = value.color ? `, color: '${value.color}'` : ''
			return `\t\t\t${key}: { icon: '${value.icon}'${extra} },`
		})
		.join('\n')
	const types = Object.keys(site.articleTypes).map(key => `\t\t\t${key}: {},`).join('\n')
	const order = Object.entries(site.articleOrder).map(([key, value]) => `\t\t\t${key}: '${value}',`).join('\n')
	return `import { defineClarityConfig } from 'clarity-theme/config'

// parity fixture 渲染产物 —— 数据源 tests/parity/fixtures/site.mjs
export default defineClarityConfig({
	site: {
		title: ${JSON.stringify(site.title)},
		subtitle: ${JSON.stringify(site.subtitle)},
		description: ${JSON.stringify(site.description)},
		url: ${JSON.stringify(site.url)},
		language: ${JSON.stringify(site.language)},
		timezone: ${JSON.stringify(site.timezone)},
		established: ${JSON.stringify(site.established)},
		favicon: ${JSON.stringify(site.favicon)},
		author: {
			name: ${JSON.stringify(site.author.name)},
			avatar: ${JSON.stringify(site.logo)},
			email: ${JSON.stringify(site.author.email)},
			homepage: ${JSON.stringify(site.author.homepage)},
		},
		copyright: {
			abbr: ${JSON.stringify(site.copyright.abbr)},
			name: ${JSON.stringify(site.copyright.name)},
			url: ${JSON.stringify(site.copyright.url)},
		},
	},

	article: {
		defaultCategory: ${JSON.stringify(site.defaultCategory)},
		categories: {
${categories}
		},
		types: {
${types}
		},
		order: {
${order}
		},
	},

	feed: {
		limit: 50,
		enableStyle: true,
	},

	integrations: {
		scripts: [],
	},
})
`
}

function renderClarityAppConfig() {
	const iconNav = site.iconNav.map(item => `\t\t\t{ icon: '${item.icon}', text: ${JSON.stringify(item.text)}, url: '${item.url}' },`).join('\n')
	const footerNav = JSON.stringify(site.footerNav, null, '\t').replaceAll('\n', '\n\t\t')
	return `// parity fixture 渲染产物 —— 与 upstream consumer 的 app.config 值一一对应。
// 注意：header.emojiTail 与 nav 故意省略 —— Nuxt appConfig 对数组执行 concat
// 合并，显式数组会与 clarity-config 注入的上游默认值拼接；这两个键回落到
// 与 upstream fixture 显式写值一致的内置默认值（src/config/ui.ts）。
export default defineAppConfig({
	component: {
		alert: { defaultStyle: 'card' },
		codeblock: {
			triggerRows: 32,
			collapsedRows: 16,
			enableIndentGuide: true,
			indent: 4,
			tabSize: 3,
		},
		excerpt: { animation: false, caret: '_' },
		slide: { showTitle: true },
		stats: {
			birthYear: ${site.birthYear},
			wordCount: ${JSON.stringify(site.wordCount)},
		},
	},

	footer: {
		copyright: '© 2026 ${site.author.name}',
		iconNav: [
${iconNav}
		],
		nav: ${footerNav},
	},

	header: {
		logo: ${JSON.stringify(site.logo)},
		showTitle: true,
		subtitle: ${JSON.stringify(site.subtitle)},
	},

	link: {
		remindNoFeed: true,
		randomInGroup: true,
	},

	pagination: {
		perPage: 10,
		sortOrder: 'date',
		allowAscending: false,
	},
})
`
}

function renderClarityFeeds() {
	return `import type { FeedGroup } from 'clarity-theme/config'

// parity fixture 渲染产物 —— 与 upstream consumer 的 app/feeds.ts 数据一致
export default ${JSON.stringify(site.feedGroups, null, '\t')} satisfies FeedGroup[]
`
}

// ---------------------------------------------------------------------------
// 构建两个 consumer
// ---------------------------------------------------------------------------

function copyFixtureOverlay(targetDir) {
	// 共享内容与静态资源逐字复制（两个 consumer 完全一致）
	rmSync(join(targetDir, 'content'), { recursive: true, force: true })
	cpSync(join(fixturesDir, 'content'), join(targetDir, 'content'), { recursive: true })
	mkdirSync(join(targetDir, 'public'), { recursive: true })
	cpSync(join(fixturesDir, 'public/favicon.svg'), join(targetDir, 'public/favicon.svg'))
}

async function buildUpstreamConsumer(fresh) {
	const dir = preparedPaths.upstream
	const buildStamp = join(dir, '.parity-stamp')
	if (!fresh && existsSync(buildStamp) && existsSync(join(dir, '.output'))
		&& readFileSync(buildStamp, 'utf8').trim() === computeStamp()) {
		return
	}
	console.log('  · 构建 upstream consumer ……')
	rmSync(dir, { recursive: true, force: true })
	mkdirSync(dir, { recursive: true })

	const source = resolveUpstreamSource()
	// Git Bash tar 在 Windows 下把 `D:\...` 解析为远程主机，必须用正斜杠路径
	const posixDir = dir.replaceAll('\\', '/')
	run(`git -C "${source.dir}" archive ${upstreamCommit} | tar -x -f - -C "${posixDir}"`)
	if (!source.local) {
		rmSync(source.dir, { recursive: true, force: true })
	}

	writeFileSync(join(dir, 'blog.config.ts'), renderUpstreamBlogConfig())
	mkdirSync(join(dir, 'app'), { recursive: true })
	writeFileSync(join(dir, 'app/app.config.ts'), renderUpstreamAppConfig())
	writeFileSync(join(dir, 'app/feeds.ts'), renderUpstreamFeeds())
	copyFixtureOverlay(dir)

	run('pnpm install --no-frozen-lockfile', dir)
	run('pnpm generate', dir)
	writeFileSync(buildStamp, `${computeStamp()}\n`)
	console.log('    upstream consumer 就绪')
}

async function buildClarityConsumer(fresh) {
	const dir = preparedPaths.clarity
	const buildStamp = join(dir, '.parity-stamp')
	if (!fresh && existsSync(buildStamp) && existsSync(join(dir, '.output'))
		&& readFileSync(buildStamp, 'utf8').trim() === computeStamp()) {
		return
	}
	console.log('  · 构建 clarity consumer ……')
	rmSync(dir, { recursive: true, force: true })
	mkdirSync(dir, { recursive: true })

	const themeRef = process.env.PARITY_THEME_REF === 'pack'
		? buildThemeTarball()
		: `file:${themeDir.replaceAll('\\', '/')}`
	writeFileSync(join(dir, 'package.json'), JSON.stringify({
		name: 'clarity-parity-consumer',
		private: true,
		type: 'module',
		packageManager: 'pnpm@12.4.1',
		scripts: { generate: 'nuxt generate' },
		devDependencies: {
			'clarity-theme': themeRef,
			'nuxt': '^4.5.2',
			'typescript': '^6.0.3',
			'vue': '^3.5.42',
			'vue-router': '^5.3.1',
			'zod': '^4.5.4',
		},
	}, null, '\t'))
	writeFileSync(join(dir, 'pnpm-workspace.yaml'), [
		'allowBuilds:',
		'  \'@parcel/watcher\': true',
		'  esbuild: true',
		'  oxc-resolver: true',
		'  rolldown: true',
		'  sharp: true',
		'  unrs-resolver: true',
	].join('\n'))
	writeFileSync(join(dir, 'nuxt.config.ts'), 'export default defineNuxtConfig({\n\textends: [\'clarity-theme\'],\n})\n')
	writeFileSync(join(dir, 'content.config.ts'), [
		'import { createClarityContentConfig } from \'clarity-theme/content\'',
		'import clarityConfig from \'./clarity.config\'',
		'',
		'export default createClarityContentConfig(clarityConfig)',
		'',
	].join('\n'))
	writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
		references: [
			{ path: './.nuxt/tsconfig.app.json' },
			{ path: './.nuxt/tsconfig.server.json' },
			{ path: './.nuxt/tsconfig.shared.json' },
			{ path: './.nuxt/tsconfig.node.json' },
		],
		files: [],
	}, null, '\t'))
	writeFileSync(join(dir, 'clarity.config.ts'), renderClarityConfig())
	mkdirSync(join(dir, 'app'), { recursive: true })
	writeFileSync(join(dir, 'app/app.config.ts'), renderClarityAppConfig())
	writeFileSync(join(dir, 'feeds.ts'), renderClarityFeeds())
	copyFixtureOverlay(dir)

	run('pnpm install --no-frozen-lockfile', dir)
	run('pnpm generate', dir)
	writeFileSync(buildStamp, `${computeStamp()}\n`)
	console.log('    clarity consumer 就绪')
}

function buildThemeTarball() {
	run('pnpm pack --pack-destination .parity-cache', themeDir)
	const name = execSync('ls .parity-cache', { cwd: themeDir, encoding: 'utf8' })
		.split('\n')
		.find(f => /^clarity-theme-.*\.tgz$/.test(f))
	return `file:${join(cacheDir, name).replaceAll('\\', '/')}`
}

export async function prepareConsumers({ fresh = false } = {}) {
	mkdirSync(cacheDir, { recursive: true })
	await buildUpstreamConsumer(fresh)
	await buildClarityConsumer(fresh)
	return preparedPaths
}
