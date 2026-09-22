import { dirname, join } from 'node:path'
import { arch, env, version as nodeVersion, platform } from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { name as ciName, CLOUDFLARE_PAGES, GITHUB_ACTIONS, NETLIFY } from 'ci-info'
import { Temporal } from 'temporal-polyfill'
import { homepage, name as themeName, version as themeVersion } from './package.json'

/** Theme 根目录（Layer 本地路径基准，兼容 npm 包 / git 包 / 本地目录安装） */
const themeDir = dirname(fileURLToPath(import.meta.url))
const toThemePath = (path: string) => join(themeDir, path).replaceAll('\\', '/')

function pluginPath(path: string) {
	// 插件必须是 .mjs：@nuxt/content 以 Node 原生方式加载，
	// 不允许 node_modules 内的 TS 文件（TS 剥离限制）
	return pathToFileURL(join(themeDir, 'remark-plugins', `${path}.mjs`)).href
}

/**
 * Clarity Theme Layer 配置
 *
 * 站点数据（SEO、favicon、scripts 等）由 modules/clarity-config
 * 读取消费项目的 clarity.config.ts 后统一注入，此处仅包含 Theme 自身能力。
 */
export default defineNuxtConfig({
	app: {
		head: {
			meta: [
				{ name: 'color-scheme', content: 'light dark' },
				{ 'name': 'generator', 'content': `Clarity Theme ${themeVersion}`, 'data-github-repo': homepage },
				{ name: 'mobile-web-app-capable', content: 'yes' },
			],
			link: [
				{ rel: 'stylesheet', href: 'https://s4.zstatic.net/npm/katex@0.16.44/dist/katex.min.css' },
				// "InterVariable", "Inter"
				{ rel: 'stylesheet', href: 'https://s4.zstatic.net/npm/inter-ui@4.1.1/inter-variable.css' },
				{ rel: 'stylesheet', href: 'https://s4.zstatic.net/npm/inter-ui@4.1.1/inter.css' },
				// "JetBrains Mono", 思源宋体 "Noto Serif SC"
				{ rel: 'preconnect', href: 'https://fonts.gstatic.cn', crossorigin: '' },
				{ rel: 'stylesheet', href: 'https://fonts.googleapis.cn/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Noto+Serif+SC:wght@200..900&display=swap' },
			],
			templateParams: {
				separator: '|',
			},
		},
		rootAttrs: {
			id: 'blog-root',
		},
	},

	compatibilityDate: '2024-08-03',

	components: [
		{ path: toThemePath('app/components/partial'), prefix: 'Z' },
		toThemePath('app/components'),
	],

	// @keep-sorted
	css: [
		toThemePath('app/assets/css/animation.scss'),
		toThemePath('app/assets/css/article.scss'),
		toThemePath('app/assets/css/color.scss'),
		toThemePath('app/assets/css/font.scss'),
		toThemePath('app/assets/css/main.scss'),
		toThemePath('app/assets/css/reusable.scss'),
	],

	// @keep-sorted
	experimental: {
		extractAsyncDataHandlers: true,
		typescriptPlugin: true,
	},

	// @keep-sorted
	modules: [
		'@bikariya/image-viewer',
		'@bikariya/modals',
		'@bikariya/shiki',
		'@nuxt/content',
		'@nuxt/icon',
		'@nuxt/image',
		'@nuxtjs/color-mode',
		'@nuxtjs/seo',
		'@pinia/nuxt',
		'@vueuse/nuxt',
		// Layer 配置中的相对 module 路径会以消费项目为基准解析，必须使用绝对路径；
		// 且 clarity-config 必须先于 nuxt-llms 运行：后者在 setup 时读取注入的 llms 站点配置
		toThemePath('modules/clarity-config'),
		'nuxt-llms',
	],

	nitro: {
		prerender: {
			// 修复部分平台会在文章路径后添加 `/`，导致闪现 404 错误
			// https://github.com/nuxt/content/issues/2378
			autoSubfolderIndex: CLOUDFLARE_PAGES || GITHUB_ACTIONS || NETLIFY ? false : undefined,
		},
	},

	runtimeConfig: {
		// @keep-sorted
		public: {
			arch,
			buildTime: Temporal.Now.zonedDateTimeISO().toString(),
			// EdgeOne 检测暂时不可用
			ci: env.TENCENTCLOUD_RUNENV === 'SCF' ? 'EdgeOne' : ciName || '',
			nodeVersion,
			platform,
		},
	},

	typescript: {
		nodeTsConfig: {
			// @keep-sorted
			include: [
				'../config/**/*.ts',
				'../remark-plugins/**/*.ts',
			],
		},
	},

	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: `@use "${toThemePath('app/assets/css/_variable.scss')}" as *;`,
				},
			},
		},
		// @keep-sorted
		optimizeDeps: {
			include: ['@shikijs/colorized-brackets', '@shikijs/transformers', '@unhead/schema-org/vue', '@vue/devtools-core', '@vue/devtools-kit', 'embla-carousel-autoplay', 'embla-carousel-vue', 'embla-carousel-wheel-gestures', 'es-toolkit/array', 'es-toolkit/math', 'es-toolkit/object', 'es-toolkit/promise', 'es-toolkit/string', 'minisearch', 'parse-domain', 'plain-shiki', 'shiki/themes/catppuccin-latte.mjs', 'shiki/themes/one-dark-pro.mjs', 'temporal-polyfill', 'vue-tippy'],
		},
		server: {
			allowedHosts: true,
		},
	},

	colorMode: {
		preference: 'system',
		fallback: 'light',
		classSuffix: '',
	},

	content: {
		build: {
			markdown: {
				highlight: false,
				// @keep-sorted
				remarkPlugins: {
					[pluginPath('remark-code-component')]: {
						options: {
							'mermaid': { component: 'mermaid', prop: 'code' },
							'music-abc': { component: 'music-score', prop: 'abc' },
						},
					},
					'remark-math': {},
					'remark-reading-time': {},
				},
				// @keep-sorted
				rehypePlugins: {
					[pluginPath('rehype-meta-slots')]: {},
					'rehype-katex': {},
				},
				toc: { depth: 4, searchDepth: 4 },
			},
		},
		experimental: {
			sqliteConnector: 'native',
		},
	},

	dxup: {
		features: {
			// 页面通过 <template #aside> 向布局具名插槽传参
			namedLayoutSlots: true,
		},
	},

	hooks: {
		ready: () => {
			console.info(`
================================
${themeName} ${themeVersion}
${homepage}
================================
`)
		},
	},

	icon: {
		customCollections: [
			{ prefix: 'clarity', dir: toThemePath('app/assets/icons') },
		],
		clientBundle: {
			scan: {
				globInclude: ['**\/*.{vue,jsx,tsx,ts,md,mdc,mdx}'],
			},
		},
	},

	image: {
		densities: [1, 1.5, 2],
		format: ['avif', 'webp'],
		// Netlify 下 netlify 处理器无法显示站外图片，ipx 处理器无法显示站内图片，需彻底禁用
		// https://github.com/nuxt/image/issues/1353
		provider: NETLIFY ? 'none' : undefined,
	},

	linkChecker: {
		// @keep-sorted
		skipInspections: [
			'no-baseless',
			'no-non-ascii-chars',
			'no-uppercase-chars',
		],
	},

	ogImage: {
		enabled: false,
	},

	robots: {
		disableNuxtContentIntegration: true,
	},
})
