import type { Nuxt } from '@nuxt/schema'
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
import handleMirror from './anti-mirror-client'

const moduleDir = dirname(fileURLToPath(import.meta.url))
const themeDir = resolve(moduleDir, '../..')

/** 默认镜像站域名黑名单（可被站点配置扩展） */
const defaultMirrorBlacklist = [
	'dgjlx.com',
	'dgvhqt.com',
	'hcmsla.com',
	'wmlop.com',
	'yswjxs.com',
]

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
		const feedsPath = findFeedsFile(rootDir, themeDir)

		// ---- 依赖注入层：Theme 内部不感知消费项目的文件布局 ----
		Object.assign(nuxt.options.alias, {
			'#clarity/config': configPath,
			'#clarity/feeds': feedsPath.resolved,
		})

		// @pinia/nuxt 不会自动扫描 Layer 的 stores 目录，需显式注册
		addImportsDir(resolve(themeDir, 'app/stores'))

		// ---- AppConfig 类型化：消费者 defineAppConfig({ clarity: ... }) 获得完整类型提示 ----
		const appConfigTypePath = relative(nuxt.options.buildDir, resolve(themeDir, 'config/app.ts')).replaceAll('\\', '/')
		addTypeTemplate({
			filename: 'types/clarity-app-config.d.ts',
			getContents: () => [
				`import type { ClarityAppConfig } from '${appConfigTypePath}'`,
				'',
				'declare module \'@nuxt/schema\' {',
				'  interface CustomAppConfig {',
				'    clarity: ClarityAppConfig',
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
				'~/shiki.config': resolve(themeDir, 'app/shiki.config.ts'),
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

		// ---- 读取并校验站点配置 ----
		const jiti = createJiti(import.meta.url, { moduleCache: false, interopDefault: true })
		const configModule = await jiti.import(configPath) as unknown
		const config = clarityConfigSchema.parse((configModule as { default?: unknown })?.default ?? configModule)
		const { site, article, integrations, features } = config

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
		const themePkg = await loadJson(resolve(themeDir, 'package.json'), jiti)
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
		if (features.antiMirror !== false) {
			const blacklist = typeof features.antiMirror === 'boolean' ? [] : features.antiMirror.blacklist
			injectAntiMirror(nuxt, [...defaultMirrorBlacklist, ...blacklist], site.url)
		}
	},
})

function injectAntiMirror(nuxt: Nuxt, blacklist: string[], target: string) {
	const iife = minify('', `(${handleMirror.toString()})(${JSON.stringify(blacklist.map(btoa))},${JSON.stringify(btoa(target))})`)
	const code = (iife as unknown as { code: string }).code
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

function findFeedsFile(rootDir: string, themeDir: string) {
	for (const name of ['feeds.ts', 'feeds.mjs', 'feeds.js']) {
		if (existsSync(resolve(rootDir, name))) {
			return { found: true, resolved: resolve(rootDir, name) }
		}
	}
	return { found: false, resolved: resolve(themeDir, 'config/feeds.empty.ts') }
}

async function loadJson(path: string, jiti: ReturnType<typeof createJiti>) {
	try {
		return ((await jiti.import(path)) as { default?: Record<string, unknown> } | undefined)?.default
	}
	catch {
		return undefined
	}
}
