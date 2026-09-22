import type { Nuxt } from '@nuxt/schema'
import type { ClarityConfig } from '../../config/schema'
import type { ClarityServerConfig } from '../../config/server'
import { existsSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import {
	addImportsDir,
	addTypeTemplate,
	defineNuxtModule,
	updateAppConfig,
	useLogger,
} from 'nuxt/kit'
import nuxtPkg from 'nuxt/package.json'
import { minify } from 'oxc-minify'
import vuePkg from 'vue/package.json'
import { toPublicClarityConfig } from '../../config/public'
import { clarityConfigSchema } from '../../config/schema'
import { toServerClarityConfig } from '../../config/server'
import handleMirror from './anti-mirror-client'

const moduleDir = dirname(fileURLToPath(import.meta.url))
/** Theme 运行时源码根（src/）：模块位于 src/modules/clarity-config */
const themeSrcDir = resolve(moduleDir, '../..')
/** Theme npm 包根（nuxt.config.ts / package.json 所在层） */
const themePkgDir = resolve(moduleDir, '../../..')

/** app/app.config.ts 的 clarity 键只允许 UI 覆盖（站点级字段属于 clarity.config.ts） */
const uiConfigKeys = new Set(['component', 'footer', 'header', 'link', 'nav', 'pagination', 'themes'])

export interface ModuleOptions {
	/** 消费项目中 clarity 配置文件路径（相对 rootDir） */
	configFile?: string
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

		// ---- 依赖注入层：Theme 内部不感知消费项目的文件布局 ----
		Object.assign(nuxt.options.alias, {
			'#clarity/config': configPath,
			'#clarity/feeds': feedsPath.resolved,
		})

		// @pinia/nuxt 不会自动扫描 Layer 的 stores 目录，需显式注册
		addImportsDir(resolve(themeSrcDir, 'stores'))

		// ---- AppConfig 类型化：消费者 defineAppConfig({ clarity: ... }) 获得完整类型提示 ----
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
				`import type { ClarityAppConfig, ClarityUiConfigInput } from '${appConfigTypePath}'`,
				'',
				'declare module \'@nuxt/schema\' {',
				'  // 读取侧：unknown 使 MergedAppConfig 回落到 Theme 注入的完整 Resolved 类型',
				'  interface CustomAppConfig {',
				'    clarity?: unknown',
				'  }',
				'  // 输入侧：完整配置（Theme 内部）或 UI 部分覆盖（消费项目 app/app.config.ts）',
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
		const config = parseClarityConfig((configModule as { default?: unknown })?.default ?? configModule, configPath)
		const { site, article, integrations, features } = config

		// ---- 边界审计：app/app.config.ts 中不应出现站点级字段（其优先级更高，会覆盖站点配置注入） ----
		await warnNonUiAppConfigOverrides(nuxt, jiti, logger)

		// ---- Site Config → App Config 桥梁 ----
		// 注意 Nuxt appConfig 合并优先级：消费项目 app.config > Theme app.config > 模块注入，
		// 因此站点派生默认值（header.logo 等）不放入 Theme 的 app.config.ts，
		// 由这里注入后仍可被消费项目覆盖。
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
		// Atom/OPML/stats 处理器与 feature 路由守卫从这里读取完整配置。
		// 注意：Nuxt 会按消费者实际值推导 runtimeConfig 类型（可选字段可能被推断为必填），
		// 此处以 Theme 声明的 ClarityServerConfig 为准，避免与消费者无关的推断形状冲突。
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

		// ---- 构建信息（供 BlogTech 等 Widget 使用） ----
		const consumerPkg = await loadJson(resolve(rootDir, 'package.json'), jiti)
		const themePkg = await loadJson(resolve(themePkgDir, 'package.json'), jiti)
		nuxt.options.runtimeConfig.public.clarity = {
			theme: 'Clarity',
			themeVersion: String(themePkg?.version ?? ''),
			themeHomepage: String(themePkg?.homepage ?? ''),
			siteVersion: String(consumerPkg?.version ?? ''),
			sitePackageManager: String(consumerPkg?.packageManager ?? ''),
			nuxtVersion: nuxtPkg.version,
			vueVersion: vuePkg.version,
		}

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

		// ---- 可选功能：anti-mirror ----
		// 黑名单完全由站点配置提供；Theme 不携带任何上游默认域名（审计发现 #5）。
		if (features.antiMirror !== false) {
			const blacklist = typeof features.antiMirror === 'boolean' ? [] : features.antiMirror.blacklist
			if (blacklist.length === 0) {
				logger.warn('features.antiMirror 已启用，但未配置 blacklist，已跳过反镜像脚本注入。')
			}
			else {
				await injectAntiMirror(nuxt, blacklist, site.url)
			}
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

function parseClarityConfig(raw: unknown, configPath: string): ClarityConfig {
	const result = clarityConfigSchema.safeParse(raw)
	if (!result.success) {
		const issues = result.error.issues
			.map(issue => `  - ${issue.path.join('.') || '(根对象)'}: ${issue.message}`)
			.join('\n')
		throw new Error(`[clarity-config] ${configPath} 校验失败：\n${issues}`)
	}
	return result.data
}

/** 消费项目 app/app.config.ts 若覆盖站点级字段，会在 defu 合并中压过 clarity.config.ts 注入，需要提示迁移 */
async function warnNonUiAppConfigOverrides(nuxt: Nuxt, jiti: ReturnType<typeof createJiti>, logger: ReturnType<typeof useLogger>) {
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
			const clarity = ((mod as { default?: unknown })?.default ?? mod) as { clarity?: Record<string, unknown> } | undefined
			if (!clarity?.clarity || typeof clarity.clarity !== 'object') {
				continue
			}
			const offenders = Object.keys(clarity.clarity).filter(key => !uiConfigKeys.has(key))
			if (offenders.length) {
				logger.warn(
					`app/app.config.ts 的 clarity 中出现站点级字段 [${offenders.join(', ')}]，`
					+ '它们会覆盖 clarity.config.ts 的注入结果；请将站点配置迁移到 clarity.config.ts。',
				)
			}
		}
		catch {
			// 尽力而为的边界提示：app.config 加载失败时交给 Nuxt 自身报错
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
}

async function injectAntiMirror(nuxt: Nuxt, blacklist: string[], target: string) {
	const source = `(${handleMirror.toString()})(${JSON.stringify(blacklist.map(btoa))},${JSON.stringify(btoa(target))})`
	const { code, errors } = await minify('clarity-anti-mirror.iife.js', source)
	if (errors.length > 0) {
		throw new Error(`[clarity-config] anti-mirror 脚本压缩失败：\n${errors.map(error => error.message ?? String(error)).join('\n')}`)
	}
	;(nuxt.options.app.head.script ??= []).push({ innerHTML: code })
}

function findConfigFile(rootDir: string) {
	for (const name of ['clarity.config.ts', 'clarity.config.mjs', 'clarity.config.js']) {
		if (existsSync(resolve(rootDir, name))) {
			return name
		}
	}
	return 'clarity.config.ts'
}

function findFeedsFile(rootDir: string, themeSrcDir: string) {
	for (const name of ['feeds.ts', 'feeds.mjs', 'feeds.js']) {
		if (existsSync(resolve(rootDir, name))) {
			return { found: true, resolved: resolve(rootDir, name) }
		}
	}
	return { found: false, resolved: resolve(themeSrcDir, 'config/feeds.empty.ts') }
}

async function loadJson(path: string, jiti: ReturnType<typeof createJiti>) {
	try {
		return ((await jiti.import(path)) as { default?: Record<string, unknown> } | undefined)?.default
	}
	catch {
		return undefined
	}
}
