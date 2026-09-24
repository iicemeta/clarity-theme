import type { Nuxt } from '@nuxt/schema'
import type { ClarityConfig } from '../../config/schema'
import type { ClarityServerConfig } from '../../config/server'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { platform } from 'node:process'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import {
	addImportsDir,
	addTypeTemplate,
	defineNuxtModule,
	updateAppConfig,
	useLogger,
} from 'nuxt/kit'
import { parse as parseYaml } from 'yaml'
import { fallbackPnpmWorkspace } from '../../config/pnpm-workspace'
import { toPublicClarityConfig } from '../../config/public'
import { clarityConfigSchema, legacyConfigKeys, stripLegacyConfigKeys } from '../../config/schema'
import { toServerClarityConfig } from '../../config/server'
import uiDefaults from '../../config/ui'

const moduleDir = dirname(fileURLToPath(import.meta.url))
/** Theme 运行时源码根（src/）：模块位于 src/modules/clarity-config */
const themeSrcDir = resolve(moduleDir, '../..')
/** Windows 路径比较需要大小写不敏感（vite 解析产物盘符大小写不定） */
const IS_WINDOWS = platform === 'win32'

/** app/app.config.ts 中允许作为 UI 覆盖的顶层键（站点级字段属于 clarity.config.ts） */
const uiConfigKeys = new Set(['component', 'footer', 'header', 'link', 'nav', 'pagination', 'themes'])

export interface ModuleOptions {
	/** 消费项目中 clarity 配置文件路径（相对 rootDir） */
	configFile?: string
}

/** 构建数据重定向插件的最小结构化形状（vite resolveId 子集） */
interface RedirectPlugin {
	name: string
	resolveId: {
		order: 'pre'
		handler: (source: string) => { id: string } | undefined
	}
}

export default defineNuxtModule<ModuleOptions>({
	meta: {
		name: 'clarity-config',
		configKey: 'clarityConfig',
	},

	async setup(options, nuxt) {
		const logger = useLogger('clarity-config')
		const rootDir = nuxt.options.rootDir

		const configPath = resolve(rootDir, options.configFile ?? findConfigFile(rootDir))
		const feedsPath = findFeedsFile(rootDir, themeSrcDir)
		const consumerBlogConfigPath = findExisting(rootDir, ['blog.config.ts', 'blog.config.mjs', 'blog.config.js'])
		const consumerSrcFeedsPath = findExisting(nuxt.options.srcDir, ['feeds.ts', 'feeds.mjs', 'feeds.js'])

		// ---- 依赖注入层：Theme 内部不感知消费项目的文件布局 ----
		// 上游文件通过 `~~/blog.config` / `~/feeds` 读取站点数据；消费项目使用
		// clarity.config.ts（或根目录 feeds.ts），这里以前缀更长的别名承接，
		// 使上游同步文件无需改写即可在 Layer 中解析。
		// 新键必须置于 '~' / '~~' 之前，保证 Vite / Nitro 前缀匹配优先命中。
		nuxt.options.alias = {
			...(consumerBlogConfigPath ? {} : { '~~/blog.config': resolve(themeSrcDir, 'blog.config.ts') }),
			// 上游 server 路由通过 ~~/shared/utils/time 引用工具；消费项目没有
			// shared 目录时指向 Theme 内置实现。
			...(existsSync(resolve(rootDir, 'shared')) ? {} : { '~~/shared': resolve(themeSrcDir, 'shared') }),
			...(consumerSrcFeedsPath ? {} : { '~/feeds': feedsPath.resolved }),
			'#clarity/config': configPath,
			'#clarity/feeds': feedsPath.resolved,
			...nuxt.options.alias,
		}

		// @pinia/nuxt 不会自动扫描 Layer 的 stores 目录，需显式注册
		addImportsDir(resolve(themeSrcDir, 'stores'))

		// ---- AppConfig 类型化：上游扁平键 + 0.1.x 的 clarity 键都获得类型提示 ----
		// 注意：类型文件生成于 buildDir/types/ 下，相对路径必须以其为基准计算，
		// 否则导入解析失败会因 skipLibCheck 静默退化为 any（审计发现 #9）。
		const appConfigTypeDir = resolve(nuxt.options.buildDir, 'types')
		const appConfigTypePath = relative(appConfigTypeDir, resolve(themeSrcDir, 'config/app.ts')).replaceAll('\\', '/')
		const globalsTypePath = relative(appConfigTypeDir, resolve(themeSrcDir, 'types/index.ts')).replaceAll('\\', '/')
		addTypeTemplate({
			filename: 'types/clarity-app-config.d.ts',
			getContents: () => [
				// app/types/index.ts 的 Window.twikoo 等环境声明在 node_modules Layer 中
				// 不会被 tsconfig include 命中（被 node_modules exclude 过滤），需显式导入
				`import '${globalsTypePath}'`,
				`import type { ClarityAppConfig, ClarityAppConfigArticle, ClarityUiConfigInput } from '${appConfigTypePath}'`,
				'',
				'declare module \'@nuxt/schema\' {',
				'  // 读取侧：clarity 用 unknown 回落到注入值；UI 扁平键补充完整类型，',
				'  // 使上游组件在 JSON 字面量（空数组 / 宽化字符串）下仍获得正确类型。',
				'  // article 只声明 categories（Record 索引），order / types 保留 Resolved 字面量。',
				'  interface CustomAppConfig {',
				'    /** @deprecated 0.1.x 兼容键：UI 覆盖请直接使用顶层扁平键（上游形状） */',
				'    clarity?: unknown',
				'    article?: ClarityAppConfigArticle',
				'    component?: ClarityUiConfig[\'component\']',
				'    footer?: ClarityUiConfig[\'footer\']',
				'    header?: ClarityUiConfig[\'header\']',
				'    link?: ClarityUiConfig[\'link\']',
				'    nav?: ClarityUiConfig[\'nav\']',
				'    themes?: ClarityUiConfig[\'themes\']',
				'  }',
				'  interface AppConfigInput {',
				'    clarity?: ClarityAppConfig | ClarityUiConfigInput',
				'  }',
				'}',
				'',
			].join('\n'),
		})

		// @bikariya/shiki 运行时固定导入 ~/shiki.config，
		// 消费项目未提供时回退到 Theme 内置配置；
		// 需置于 '~' 之前以保证 Vite 别名前缀优先匹配
		if (!existsSync(resolve(nuxt.options.srcDir, 'shiki.config.ts'))) {
			nuxt.options.alias = {
				'~/shiki.config': resolve(themeSrcDir, 'shiki.config.ts'),
				...nuxt.options.alias,
			}
		}

		if (!existsSync(configPath)) {
			throw new Error(
				`[clarity-config] 未找到 ${configPath}。`
				+ '请在消费项目根目录创建 clarity.config.ts（可参考 playground/clarity.config.ts）。',
			)
		}
		if (!feedsPath.found) {
			logger.warn('未找到 feeds.ts，友链页面与 OPML 订阅将输出空数据。')
		}

		// ---- 读取并校验站点配置（错误在构建开始前暴露） ----
		const jiti = createJiti(import.meta.url, { moduleCache: false, interopDefault: true })
		const configModule = await importConfigFile(jiti, configPath)
		const config = parseClarityConfig((configModule as { default?: unknown })?.default ?? configModule, configPath, logger)
		const { site, article, integrations, features } = config

		// ---- 上游构建期数据模块：~~/package.json 与 ~~/pnpm-workspace.yaml ----
		// 上游 BlogTech / atom.xml 通过这两个说明符读取消费项目数据；直接把别名
		// 指到真实 JSON/YAML 文件时，Nitro prerenderer 会将其外部化（Node 无法
		// 以 ESM 导入 JSON/YAML），导致含 BlogTech 的页面（首页）在预渲染时崩溃。
		// 因此在 buildDir 生成等价 ES 模块，运行时别名与 TS 声明都指向生成物。
		const consumerPkg = (await loadJson(resolve(rootDir, 'package.json'), jiti)) ?? {}
		const missingPkgFields = ['name', 'version'].filter(field => !consumerPkg[field])
		if (missingPkgFields.length) {
			logger.warn(
				`package.json 缺少 [${missingPkgFields.join(', ')}] 字段，BlogTech 等组件将显示空值`
				+ '（数据经生成模块归一化，构建不会因此失败）。',
			)
		}
		const pnpmWorkspace = loadPnpmWorkspace(rootDir)
		// 写入 Theme 包内的固定路径：prepare / build / prerenderer 等多个
		// Nuxt 实例可能使用不同 buildDir，包内路径在所有上下文中一致可用。
		const buildInfoDir = resolve(themeSrcDir, 'generated')
		mkdirSync(buildInfoDir, { recursive: true })
		const packageJsonModulePath = join(buildInfoDir, 'package-json.mjs').replaceAll('\\', '/')
		writeFileSync(packageJsonModulePath, [
			`const packageJson = ${JSON.stringify({
				name: String(consumerPkg.name ?? ''),
				version: String(consumerPkg.version ?? ''),
				packageManager: String(consumerPkg.packageManager ?? ''),
			})}`,
			'export default packageJson',
			`export const packageManager = ${JSON.stringify(String(consumerPkg.packageManager ?? ''))}`,
			`export const version = ${JSON.stringify(String(consumerPkg.version ?? ''))}`,
			'',
		].join('\n'))
		const pnpmWorkspaceModulePath = join(buildInfoDir, 'pnpm-workspace.mjs').replaceAll('\\', '/')
		writeFileSync(pnpmWorkspaceModulePath, `export default ${JSON.stringify(pnpmWorkspace)}\n`)
		nuxt.options.alias = {
			'~~/package.json': packageJsonModulePath,
			'~~/pnpm-workspace.yaml': pnpmWorkspaceModulePath,
			...nuxt.options.alias,
		}

		// 上游形状的 blog.config 数据模块：anti-mirror 等 Layer 模块由 Nuxt 以
		// jiti 加载，无法解析 #clarity/* 别名（src/blog.config.ts 运行时适配层
		// 仅适用于 App / Nitro 构建上下文），因此这里把映射结果内联成真实模块。
		const blogConfigData = toUpstreamBlogConfig(config)
		const blogConfigModulePath = join(buildInfoDir, 'blog.config.mjs').replaceAll('\\', '/')
		writeFileSync(blogConfigModulePath, [
			`const blogConfig = ${JSON.stringify(blogConfigData)}`,
			'export default blogConfig',
			`export const myFeed = ${JSON.stringify(toMyFeedEntry(blogConfigData))}`,
			'',
		].join('\n'))

		// 两个说明符的 TS 侧声明（app / server 类型工程的路径重定向目标）
		const yamlDecl = addTypeTemplate({
			filename: 'types/clarity-yaml-workspace.d.ts',
			getContents: () => [
				'declare const value: Record<string, unknown>',
				'export default value',
				'',
			].join('\n'),
		})
		const packageJsonDecl = addTypeTemplate({
			filename: 'types/clarity-package-json.d.ts',
			getContents: () => [
				'declare const value: { name: string, version: string, packageManager: string }',
				'export default value',
				'export const packageManager: string',
				'export const version: string',
				'',
			].join('\n'),
		})

		// 上游类型兼容垫片（post.author 可选字段、*.yaml 导入声明）
		// 需要在 app / shared / server 三个类型工程中同样生效。
		const compatTypesPath = resolve(themeSrcDir, 'types/upstream-compat.d.ts')
		const withLeadingDot = (path: string) => path.startsWith('.') ? path : `./${path}`
		nuxt.hook('prepare:types', ({ references, sharedReferences, nodeReferences, tsConfig }) => {
			references.push({ path: compatTypesPath })
			sharedReferences.push({ path: compatTypesPath })
			nodeReferences.push({ path: compatTypesPath })
			// TS 的别名路径替换会去掉 .json/.yaml 扩展名导致解析失败，
			// 重定向到上方声明模块。
			if (tsConfig.compilerOptions?.paths) {
				const packageJsonDeclPath = relative(nuxt.options.buildDir, resolve(nuxt.options.buildDir, packageJsonDecl.filename)).replaceAll('\\', '/')
				tsConfig.compilerOptions.paths['~~/package.json'] = [withLeadingDot(packageJsonDeclPath)]
				const yamlDeclPath = relative(nuxt.options.buildDir, resolve(nuxt.options.buildDir, yamlDecl.filename)).replaceAll('\\', '/')
				tsConfig.compilerOptions.paths['~~/pnpm-workspace.yaml'] = [withLeadingDot(yamlDeclPath)]
			}
		})
		nuxt.hook('nitro:prepare:types', ({ declarations }) => {
			declarations.push(`/// <reference types="${compatTypesPath.replaceAll('\\', '/')}" />`)
		})

		// prerenderer 是独立的 Nitro 子构建（nitro:config 不会对其生效），
		// 生成模块在其中必须内联：外部化为绝对 Windows 路径后 Node 无法
		// 以 ESM 导入，含 BlogTech 的首页会在预渲染时挂起。
		;(nuxt.hook as unknown as (event: string, cb: (config: Record<string, any>) => void) => void)('prerender:config', (prerendererConfig) => {
			prerendererConfig.externals ??= {}
			prerendererConfig.externals.inline ??= []
			prerendererConfig.externals.inline.push(packageJsonModulePath, pnpmWorkspaceModulePath)
		})
		nuxt.hook('nitro:config', (nitroConfig) => {
			nitroConfig.typescript ??= {}
			nitroConfig.typescript.tsConfig ??= {}
			nitroConfig.typescript.tsConfig.compilerOptions ??= {}
			nitroConfig.typescript.tsConfig.compilerOptions.paths ??= {}
			nitroConfig.typescript.tsConfig.compilerOptions.paths['~~/package.json'] = [withLeadingDot(packageJsonDecl.filename)]
			nitroConfig.typescript.tsConfig.compilerOptions.paths['~~/pnpm-workspace.yaml'] = [withLeadingDot(yamlDecl.filename)]
		})

		// ---- Vite 打包上下文的重定向契约 ----
		// 上方为 `~~/package.json` / `~~/pnpm-workspace.yaml` 设置的精确别名，
		// 在 dev（JS 版 alias 插件，首个匹配生效）中按预期指向生成模块；
		// 但生产构建的 bundled 环境使用 rolldown 原生 alias 插件，其匹配
		// 语义让更短的 `~~` → rootDir 前缀别名抢先，导入被改写为消费项目的
		// 真实文件路径（consumer package.json 缺 version 时即 MISSING_EXPORT）。
		// 消费项目的真实文件是数据源而非打包目标，这里以显式 resolveId 契约
		// 把两个绝对路径重定向到生成模块：client / SSR 打包语义一致，且不再
		// 依赖跨上下文的隐式别名匹配顺序。
		const rootPackageJsonId = resolve(rootDir, 'package.json').replaceAll('\\', '/')
		const rootWorkspaceYamlId = resolve(rootDir, 'pnpm-workspace.yaml').replaceAll('\\', '/')
		const idEquals = (a: string, b: string) => IS_WINDOWS
			? a.toLowerCase() === b.toLowerCase()
			: a === b
		nuxt.hook('vite:extendConfig', (config) => {
			// InlineConfig.plugins 是 readonly 声明，但 hook 语义允许就地追加；
			// 插件形状用本地结构化类型，避免对 vite 类型的直接依赖
			const plugins = (config as { plugins: Array<RedirectPlugin> }).plugins ??= []
			plugins.unshift({
				name: 'clarity:build-data-redirect',
				resolveId: {
					order: 'pre',
					handler(source) {
						if (idEquals(source, rootPackageJsonId)) {
							return { id: packageJsonModulePath }
						}
						if (idEquals(source, rootWorkspaceYamlId)) {
							return { id: pnpmWorkspaceModulePath }
						}
						return undefined
					},
				},
			})
		})

		// ---- 消费项目 app/app.config.ts：读取 0.1.x `clarity` 键的 UI 覆盖 ----
		const consumerAppConfig = await loadConsumerAppConfig(nuxt, jiti)
		const clarityUi = pickUiOverrides(consumerAppConfig?.clarity)
		await warnSiteLevelAppConfigOverrides(consumerAppConfig, logger)

		// ---- 上游形状的扁平 AppConfig 注入（upstream parity 的关键）----
		// blog-v3 组件一律通过 useAppConfig() 读取扁平键（title / nav / component.*）。
		// 这里将 clarity.config.ts + UI 默认值 + 0.1.x clarity 覆盖注入为同一形状；
		// 消费项目仍可在自己的 app.config.ts 中按上游习惯直接覆盖任意扁平键。
		updateAppConfig({
			// 站点数据（上游来自 blog.config.ts 展开进 app.config.ts）
			title: site.title,
			subtitle: site.subtitle ?? '',
			description: site.description,
			author: {
				name: site.author.name,
				avatar: site.author.avatar ?? '',
				email: site.author.email ?? '',
				homepage: site.author.homepage ?? '/',
			},
			copyright: site.copyright ?? { abbr: '', name: '', url: '' },
			favicon: site.favicon,
			language: site.language,
			timeEstablished: site.established ?? '',
			timeZone: site.timezone,
			url: site.url,
			defaultCategory: article.defaultCategory,
			article: {
				categories: article.categories,
				types: article.types,
				order: article.order,
				useRandomPremalat: false,
				hidePostPrefix: article.hidePostPrefix,
				robotsNotIndex: article.robotsNotIndex,
			},
			feed: config.feed,
			scripts: integrations.scripts,
			stats: config.stats,
			twikoo: integrations.twikoo ?? { envId: '', preload: '' },

			// UI 配置：站点派生值覆盖结构默认值，0.1.x clarity 覆盖优先级最高
			...mergeUiConfig(clarityUi, {
				...uiDefaults,
				header: {
					...uiDefaults.header,
					logo: site.author.avatar ?? site.favicon,
					subtitle: site.subtitle ?? site.description,
				},
				footer: {
					...uiDefaults.footer,
					copyright: `© ${new Date().getFullYear()} ${site.author.name}`,
				},
			}),
		})

		// ---- 0.1.x 兼容：继续注入完整的 clarity 键（useClarityConfig() 读取侧）----
		updateAppConfig({
			clarity: {
				...toPublicClarityConfig(config),
				header: {
					logo: site.author.avatar ?? '',
					subtitle: site.subtitle ?? '',
				},
				footer: {
					copyright: site.copyright?.name
						? `© ${new Date().getFullYear()} ${site.author.name} · ${site.copyright.name}`
						: `© ${new Date().getFullYear()} ${site.author.name}`,
				},
			},
		})

		// ---- 服务端专用配置：注入 Nitro 私有 runtimeConfig（不进入客户端 bundle）----
		// 保留 0.1.x 的 useClarityServerConfig() 兼容；上游 server 路由已恢复为
		// 直接读取 `~~/blog.config`，不再依赖该通道。
		;(nuxt.options.runtimeConfig as { clarity?: ClarityServerConfig }).clarity = toServerClarityConfig(config)

		// ---- SEO / site / robots / llms ----
		nuxt.options.site = {
			...nuxt.options.site,
			name: site.title,
			url: site.url,
			defaultLocale: site.language,
		} as typeof nuxt.options.site

		nuxt.options.robots = {
			...nuxt.options.robots,
			disallow: article.robotsNotIndex,
		} as typeof nuxt.options.robots

		// nuxt-llms 的配置类型由该模块按需合并，此处运行时注入
		const llmsOptions = (nuxt.options as any).llms ?? {}
		;(nuxt.options as any).llms = {
			...llmsOptions,
			domain: site.url,
			title: site.title,
			description: site.description,
		}

		// ---- Head 元数据 ----
		const head = nuxt.options.app.head
		head.meta ??= []
		head.meta.push({ name: 'author', content: [site.author.name, site.author.email].filter(Boolean).join(', ') })
		head.link ??= []
		head.link.push({ rel: 'icon', href: site.favicon })
		if (features.atom) {
			head.link.push({ rel: 'alternate', type: 'application/atom+xml', href: '/atom.xml' })
		}
		const twikooPreload = integrations.twikoo?.preload ?? integrations.twikoo?.envId
		if (twikooPreload) {
			head.link.push({ rel: 'preconnect', href: twikooPreload })
		}
		head.script ??= []
		head.script.push(...integrations.scripts as any[])
		head.titleTemplate = `%s %separator ${site.title}`

		// ---- 路由规则 ----
		const routeRules = nuxt.options.routeRules ??= {}
		if (features.stats) {
			routeRules['/api/stats'] = { prerender: true, headers: { 'Content-Type': 'application/json' } }
		}
		if (features.atom) {
			routeRules['/atom.xml'] = { prerender: true, headers: { 'Content-Type': 'application/xml' } }
		}
		if (features.opml) {
			routeRules['/subscriptions.opml'] = { prerender: true, headers: { 'Content-Type': 'application/xml' } }
		}
		routeRules['/favicon.ico'] = { redirect: { to: site.favicon } }

		// ---- 自定义链接与 /posts 前缀处理 ----
		nuxt.hook('content:file:afterParse', (ctx) => {
			const { permalink, path } = ctx.content as Record<string, string | undefined>
			if (permalink) {
				ctx.content.path = permalink
			}
			else if (article.hidePostPrefix && path?.startsWith('/posts/')) {
				ctx.content.path = path.slice('/posts'.length)
			}
		})

		// ---- features.antiMirror 已废弃 ----
		// 上游 modules/anti-mirror 由 Nuxt 自动加载（Layer 的 src/modules 同样生效），
		// 黑名单与跳转目标与上游保持一致；配置项仅为 0.1.x 兼容保留。
		if (features.antiMirror !== false) {
			logger.warn('features.antiMirror 已废弃：上游 anti-mirror 模块始终启用，黑名单与上游保持一致。')
		}
	},
})

async function importConfigFile(jiti: ReturnType<typeof createJiti>, configPath: string) {
	try {
		return await jiti.import(configPath) as unknown
	}
	catch (error) {
		throw new Error(
			`[clarity-config] 加载 ${configPath} 失败：${error instanceof Error ? error.message : String(error)}`,
			{ cause: error },
		)
	}
}

function parseClarityConfig(raw: unknown, configPath: string, logger: ReturnType<typeof useLogger>): ClarityConfig {
	// 0.1.x 兼容：已移除的 legacy 键（如 article.useRandomPermalink）警告后忽略，
	// 不让 strictObject 直接 fatal。defineClarityConfig 已剥离过时此处为空操作，
	// 覆盖裸对象导出（未经过 defineClarityConfig）的配置文件。
	const { config: stripped, legacyKeys } = stripLegacyConfigKeys(raw)
	for (const key of legacyKeys) {
		logger.warn(
			`${configPath} 的 ${key} 已废弃（${legacyConfigKeys[key]}），已忽略。`
			+ '该 0.1.x 兼容将在 0.2.0 移除，请从配置中删除此键。',
		)
	}
	const result = clarityConfigSchema.safeParse(stripped)
	if (!result.success) {
		const issues = result.error.issues
			.map(issue => `  - ${issue.path.join('.') || '(根对象)'}: ${issue.message}`)
			.join('\n')
		throw new Error(`[clarity-config] ${configPath} 校验失败：\n${issues}`)
	}
	return result.data
}

/** 从消费项目 app/app.config.ts 读取导出对象（失败时交给 Nuxt 自身报错） */
async function loadConsumerAppConfig(nuxt: Nuxt, jiti: ReturnType<typeof createJiti>) {
	const candidates = [
		resolve(nuxt.options.srcDir, 'app.config.ts'),
		resolve(nuxt.options.rootDir, 'app.config.ts'),
	]
	for (const appConfigPath of candidates) {
		if (!existsSync(appConfigPath)) {
			continue
		}
		// app.config.ts 依赖 defineAppConfig 全局函数，jiti 裸加载时需要临时注入（运行时它只是恒等函数）
		const globalScope = globalThis as { defineAppConfig?: (config: unknown) => unknown }
		const previousDefine = globalScope.defineAppConfig
		globalScope.defineAppConfig ??= (config: unknown) => config
		try {
			const mod = await jiti.import(appConfigPath) as unknown
			return ((mod as { default?: unknown })?.default ?? mod) as Record<string, unknown> | undefined
		}
		catch {
			return undefined
		}
		finally {
			if (previousDefine === undefined) {
				delete globalScope.defineAppConfig
			}
			else {
				globalScope.defineAppConfig = previousDefine
			}
		}
	}
	return undefined
}

/** 站点级字段出现在 app.config.ts 会压过 clarity.config.ts 注入，需要提示迁移 */
async function warnSiteLevelAppConfigOverrides(appConfig: Record<string, unknown> | undefined, logger: ReturnType<typeof useLogger>) {
	if (!appConfig) {
		return
	}
	const offenders = Object.keys(appConfig).filter(key => !uiConfigKeys.has(key) && key !== 'clarity')
	if (appConfig.clarity && typeof appConfig.clarity === 'object') {
		const clarityOffenders = Object.keys(appConfig.clarity as Record<string, unknown>).filter(key => !uiConfigKeys.has(key))
		if (clarityOffenders.length) {
			logger.warn(
				`app/app.config.ts 的 clarity 中出现站点级字段 [${clarityOffenders.join(', ')}]，`
				+ '请将站点配置迁移到 clarity.config.ts。',
			)
		}
	}
	if (offenders.length) {
		logger.warn(
			`app/app.config.ts 中出现站点级字段 [${offenders.join(', ')}]，`
			+ '它们会覆盖 clarity.config.ts 的注入结果；请将站点配置迁移到 clarity.config.ts。',
		)
	}
}

/** 深度合并 UI 覆盖：对象递归合并、数组整体替换（覆盖语义） */
function mergeUiConfig(overrides: Record<string, unknown> | undefined, base: Record<string, unknown>) {
	if (!overrides) {
		return base
	}
	const result: Record<string, unknown> = { ...base }
	for (const [key, value] of Object.entries(overrides)) {
		const baseValue = result[key]
		result[key]
			= value && baseValue && typeof value === 'object' && typeof baseValue === 'object'
				&& !Array.isArray(value) && !Array.isArray(baseValue)
				? mergeUiConfig(value as Record<string, unknown>, baseValue as Record<string, unknown>)
				: value
	}
	return result
}

function pickUiOverrides(clarity: unknown) {
	if (!clarity || typeof clarity !== 'object') {
		return undefined
	}
	const picked = Object.fromEntries(
		Object.entries(clarity as Record<string, unknown>).filter(([key]) => uiConfigKeys.has(key)),
	)
	return Object.keys(picked).length ? picked : undefined
}

/** clarity.config → 上游 blog.config 扁平形状（与 src/blog.config.ts 适配层保持一致） */
function toUpstreamBlogConfig(config: ClarityConfig) {
	const { site, article, feed, stats, integrations } = config
	return {
		title: site.title,
		subtitle: site.subtitle ?? '',
		description: site.description,
		author: {
			name: site.author.name,
			avatar: site.author.avatar ?? '',
			email: site.author.email ?? '',
			homepage: site.author.homepage ?? '/',
		},
		copyright: site.copyright ?? { abbr: '', name: '', url: '' },
		favicon: site.favicon,
		language: site.language,
		timeEstablished: site.established ?? '',
		timeZone: site.timezone,
		url: site.url,
		defaultCategory: article.defaultCategory,
		article: {
			categories: article.categories,
			types: article.types,
			order: article.order,
			useRandomPremalat: false,
			hidePostPrefix: article.hidePostPrefix,
			robotsNotIndex: article.robotsNotIndex,
		},
		feed,
		scripts: integrations.scripts,
		stats,
		twikoo: integrations.twikoo ?? { envId: '', preload: '' },
	}
}

function toMyFeedEntry(blogConfig: ReturnType<typeof toUpstreamBlogConfig>) {
	return {
		author: blogConfig.author.name,
		sitenick: blogConfig.title,
		title: blogConfig.title,
		desc: blogConfig.subtitle || blogConfig.description,
		link: blogConfig.url,
		feed: new URL('/atom.xml', blogConfig.url).toString(),
		icon: blogConfig.favicon,
		avatar: blogConfig.author.avatar,
		archs: ['Nuxt'],
		date: blogConfig.timeEstablished,
		comment: '这是我自己',
	}
}

/** 读取消费项目 pnpm-workspace.yaml 的 catalogs；缺失或无 catalogs 时回退到 Theme 内置版本数据 */
function loadPnpmWorkspace(rootDir: string) {
	const yamlPath = resolve(rootDir, 'pnpm-workspace.yaml')
	if (existsSync(yamlPath)) {
		try {
			const parsed = parseYaml(readFileSync(yamlPath, 'utf8')) as Record<string, unknown>
			if (parsed?.catalogs && typeof parsed.catalogs === 'object') {
				return { catalogs: parsed.catalogs as Record<string, Record<string, string>> }
			}
		}
		catch {
			// 解析失败时回退到 Theme 内置数据
		}
	}
	return { catalogs: fallbackPnpmWorkspace.catalogs as Record<string, Record<string, string>> }
}

async function loadJson(path: string, jiti: ReturnType<typeof createJiti>) {
	try {
		return ((await jiti.import(path)) as { default?: Record<string, unknown> } | undefined)?.default
	}
	catch {
		return undefined
	}
}

function findConfigFile(rootDir: string) {
	for (const name of ['clarity.config.ts', 'clarity.config.mjs', 'clarity.config.js']) {
		if (existsSync(resolve(rootDir, name))) {
			return name
		}
	}
	return 'clarity.config.ts'
}

function findExisting(dir: string, names: string[]) {
	for (const name of names) {
		const path = resolve(dir, name)
		if (existsSync(path)) {
			return path
		}
	}
	return undefined
}

function findFeedsFile(rootDir: string, themeSrcDir: string) {
	const found = findExisting(rootDir, ['feeds.ts', 'feeds.mjs', 'feeds.js'])
	if (found) {
		return { found: true, resolved: found }
	}
	return { found: false, resolved: resolve(themeSrcDir, 'config/feeds.empty.ts') }
}
