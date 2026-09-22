#!/usr/bin/env node
import { Buffer } from 'node:buffer'
/**
 * Real Consumer Test（devdoc2.0 §16 / Phase D → 发布前核心验收）
 *
 * 完整链路：
 *
 *   clarity-theme → pnpm pack → tarball 审计 → 独立 Consumer 安装
 *   → exports 冒烟 → nuxt typecheck → nuxt generate × 3 组配置分支 → 生成产物断言
 *
 * 与 playground（workspace 链接）互补，专门暴露 npm 包层面的问题：
 * files 字段越界、依赖声明缺失、exports 路径错误、
 * 类型声明引用不存在的文件、上游站点数据泄漏等。
 */
import { execSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const themePkg = JSON.parse(readFileSync(join(themeDir, 'package.json'), 'utf8'))
const keep = process.argv.includes('--keep')
/** 复用已保留的 consumer 目录，仅重跑产物断言（调试断言用）：--reuse=<consumerDir> */
const reuseDir = process.argv.find(arg => arg.startsWith('--reuse='))?.slice('--reuse='.length) || ''
const workDir = keep
	? resolve(themeDir, '.test-consumer')
	: join(tmpdir(), `clarity-consumer-${Date.now()}`)

/** 站点契约测试数据：所有断言围绕这一组确定性输入展开 */
const site = {
	title: 'Consumer Acceptance',
	description: 'Clarity Theme npm package acceptance site.',
	url: 'https://consumer.clarity-test.example/',
	author: 'Consumer',
	email: 'consumer@clarity-test.example',
	established: '2026-09-21',
}
const friendFeed = 'https://friend.example.com/atom.xml'
const customPermalink = '/custom/permalink'
const twikooEnv = 'https://twikoo.consumer.example'
const mirrorDomain = 'mirror.example.com'
const postCount = 7
const noteCount = 1

/** 配置分支矩阵：同一份安装产物上依次改写 clarity.config 后重新 generate */
const consumerVariants = [
	{
		id: 'default',
		label: '默认配置 + custom app.config / shiki / Badge 组件覆盖',
		assert: consumerDir => assertGenerateOutput(consumerDir, 'default'),
	},
	{
		id: 'branches',
		label: 'enableStyle=false + hidePostPrefix=false + Twikoo + antiMirror blacklist + 多模式 stats',
		assert: consumerDir => assertGenerateOutput(consumerDir, 'branches'),
	},
	{
		id: 'features-off',
		label: 'atom / opml / stats 关闭（静态产物 + SSR 运行时 404）',
		assert: consumerDir => assertGenerateOutput(consumerDir, 'features-off'),
	},
]

async function main() {
	console.log(`▶ Real Consumer Test（发布验收）\n  工作目录：${workDir}\n`)

	if (reuseDir) {
		step(8, 10, `generate assertion（复用 ${reuseDir}，仅默认断言）`)
		assertGenerateOutput(resolve(reuseDir), 'default')
		console.log('\n✔ generate assertion 通过')
		return
	}

	try {
	// ============================================================
	// [1] pnpm pack
	// ============================================================
		step(1, 10, 'pnpm pack')
		rmSync(workDir, { recursive: true, force: true })
		mkdirSync(workDir, { recursive: true })
		run('pnpm', themeDir, ['pack', '--pack-destination', workDir])
		const tarballName = readdirSync(workDir).find(file => /^clarity-theme-.*\.tgz$/.test(file))
		assert('生成 tarball', Boolean(tarballName), tarballName)
		const tarballPath = join(workDir, tarballName)

		// ============================================================
		// [2] tarball file audit（内容边界 / 上游数据泄漏）
		// ============================================================
		step(2, 10, 'tarball file audit')
		const packageDir = join(workDir, 'package')
		run('tar', workDir, ['-xzf', tarballPath, '-C', workDir])
		const files = listFiles(packageDir)
			.map(file => file.replaceAll('\\', '/'))
			.sort()
		auditTarball(files, packageDir)

		// ============================================================
		// [3] exports 契约审计（入口存在性 + 类型声明引用链）
		// ============================================================
		step(3, 10, 'exports / type declarations 契约审计')
		auditExports(packageDir)
		console.log('  ✓ exports 全部入口（default + types）存在于 tarball')
		console.log('  ✓ .d.mts / .ts / .mjs / .vue 相对引用无悬空文件')

		// ============================================================
		// [4] 生成独立 Consumer 项目
		// ============================================================
		step(4, 10, '生成独立 Consumer 项目')
		const consumerDir = join(workDir, 'consumer')
		mkdirSync(consumerDir, { recursive: true })
		writeConsumerProject(consumerDir, tarballPath)
		console.log('  ✓ nuxt extends / 三份站点配置 / app.config / shiki 覆盖 / 内容基准')

		// ============================================================
		// [5] pnpm install（独立目录，非 workspace）
		// ============================================================
		step(5, 10, 'pnpm install')
		run('pnpm', consumerDir, ['install', '--no-frozen-lockfile'])

		// ============================================================
		// [6] exports runtime smoke test（纯 Node ESM import）
		// ============================================================
		step(6, 10, 'exports runtime smoke test')
		run('node', consumerDir, ['exports-smoke.mjs'])

		// ============================================================
		// [7] TypeScript compile test（nuxt typecheck）
		// ============================================================
		step(7, 10, 'TypeScript compile test（nuxt typecheck）')
		run('pnpm', consumerDir, ['exec', 'nuxt', 'typecheck'])

		// ============================================================
		// [8-10] nuxt generate × 配置分支矩阵 + 产物断言
		// ============================================================
		for (const [index, variant] of consumerVariants.entries()) {
			step(8 + index, 10, `nuxt generate · ${variant.id}`)
			console.log(`  ▶ ${variant.label}`)
			writeConsumerVariant(consumerDir, variant.id)
			resetConsumerCaches(consumerDir)
			run('pnpm', consumerDir, ['exec', 'nuxt', 'generate'])
			variant.assert(consumerDir)
		}

		// ============================================================
		// [10b] features-off 的 dev/SSR 运行时语义：禁用路由必须 404
		// ============================================================
		step(10, 10, 'features-off SSR 运行时断言（nuxt build + 真实服务）')
		await assertFeatureOffRuntime(consumerDir)

		console.log(`\n✔ Real Consumer Test 通过：tarball 边界、exports、类型、独立安装、${consumerVariants.length} 组配置分支的 generate 产物全部符合发布标准`)
	}
	catch (error) {
		console.error('\n✖ Real Consumer Test 失败')
		console.error(`  调试目录已保留：${workDir}`)
		process.exitCode = 1
		console.error(error)
	}
	finally {
		if (!keep && process.exitCode !== 1) {
			rmSync(workDir, { recursive: true, force: true })
		}
	}
}

// ---------------------------------------------------------------------------
// tarball 审计
// ---------------------------------------------------------------------------

/** 允许进入 npm 包的顶层路径（files 字段语义化后的实际边界） */
// 注意：npm 会自动打包 README* 变体，README.zh-CN.md（中文版说明）因此随包发布。
const allowedRootFiles = new Set([
	'LICENSE',
	'README.md',
	'README.zh-CN.md',
	'package.json',
	'nuxt.config.ts',
])
const allowedDirs = ['app/', 'config/', 'img/', 'modules/', 'public/', 'remark-plugins/', 'server/', 'shared/']

/** 发布必须存在的最小文件集（缺一即视为破坏性发布） */
const requiredFiles = [
	'LICENSE',
	'README.md',
	'package.json',
	'nuxt.config.ts',
	'app/shiki.config.ts',
	'config/index.ts',
	'config/index.d.mts',
	'config/index.mjs',
	'config/define.ts',
	'config/define.mjs',
	'config/content.ts',
	'config/content.d.mts',
	'config/content.mjs',
	'config/schema.ts',
	'config/schema.d.mts',
	'config/schema.mjs',
	'config/server.ts',
	'img/index.ts',
	'img/index.d.mts',
	'img/index.mjs',
	'modules/clarity-config/index.ts',
	'remark-plugins/remark-code-component.mjs',
	'remark-plugins/rehype-meta-slots.mjs',
	'public/assets/atom.xsl',
	'public/assets/atom.css',
	'public/fonts/AlimamaFangYuanTi.woff2',
	'server/api/stats.get.ts',
	'server/utils/clarity.ts',
	'server/routes/atom.xml.get.ts',
	'server/routes/subscriptions.opml.get.ts',
]

/** 明确禁止进入 tarball 的路径模式（上游文章 / 私密配置 / 开发资产） */
const forbiddenPathRules = [
	[/^content\//, '上游文章目录'],
	[/^playground\//, 'playground 示例文章'],
	[/^docs\/|^tests\/|^scripts\/|^\.github\//, '开发资产'],
	[/^clarity\.config\.(ts|mjs|js)$/, '上游私密站点配置'],
	[/^feeds\.(ts|mjs|js)$/, '上游友链数据'],
	[/^(redirects\.json|edgeone\.json|sync-manifest\.json)$/, '上游站点配置'],
	[/\.env/i, '环境变量文件'],
	[/\.(pem|key)$/i, '私钥文件'],
	[/[\w-]*(?:secret|token|credential|password)[\w-]*\.(?:json|ya?ml|txt|env|pem|key|ts|mts|cts|mjs|cjs|js)$/i, '疑似密钥文件'],
	[/\.(sqlite\d?|db)$/, '内容数据库'],
	[/^\.data\//, '内容数据库目录'],
	[/\/?(node_modules|\.git|\.nuxt|\.output|dist)\//, '构建/依赖目录'],
	[/\.tgz$/, '嵌套 tarball'],
	[/^(pnpm-lock\.yaml|pnpm-workspace\.yaml)$/, 'Theme 开发环境文件'],
]

/** 上游作者私密标识（与 scripts/verify-theme.mjs 保持同一口径） */
const forbiddenContentRules = [
	[/zhilu\.(site|cyou)/, '上游作者域名'],
	[/L33Z22L11/, '上游作者账号'],
	[/169994096/, '上游交流群号'],
	[/a1997c81-a42b-46f6-8d1d-8fbd67a8ef41/, '上游统计 ID'],
	[/97a4fe32ed8240ac8284e9bffaf03962/, '上游 Insights Token'],
	[/twikoo\.zhilu\.site/, '上游评论服务'],
	[/陕ICP备/, '上游备案号'],
]

const auditableExtensions = new Set(['.ts', '.mts', '.cts', '.mjs', '.cjs', '.js', '.json', '.md', '.vue', '.scss', '.css', '.svg', '.xsl', '.xml', '.html', '.txt'])
// README.zh-CN.md 与 README.md 携带相同的上游项目署名链接。
const attributionAllowList = new Set(['LICENSE', 'README.md', 'README.zh-CN.md', 'package.json'])

function auditTarball(files, packageDir) {
	let boundaryErrors = 0

	for (const file of files) {
		const inAllowedDir = allowedDirs.some(dir => file.startsWith(dir))
		if (!allowedRootFiles.has(file) && !inAllowedDir) {
			console.error(`  ✕ 越界文件：${file}`)
			boundaryErrors++
		}
		for (const [pattern, label] of forbiddenPathRules) {
			if (pattern.test(file)) {
				console.error(`  ✕ 禁止发布（${label}）：${file}`)
				boundaryErrors++
			}
		}
	}
	assert('tarball 无越界 / 私密路径', boundaryErrors === 0, `${files.length} 个文件`)

	const missing = requiredFiles.filter(file => !files.includes(file))
	assert('发布必需文件齐全', missing.length === 0, missing.length ? `缺失：${missing.join(', ')}` : `${requiredFiles.length} 个必需文件`)

	let leakErrors = 0
	for (const file of files) {
		const ext = file.slice(file.lastIndexOf('.'))
		if (!auditableExtensions.has(ext) || attributionAllowList.has(file)) {
			continue
		}
		const content = stripComments(readFileSync(join(packageDir, file), 'utf8'))
		for (const [pattern, label] of forbiddenContentRules) {
			if (pattern.test(content)) {
				console.error(`  ✕ ${file} 含${label}`)
				leakErrors++
			}
		}
	}
	assert('tarball 无上游私密标识', leakErrors === 0)
	assert('tarball 不包含上游文章', !files.some(file => file.startsWith('content/') || file.startsWith('playground/')))
	assert('tarball 不包含上游私密配置', !files.some(file => /^clarity\.config\./.test(file) || /\.env/i.test(file) || /\.(?:pem|key)$/i.test(file)))
}

// ---------------------------------------------------------------------------
// exports / 类型声明引用链审计
// ---------------------------------------------------------------------------

function auditExports(packageDir) {
	const exportsMap = themePkg.exports ?? {}
	const entries = Object.entries(exportsMap)
	assert('exports 映射非空', entries.length > 0, entries.map(([key]) => key).join(' '))

	for (const [key, entry] of entries) {
		const conditions = typeof entry === 'string' ? { default: entry } : entry
		for (const [condition, target] of Object.entries(conditions)) {
			const file = target.replace(/^\.\//, '')
			assert(`exports ${key} (${condition})`, existsSync(join(packageDir, file)), file)
		}
	}

	// 重点检查三个 .d.mts：引用链上的每个相对文件都必须真实存在于 tarball
	for (const declaration of ['config/index.d.mts', 'config/content.d.mts', 'config/schema.d.mts', 'img/index.d.mts']) {
		assert(`${declaration} 进入 tarball`, existsSync(join(packageDir, declaration)))
	}

	const broken = auditRelativeImports(packageDir)
	assert('类型与运行时入口无悬空相对引用', broken.length === 0, broken.length ? broken.slice(0, 10).join('；') : '全部解析成功')
}

const importPatterns = [
	/\bfrom\s*['"](\.\.?\/[^'"]+)['"]/g,
	/\bimport\s*\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g,
	/\bimport\s*['"](\.\.?\/[^'"]+)['"]/g,
]
const auditableSourceExtensions = new Set(['.ts', '.mts', '.cts', '.mjs', '.cjs', '.js', '.d.mts', '.d.ts', '.vue'])

function auditRelativeImports(packageDir) {
	const broken = []
	const visited = new Set()
	const queue = listFiles(packageDir)
		.map(file => file.replaceAll('\\', '/'))
		.filter(file => auditableSourceExtensions.has(extensionOf(file)))

	while (queue.length) {
		const file = queue.shift()
		if (visited.has(file)) {
			continue
		}
		visited.add(file)

		const content = stripComments(readFileSync(join(packageDir, file), 'utf8'))
		for (const pattern of importPatterns) {
			for (const match of content.matchAll(pattern)) {
				const specifier = match[1]
				const resolvedFile = resolveRelative(packageDir, dirname(file), specifier)
				if (!resolvedFile) {
					broken.push(`${file} → ${specifier}`)
				}
				else if (!visited.has(resolvedFile) && auditableSourceExtensions.has(extensionOf(resolvedFile))) {
					queue.push(resolvedFile)
				}
			}
		}
	}
	return broken
}

function resolveRelative(packageDir, fromDir, specifier) {
	const base = join(fromDir, specifier).replaceAll('\\', '/')
	const hasExtension = /\.[a-z0-9]+$/i.test(specifier)
	const candidates = hasExtension
		? [base]
		: [base, `${base}.ts`, `${base}.mts`, `${base}.cts`, `${base}.d.mts`, `${base}.mjs`, `${base}.cjs`, `${base}.js`, `${base}.vue`, `${base}.json`, `${base}/index.ts`, `${base}/index.mjs`]
	return candidates.find(candidate => existsSync(join(packageDir, candidate)))
}

function stripComments(code) {
	return code
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/^[ \t]*\/\/.*$/gm, '')
}

function extensionOf(file) {
	const name = file.slice(file.lastIndexOf('/') + 1)
	if (name.endsWith('.d.mts') || name.endsWith('.d.ts')) {
		return name.slice(name.indexOf('.'))
	}
	return name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
}

// ---------------------------------------------------------------------------
// Consumer 项目模板
// ---------------------------------------------------------------------------

function writeConsumerProject(dir, tarballPath) {
	writeFiles(dir, {
		'package.json': JSON.stringify({
			name: 'clarity-consumer-acceptance',
			private: true,
			type: 'module',
			scripts: {
				smoke: 'node exports-smoke.mjs',
				typecheck: 'nuxt typecheck',
				generate: 'nuxt generate',
			},
			devDependencies: {
				'@nuxt/content': '^3.16.0',
				'clarity-theme': `file:${tarballPath.replaceAll('\\', '/')}`,
				'nuxt': '^4.5.2',
				'shiki': '^4.4.3',
				'typescript': '^6.0.3',
				'vue': '^3.5.42',
				'vue-router': '^5.3.1',
				'vue-tsc': '^3.1.4',
				'zod': '^4.5.4',
			},
		}, null, '\t'),

		// pnpm 需要放行构建脚本（与真实站点一致）
		'pnpm-workspace.yaml': [
			'allowBuilds:',
			'  \'@parcel/watcher\': true',
			'  esbuild: true',
			'  oxc-resolver: true',
			'  rolldown: true',
			'  sharp: true',
			'  unrs-resolver: true',
			'  vue-demi: true',
		].join('\n'),

		// ---- nuxt extends：唯一入口即完整 Layer（具体路由由 writeConsumerVariant 按分支重写）----
		'nuxt.config.ts': nuxtConfigSource('default'),

		// nuxt typecheck 需要根 tsconfig 指向 .nuxt 生成的 project references
		'tsconfig.json': JSON.stringify({
			files: [],
			references: [
				{ path: './.nuxt/tsconfig.app.json' },
				{ path: './.nuxt/tsconfig.server.json' },
				{ path: './.nuxt/tsconfig.shared.json' },
				{ path: './.nuxt/tsconfig.node.json' },
			],
		}, null, '\t'),

		// ---- clarity.config.ts：站点契约（具体分支由 writeConsumerVariant 重写）----
		'clarity.config.ts': clarityConfigSource('default'),

		// ---- content.config.ts：Theme Content Schema 工厂 ----
		'content.config.ts': `import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)`,

		// ---- feeds.ts：友链数据（OPML / 友链页）----
		'feeds.ts': `import type { FeedGroup } from 'clarity-theme/config'

export default [
	{
		name: '朋友',
		desc: 'Consumer 友链数据',
		entries: [
			{
				author: '示例博主',
				title: '示例博客',
				desc: '验证友链页与 OPML 生成',
				link: 'https://friend.example.com/',
				feed: '${friendFeed}',
				icon: 'https://friend.example.com/favicon.svg',
				avatar: 'https://friend.example.com/avatar.webp',
				archs: ['Nuxt'],
				date: '2026-01-02',
			},
		],
	},
] satisfies FeedGroup[]`,

		// ---- app/app.config.ts override：消费项目覆盖 Theme UI 默认值 ----
		'app/app.config.ts': `export default defineAppConfig({
	clarity: {
		header: { emojiTail: ['🧪'] },
	},
})`,

		// ---- consumer custom shiki config：覆盖 Theme 内置高亮主题 ----
		'app/shiki.config.ts': `import { defineConfig } from '#shiki/config'

export default defineConfig({
	themes: {
		light: () => import('shiki/themes/github-light.mjs'),
		dark: () => import('shiki/themes/github-dark-default.mjs'),
	},
		})`,

		// ---- consumer custom component override：同名 Content 组件覆盖 Layer 默认实现 ----
		'app/components/content/Badge.vue': `<script setup lang="ts">
defineProps<{ text?: string, link?: string }>()
</script>

<template>
<span class="badge consumer-badge" data-consumer-override="consumer-badge">
	<slot>{{ text }}</slot>
</span>
</template>`,

		// ---- TypeScript 类型验收：四个 exports 全部走真实 d.mts 链 ----
		'app/exports.check.ts': `import type { ArticleSchema } from 'clarity-theme/content'
import type { FeedGroup } from 'clarity-theme/config'
import type { ClarityConfig } from 'clarity-theme/schema'
import type { ImgService } from 'clarity-theme/img'
import { defineClarityConfig } from 'clarity-theme/config'
import { createClarityContentConfig } from 'clarity-theme/content'
import { clarityConfigSchema } from 'clarity-theme/schema'
import { getImgUrl, OicqAvatarSize } from 'clarity-theme/img'
import clarityConfig from '../clarity.config'
import contentConfig from '../content.config'
import feeds from '../feeds'

export const typedConfig: ClarityConfig = clarityConfig
export const typedFeeds: FeedGroup[] = feeds
export const typedArticle: ArticleSchema = { title: 'typed' }
export const typedService: ImgService = 'weserv'
export const typedContent = contentConfig

// 类型必须真实存在：以下错误赋值应全部被 TypeScript 拒绝
// @ts-expect-error site.title 必须是 string
const wrongTitle: ClarityConfig = { ...clarityConfig, site: { ...clarityConfig.site, title: 123 } }
// @ts-expect-error FeedGroup 必须包含 entries
const wrongFeed: FeedGroup = { name: 'broken' }
// @ts-expect-error ImgService 只允许已注册图床或 boolean
const wrongService: ImgService = 'unknown'

export const runtimeChecks = {
	config: defineClarityConfig(clarityConfig),
	schema: clarityConfigSchema.parse(clarityConfig),
	content: createClarityContentConfig(clarityConfig),
	img: [getImgUrl('a.png', true), OicqAvatarSize.Size140],
	wrongTitle,
	wrongFeed,
	wrongService,
}`,

		// ---- exports runtime smoke（纯 Node ESM，不依赖 Nuxt / jiti）----
		'exports-smoke.mjs': `import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const failures = []
function check(name, ok, detail = '') {
	console.log(\`  \${ok ? '✓' : '✕'} \${name}\${detail ? \`（\${detail}）\` : ''}\`)
	if (!ok) failures.push(name)
}

// 1. exports map：每个入口（含根入口 nuxt.config.ts）都必须可被 Node 解析
for (const spec of ['clarity-theme', 'clarity-theme/config', 'clarity-theme/content', 'clarity-theme/schema', 'clarity-theme/img']) {
	try {
		const resolved = import.meta.resolve(spec)
		check(\`\${spec} 可解析\`, resolved.startsWith('file://') && existsSync(fileURLToPath(resolved)), fileURLToPath(resolved))
	}
	catch (error) {
		check(\`\${spec} 可解析\`, false, String(error))
	}
}

// 2. clarity-theme/config（纯 ESM 运行时 + 默认值填充）
const { defineClarityConfig } = await import('clarity-theme/config')
const rawConfig = {
	site: {
		title: 'Smoke',
		description: 'smoke',
		url: 'https://smoke.example.com/',
		author: { name: 'Smoke' },
	},
}
const config = defineClarityConfig(rawConfig)
check('config defineClarityConfig 运行时可用', typeof defineClarityConfig === 'function')
check('config 默认值填充', config.article.defaultCategory === '未分类' && config.features.atom === true)
try {
	defineClarityConfig({ ...rawConfig, article: { useRandomPermalink: true } })
	check('config useRandomPermalink 已移除（strict schema 拒绝未知字段）', false)
}
catch {
	check('config useRandomPermalink 已移除（strict schema 拒绝未知字段）', true)
}

// 3. clarity-theme/schema
const schema = await import('clarity-theme/schema')
const parsed = schema.clarityConfigSchema.parse(rawConfig)
check('schema clarityConfigSchema.parse', parsed.site.title === 'Smoke')
check('schema 导出完整', ['clarityConfigSchema', 'claritySiteSchema', 'clarityArticleSchema'].every(key => key in schema))

// 4. clarity-theme/content
// 注意：createClarityContentConfig 的完整执行依赖 @nuxt/content 在 Nuxt 模块
// 生命周期中初始化的 validators context（zod → JSON Schema），
// 纯 Node 冒烟只验证入口可 import 与工厂签名；行为由 nuxt generate 覆盖。
const content = await import('clarity-theme/content')
check('content createClarityContentConfig 可 import', typeof content.createClarityContentConfig === 'function')

// 5. clarity-theme/img
const img = await import('clarity-theme/img')
check('img getImgUrl(fly)', img.getImgUrl('a.png', true) === 'https://fly.webp.se/?url=a.png', img.getImgUrl('a.png', true))
check('img OicqAvatarSize 数值对象', img.OicqAvatarSize.Size140 === 4)
check('img getGithubIcon', img.getGithubIcon('nuxt').includes('github.com'))
check('img getFavicon', img.getFavicon('example.com').includes('gstatic'))

if (failures.length) {
	console.error(\`\\nexports smoke 失败：\${failures.join('、')}\`)
	process.exit(1)
}
console.log('exports smoke 全部通过')`,

		// ---- 内容基准：Markdown ----
		'content/posts/first.md': `---
title: Consumer Markdown 基准
description: 验证 Markdown 与 clarity.config 注入。
date: 2026-09-21 10:00
categories: [技术]
tags: [consumer, markdown]
---

行内代码 \`clarity.config.ts\`、**粗体**、*斜体*、~~删除线~~。

> Markdown 引用块

脚注引用[^note]。

[^note]: Markdown 脚注内容。

\`\`\`ts
const answer = 42
\`\`\`
`,

		// ---- 内容基准：MDC ----
		'content/posts/mdc.md': `---
title: Consumer MDC 基准
description: 验证 MDC 组件渲染。
date: 2026-09-21 10:10
categories: [技术]
---

::alert{type="info" title="MDC 信息提示"}
MDC Alert 组件内容。
::

:tip{icon="tabler:info-circle" text="MDC 悬停提示"}

::card-list
- **MDC 卡片项**：CardList 组件
::

:::folding{title="MDC 折叠标题"}
MDC 折叠内容。
:::

:badge[MDC]{link="https://nuxt.com"}
`,

		// ---- 内容基准：Math ----
		'content/posts/math.md': `---
title: Consumer Math 基准
description: 验证 remark-math 与 rehype-katex。
date: 2026-09-21 10:20
categories: [技术]
---

行内公式 $E = mc^2$。

$$
\\frac{\\partial u}{\\partial t} = \\alpha \\nabla^2 u
$$
`,

		// ---- 内容基准：Mermaid ----
		'content/posts/mermaid.md': `---
title: Consumer Mermaid 基准
description: 验证 remark-code-component 与 Mermaid 组件。
date: 2026-09-21 10:30
categories: [技术]
---

\`\`\`mermaid
graph TD
	Consumer --> Tarball
	Tarball --> Generate
	Generate --> Assertions
\`\`\`
`,

		// ---- 内容基准：Image ----
		'content/posts/image.md': `---
title: Consumer Image 基准
description: 验证 Markdown 图片与 Pic 组件。
date: 2026-09-21 10:40
categories: [技术]
---

![Markdown 图片](https://placehold.co/600x300/41b883/ffffff/png "Markdown 图片标题")

::pic{src="https://placehold.co/600x300" caption="Pic 图注" zoom="true"}
::
`,

		// ---- 内容基准：permalink（自定义链接覆盖文件路由）----
		'content/posts/permalink.md': `---
title: Consumer Permalink 基准
description: 验证 permalink 自定义链接。
date: 2026-09-21 10:50
categories: [技术]
permalink: ${customPermalink}
---

这篇文件位于 \`posts/permalink.md\`，但必须发布到 \`${customPermalink}\`。
`,

		// ---- robots 基准：配置 robotsNotIndex ----
		'content/posts/secret.md': `---
title: Consumer Secret 基准
description: 验证 robotsNotIndex。
date: 2026-09-21 11:00
categories: [技术]
---

该路径应出现在 robots.txt 的 Disallow 规则中。
`,

		// ---- 友链页（feeds.ts 数据出口之一）----
		'content/link.md': `---
title: 友链
description: Consumer 友链页。
---

友链页应渲染 feeds.ts 中的示例博客。
`,

		// ---- 多模式 stats 基准：notes/ 也计入 branches 变体统计 ----
		'content/notes/note.md': `---
title: Consumer Note 基准
description: 验证 stats.includePaths 多模式并集选择。
date: 2026-09-21 11:10
categories: [技术]
---

这篇笔记位于 \`notes/\`，仅在 \`stats.includePaths\` 同时包含 \`posts/%\` 与 \`notes/%\` 时进入统计。
`,

		'public/favicon.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="#41b883"/></svg>\n',
	})
}

// ---------------------------------------------------------------------------
// 配置分支矩阵
// ---------------------------------------------------------------------------

/**
 * clarity.config.ts 的分支化源码。
 *
 * - default：全部功能开启，Twikoo / antiMirror 关闭（默认值路径）
 * - branches：服务端输出与路由分支（enableStyle / hidePostPrefix / Twikoo / antiMirror / 多模式 stats）
 * - features-off：可选功能关闭（静态产物缺失 + SSR 运行时 404）
 */
function clarityConfigSource(variant) {
	const branches = variant === 'branches'
	const featuresOff = variant === 'features-off'
	const includePaths = branches
		? `['posts/%', 'notes/%']`
		: `['posts/%']`

	const article = [
		'\tarticle: {',
		'\t\tcategories: {',
		'\t\t\t技术: { icon: \'tabler:code\' },',
		'\t\t},',
		'\t\trobotsNotIndex: [\'/secret\'],',
		branches && '\t\thidePostPrefix: false,',
		'\t},',
	].filter(Boolean)

	const integrations = [
		'\tintegrations: {',
		branches && `\t\ttwikoo: { envId: '${twikooEnv}' },`,
		!branches && '\t\tscripts: [],',
		'\t},',
	].filter(Boolean)

	const features = [
		'\tfeatures: {',
		featuresOff ? '\t\tatom: false,' : '\t\tatom: true,',
		featuresOff ? '\t\topml: false,' : '\t\topml: true,',
		featuresOff ? '\t\tstats: false,' : '\t\tstats: true,',
		branches
			? `\t\tantiMirror: { blacklist: ['${mirrorDomain}'] },`
			: '\t\tantiMirror: false,',
		'\t},',
	]

	return `import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: '${site.title}',
		description: '${site.description}',
		url: '${site.url}',
		established: '${site.established}',
		favicon: '/favicon.svg',
		author: { name: '${site.author}', email: '${site.email}' },
	},
${article.join('\n')}
	feed: {
		limit: 20,
		enableStyle: ${branches ? 'false' : 'true'},
	},
	stats: {
		includePaths: ${includePaths},
	},
${integrations.join('\n')}
${features.join('\n')}
})
`
}

function nuxtConfigSource(variant) {
	// hidePostPrefix=false 时页面路由保留 /posts 前缀
	const posts = variant === 'branches' ? '/posts' : ''
	const routes = [
		`${posts}/first`,
		`${posts}/mdc`,
		`${posts}/math`,
		`${posts}/mermaid`,
		`${posts}/image`,
		'/custom/permalink',
		`${posts}/secret`,
		'/link',
	].map(route => `\t\t\t\t'${route}',`)

	return `export default defineNuxtConfig({
	extends: ['clarity-theme'],

	nitro: {
		prerender: {
			routes: [
${routes.join('\n')}
			],
		},
	},
})
`
}

/** 切换配置分支：只重写受配置影响的文件，安装产物与内容基准保持不变 */
function writeConsumerVariant(dir, variant) {
	writeFiles(dir, {
		'clarity.config.ts': clarityConfigSource(variant),
		'nuxt.config.ts': nuxtConfigSource(variant),
	})
}

/**
 * clarity.config 会影响 Content 集合（permalink / /posts 前缀改写 path），
 * 切换分支时必须清掉 generate 缓存，避免上一个分支的数据库路径串扰。
 */
function resetConsumerCaches(dir) {
	for (const path of ['.output', '.data']) {
		rmSync(join(dir, path), { recursive: true, force: true })
	}
}

// ---------------------------------------------------------------------------
// generate 产物断言
// ---------------------------------------------------------------------------

function assertGenerateOutput(consumerDir, variant = 'default') {
	const output = join(consumerDir, '.output', 'public')
	assert('generate 产出 .output/public', existsSync(output))
	if (variant === 'branches') {
		assertBranchesOutput(output)
		return
	}
	if (variant === 'features-off') {
		assertFeaturesOffOutput(output)
		return
	}

	const index = read(output, 'index.html')
	assert('clarity.config 站点标题注入', index.includes(site.title))
	assert('clarity.config 描述注入', index.includes(site.description))
	assert('clarity.config favicon 注入', index.includes('/favicon.svg'))
	assert('app.config override（emojiTail 🧪）', index.includes('🧪'))
	assert('Theme generator meta', index.includes(`Clarity Theme ${themePkg.version}`))
	assert('SEO WebSite JSON-LD', index.includes('"@type":"WebSite"'))
	assert('antiMirror=false 不注入脚本', !index.includes(mirrorDomain) && !index.includes(base64(mirrorDomain)))

	// Markdown
	const first = readGeneratedPage(output, '/first')
	const firstPayload = read(output, 'first/_payload.json')
	assert('Markdown 行内代码', first.includes('clarity.config.ts'))
	assert('Markdown 粗体/删除线', first.includes('<strong>') && first.includes('<del>'))
	assert('Markdown 引用块', first.includes('<blockquote>'))
	assert('Markdown 脚注', first.includes('Markdown 脚注内容'))
	assert('Markdown fenced code（ProseCode）', first.includes('z-codeblock') || firstPayload.includes('const answer'))

	// MDC
	const mdc = readGeneratedPage(output, '/mdc')
	assert('MDC Alert', mdc.includes('MDC 信息提示'))
	assert('MDC Tip', mdc.includes('MDC 悬停提示'))
	assert('MDC CardList', mdc.includes('card-list') && mdc.includes('MDC 卡片项'))
	assert('MDC Folding', mdc.includes('<details') && mdc.includes('MDC 折叠标题') && mdc.includes('MDC 折叠内容'))
	assert('MDC Badge', mdc.includes('MDC'))
	assert('custom component override（Badge）', mdc.includes('data-consumer-override="consumer-badge"'))

	// Math
	const math = readGeneratedPage(output, '/math')
	assert('Math KaTeX 渲染', math.includes('katex'))

	// Mermaid
	const mermaid = readGeneratedPage(output, '/mermaid')
	const mermaidPayload = read(output, 'mermaid/_payload.json')
	assert('Mermaid 组件挂载', mermaid.includes('mermaid-diagram'))
	assert('Mermaid 图源码传递', mermaidPayload.includes('graph TD'))

	// Image
	const image = readGeneratedPage(output, '/image')
	assert('Markdown 图片渲染', image.includes('https://placehold.co/600x300/41b883/ffffff/png'))
	assert('Pic 组件渲染', image.includes('Pic 图注'))
	assert('Pic zoom 交互', image.includes('zoom-in'))

	// permalink
	assert('permalink 自定义路由生成', generatedPageExists(output, customPermalink))
	assert('permalink 原文件路由未生成', !generatedPageExists(output, '/permalink'))

	// Twikoo disabled
	assert('Twikoo disabled 文案', first.includes('本文暂未开启评论'))
	assert('Twikoo disabled 不渲染容器', !first.includes('id="twikoo"') && !first.includes('评论加载中'))
	assert('Twikoo disabled 无 preconnect', !index.includes('rel="preconnect"') || !index.includes(twikooEnv))

	// llms
	const llms = read(output, 'llms.txt')
	assert('llms 站点标题', llms.includes(`# ${site.title}`))
	assert('llms 站点描述', llms.includes(`> ${site.description}`))

	// Atom
	const atom = read(output, 'atom.xml')
	assert('Atom 站点配置', atom.includes(`<id>${site.url}</id>`))
	assert('Atom 服务端配置保留 author.email', atom.includes(site.email))
	assert('Atom 自引用', atom.includes(`${site.url}atom.xml`))
	assert('Atom 文章标题', atom.includes('Consumer Markdown 基准'))
	assert('Atom permalink 链接', atom.includes(`${site.url.replace(/\/$/, '')}${customPermalink}`))
	assert('Atom XSLT 样式', atom.includes('assets/atom.xsl'))

	// OPML
	const opml = read(output, 'subscriptions.opml')
	assert('OPML 站点自身订阅', opml.includes(`${site.url}atom.xml`))
	assert('OPML 友链订阅', opml.includes(friendFeed))
	assert('OPML 站点标题', opml.includes(site.title))

	// Stats
	const stats = JSON.parse(read(output, 'api/stats'))
	assert('Stats 文章计数', stats.total?.posts === postCount, `posts=${stats.total?.posts}`)
	assert('Stats 字数统计', stats.total?.words > 0, `words=${stats.total?.words}`)
	assert('Stats 分类统计', Array.isArray(stats.categories) && stats.categories.some(entry => entry.name === '技术' && entry.posts === postCount))
	assert('Stats 年度统计', stats.annual?.['2026']?.posts === postCount)

	// robots
	const robots = read(output, 'robots.txt')
	assert('robots sitemap 声明', robots.includes(`Sitemap: ${site.url}sitemap.xml`))
	assert('robots robotsNotIndex 生效', robots.includes('Disallow: /secret'))

	// sitemap / SEO
	const sitemap = read(output, 'sitemap.xml')
	assert('sitemap 站点 URL', sitemap.includes(`<loc>${site.url}</loc>`))
	assert('sitemap 文章路由', sitemap.includes(`<loc>${site.url}first</loc>`))
	assert('sitemap permalink 路由', sitemap.includes(`<loc>${site.url.replace(/\/$/, '')}${customPermalink}</loc>`))
	assert('SEO canonical', first.includes(`<link rel="canonical" href="${site.url}first">`))
	assert('SEO og:site_name', first.includes(`property="og:site_name" content="${site.title}"`))
	assert('SEO 文章描述', first.includes('验证 Markdown 与 clarity.config 注入'))

	// consumer custom shiki config（用主题显示名判断：@shikijs/colorized-brackets
	// 的内置配色表会包含全部主题的 kebab-case 名称，不能作为加载依据）
	const bundle = readdirSync(join(output, '_nuxt'))
		.filter(file => file.endsWith('.js'))
		.map(file => readFileSync(join(output, '_nuxt', file), 'utf8'))
		.join('\n')
	assert('Shiki 自定义 light 主题', bundle.includes('GitHub Light'))
	assert('Shiki 自定义 dark 主题', bundle.includes('GitHub Dark Default'))
	assert('Shiki Theme 默认主题被覆盖', !bundle.includes('Catppuccin Latte') && !bundle.includes('One Dark Pro'))

	// P0-1：客户端 bundle 边界 —— 服务端/构建期配置不得进入 appConfig
	// 注意：site.author.email 是公开元数据（HTML head author meta 与 Atom 都会输出，
	// 见 ROADMAP「保留现有公开 feed/meta 输出」），因此这里只断言配置形状不泄漏：
	assert(
		'客户端 bundle 无构建期 article 字段',
		!bundle.includes('useRandomPermalink') && !bundle.includes('hidePostPrefix') && !bundle.includes('robotsNotIndex'),
	)
	assert('客户端 bundle 无完整 stats.includePaths', !bundle.includes('includePaths'))
	assert('客户端 bundle 无 feed 服务端配置', !bundle.includes('enableStyle'))
	assert('公开 author meta 仍输出 email（HTML 元数据契约）', index.includes(site.email))
	assert('BlogStats 使用派生的 postsOnly 展示事实', index.includes('文章字数'))
}

/** branches 变体：enableStyle=false + hidePostPrefix=false + Twikoo + antiMirror blacklist + 多模式 stats */
function assertBranchesOutput(output) {
	const index = read(output, 'index.html')
	assert('Twikoo preconnect 注入', index.includes(`<link rel="preconnect" href="${twikooEnv}">`))
	assert(
		'antiMirror blacklist 脚本注入',
		index.includes(base64(mirrorDomain)) && index.includes(base64(site.url)),
	)

	const first = readGeneratedPage(output, '/posts/first')
	assert('hidePostPrefix=false 保留 /posts 路由', first.includes('Consumer Markdown 基准'))
	assert('hidePostPrefix=false 无前缀路由未生成', !generatedPageExists(output, '/first'))
	assert('Twikoo enabled 渲染容器', first.includes('id="twikoo"') && first.includes('评论加载中'))

	const mdc = readGeneratedPage(output, '/posts/mdc')
	assert('branches 变体组件覆盖仍生效', mdc.includes('data-consumer-override="consumer-badge"'))

	assert('permalink 覆盖 hidePostPrefix', generatedPageExists(output, customPermalink))
	assert('permalink 原文件路由未生成（含前缀）', !generatedPageExists(output, '/posts/permalink'))

	const atom = read(output, 'atom.xml')
	assert('enableStyle=false 仍生成 atom', atom.includes(`<id>${site.url}</id>`))
	assert('enableStyle=false 无 XSLT 样式', !atom.includes('xml-stylesheet') && !atom.includes('atom.xsl'))
	assert('atom 使用 /posts 路由', atom.includes(`${site.url}posts/first`))

	const sitemap = read(output, 'sitemap.xml')
	assert('sitemap 使用 /posts 路由', sitemap.includes(`<loc>${site.url}posts/first</loc>`))

	const robots = read(output, 'robots.txt')
	assert('branches 变体 robotsNotIndex 生效', robots.includes('Disallow: /secret'))

	// P1-2：多模式 stats 必须取并集（posts/% OR notes/%），而非不可能同时满足的交集
	const stats = JSON.parse(read(output, 'api/stats'))
	assert(
		'Stats 多模式并集计数',
		stats.total?.posts === postCount + noteCount,
		`posts=${stats.total?.posts}（期望 ${postCount + noteCount}：${postCount} 篇 posts + ${noteCount} 篇 notes）`,
	)
	assert('Stats 多模式字数统计', stats.total?.words > 0)
}

/** features-off 变体：atom / opml / stats 关闭（静态产物断言；运行时 404 由 assertFeatureOffRuntime 覆盖） */
function assertFeaturesOffOutput(output) {
	assert('atom=false 不生成 atom.xml', !existsSync(join(output, 'atom.xml')))
	assert('opml=false 不生成 subscriptions.opml', !existsSync(join(output, 'subscriptions.opml')))
	assert('stats=false 不生成 api/stats', !existsSync(join(output, 'api/stats')))

	const index = read(output, 'index.html')
	assert('atom=false 无 alternate 声明', !index.includes('application/atom+xml'))

	const first = readGeneratedPage(output, '/first')
	assert('features-off 不影响文章路由', first.includes('Consumer Markdown 基准'))
	assert('features-off 变体 Twikoo 仍关闭', first.includes('本文暂未开启评论'))
	assert('permalink 路由仍生成', generatedPageExists(output, customPermalink))
}

/**
 * P0-2：feature-off 的运行时语义。
 *
 * 静态 generate 只证明「文件不存在」；这里用真实 nuxt build + Nitro 服务验证
 * dev/SSR 部署下禁用的路由同样返回 404，且不影响其余页面渲染。
 */
async function assertFeatureOffRuntime(consumerDir) {
	run('pnpm', consumerDir, ['exec', 'nuxt', 'build'])

	const serverEntry = join(consumerDir, '.output', 'server', 'index.mjs')
	assert('features-off 构建产物包含 server 入口', existsSync(serverEntry))

	const port = 20000 + Math.floor(Math.random() * 20000)
	const child = spawn(process.execPath, [serverEntry], {
		cwd: consumerDir,
		stdio: 'ignore',
		env: {
			...process.env,
			HOST: '127.0.0.1',
			PORT: String(port),
			NITRO_PORT: String(port),
			NODE_ENV: 'production',
			FORCE_COLOR: '0',
			NO_COLOR: '1',
		},
	})
	const baseUrl = `http://127.0.0.1:${port}`
	try {
		await waitForServer(child, baseUrl)
		console.log(`      ✓ production 服务就绪 ${baseUrl}`)

		const home = await fetch(`${baseUrl}/`)
		assert('feature-off 服务仍可渲染首页', home.status === 200, `status=${home.status}`)
		await home.body?.cancel().catch(() => {})

		for (const route of ['/atom.xml', '/subscriptions.opml', '/api/stats']) {
			const res = await fetch(`${baseUrl}${route}`)
			assert(`feature-off 运行时 404：${route}`, res.status === 404, `status=${res.status}`)
			await res.body?.cancel().catch(() => {})
		}
	}
	finally {
		await killTree(child)
	}
}

async function waitForServer(child, baseUrl) {
	const deadline = Date.now() + 30000
	while (Date.now() < deadline) {
		if (child.exitCode !== null)
			throw new Error(`features-off 服务提前退出（code ${child.exitCode}）`)
		try {
			const res = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(2000) })
			if (res.status < 500)
				return
			await res.body?.cancel().catch(() => {})
		}
		catch {}
		await new Promise(resolve => setTimeout(resolve, 500))
	}
	throw new Error('features-off 服务启动超时（30s）')
}

async function killTree(child) {
	if (child.exitCode !== null || child.killed)
		return
	if (process.platform === 'win32') {
		try {
			execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' })
		}
		catch {}
	}
	else {
		child.kill('SIGTERM')
	}
	await new Promise((resolve) => {
		const timer = setTimeout(resolve, 10000)
		child.once('exit', () => {
			clearTimeout(timer)
			resolve()
		})
	})
}

function read(base, path) {
	return readFileSync(join(base, path), 'utf8')
}

/**
 * Nitro 的 autoSubfolderIndex 在 GitHub Actions / Cloudflare / Netlify 会关闭，
 * 此时 `/first` 生成 `first.html`；本地默认则生成 `first/index.html`。
 * Consumer 断言必须同时接受两种官方输出形态。
 */
function generatedPageExists(base, route) {
	const normalizedRoute = route.replace(/^\//, '')
	return existsSync(join(base, normalizedRoute, 'index.html'))
		|| existsSync(join(base, `${normalizedRoute}.html`))
}

function readGeneratedPage(base, route) {
	const normalizedRoute = route.replace(/^\//, '')
	const candidates = [
		join(base, normalizedRoute, 'index.html'),
		join(base, `${normalizedRoute}.html`),
	]
	const file = candidates.find(path => existsSync(path))
	if (!file)
		throw new Error(`未找到页面产物：${candidates.join(' 或 ')}`)
	return readFileSync(file, 'utf8')
}

/** anti-mirror 脚本参数使用 btoa（latin1）编码；测试数据均为 ASCII，可直接对比 */
function base64(text) {
	return Buffer.from(text, 'latin1').toString('base64')
}

// ---------------------------------------------------------------------------
// 基础工具
// ---------------------------------------------------------------------------

function run(label, cwd, args) {
	const command = [label, ...args].map(quote).join(' ')
	execSync(command, {
		cwd,
		stdio: 'inherit',
		env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' },
	})
}

function quote(arg) {
	return /[\s"^]/.test(arg) ? `"${arg.replaceAll('"', '""')}"` : arg
}

function step(index, total, title) {
	console.log(`\n▶ [${index}/${total}] ${title}`)
}

function assert(name, ok, detail = '') {
	if (!ok) {
		throw new Error(`断言失败：${name}${detail ? `（${detail}）` : ''}`)
	}
	console.log(`  ✓ ${name}${detail ? `（${detail}）` : ''}`)
}

function writeFiles(dir, files) {
	for (const [path, content] of Object.entries(files)) {
		const fullPath = join(dir, path)
		mkdirSync(dirname(fullPath), { recursive: true })
		writeFileSync(fullPath, content)
	}
}

function listFiles(dir, base = dir) {
	const files = []
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry)
		if (statSync(fullPath).isDirectory()) {
			files.push(...listFiles(fullPath, base))
		}
		else {
			files.push(relative(base, fullPath))
		}
	}
	return files
}

main()
