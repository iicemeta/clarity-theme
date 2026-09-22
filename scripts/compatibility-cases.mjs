/**
 * Content Rendering Regression Test 用例定义
 *
 * 由 scripts/test-compatibility.mjs 执行，断言分为三层：
 * - ssrCases：生产构建 SSR HTML / 状态码 / payload 结构
 * - browserCases：真实浏览器中的客户端渲染结果（Shiki / Mermaid / abcjs）
 * - hydrationRoutes：dev 模式下检查 Vue hydration 与组件解析告警
 */

/** 正文区域（排除布局噪音） */
export function articleScope(html) {
	const start = html.indexOf('<article')
	const end = html.indexOf('<div class="post-footer"', start)
	return start >= 0 && end > start ? html.slice(start, end) : ''
}

/** 首页文章列表区域（排除内联 payload 与布局噪音） */
export function postListScope(html) {
	const start = html.indexOf('<div class="post-list"')
	const end = html.indexOf('<footer class="blog-footer"', start)
	return start >= 0 && end > start ? html.slice(start, end) : ''
}

const compat = path => `/compatibility/${path}`

/** A / B / C / D / E 维度的 SSR 断言 */
export const ssrCases = [
	{
		id: 'A-markdown',
		group: 'Markdown',
		route: compat('markdown'),
		status: 200,
		scope: articleScope,
		includes: [
			'id="标题一"',
			'id="标题二"',
			'id="标题三"',
			'id="标题四"',
			'普通段落文本，包含',
			'<del>删除线</del>',
			'href="/hello-clarity"',
			'href="https://nuxt.com"',
			'href="https://content.nuxt.com"',
			'引用块第一层',
			'引用块第二层',
			'无序列表项一',
			'嵌套列表项',
			'有序嵌套项',
			'有序列表项一',
			'class="contains-task-list"',
			'class="task-list-item"',
			'任务列表未完成',
			'任务列表已完成',
			'<table',
			'<thead>',
			'<tbody>',
			'<th align="left">',
			'<th align="center">',
			'<th align="right">',
			'id="user-content-fn-1"',
			'data-footnote-backref',
			'data-footnotes',
			'脚注内容。',
			'<kbd',
			'data-consumer-override="badge"',
		],
		patterns: [
			[/<code[^>]*>行内代码</, 'inline code'],
			[/<strong>[^<]*粗体/, 'strong emphasis'],
			[/<em>[^<]*斜体/, 'em emphasis'],
			[/<blockquote>[\s\S]*<blockquote>/, 'nested blockquote'],
			[/<ol>[\s\S]*有序列表项一[\s\S]*有序列表项三/, 'ordered list'],
			[/<input[^>]*checked[^>]*type="checkbox"/, 'checked task item'],
		],
		excludes: [':badge', ':key', '::card-list'],
	},
	{
		id: 'B-code',
		group: 'Code',
		route: compat('code'),
		status: 200,
		scope: articleScope,
		includes: [
			'配置文件',
			'clarity.config.ts',
			'content.config.ts',
			'class="z-codeblock"',
			'class="language-ts shiki scrollcheck-x"',
			'class="language-diff shiki scrollcheck-x"',
			'class="filename"',
			'interface Article',
			'meta-demo.ts',
			'i-tabler:star',
			'--tab-size:2;',
			'highlightedByMeta',
			'const nested = {',
			'return [1,',
		],
		patterns: [
			[/<code class=""[^>]*>hello</, 'plain inline code'],
			[/<code class=""[^>]*>clarity\.config\.ts</, 'inline code with dot filename'],
			[/<code class="language-ts"[^>]*>const x = 1</, 'inline code lang metadata'],
			[/<code class="language-sh"[^>]*>pnpm install</, 'inline code sh metadata'],
			[/<pre class="language-ts wrap shiki scrollcheck-x"/, 'meta wrap flag'],
			[/\n {4}const nested = \{/, 'tab expanded to 4-column indent'],
			[/\n {8}deep: /, 'nested tab indent preserved'],
			[/return \[1,\s+2,\s+3\]/, 'in-line tab expanded'],
			[/<span class="language"[^>]*>ts</, 'fenced language label'],
			[/<span class="language"[^>]*>diff</, 'diff language label'],
			[/- const removed = &#39;old&#39;/, 'diff removed line'],
			[/\+ const added = &#39;new&#39;/, 'diff added line'],
		],
		payload: {
			route: `${compat('code')}/_payload.json`,
			includes: ['"highlights"', 'meta-info-demo', 'meta-demo.ts', 'icon=tabler:star'],
		},
	},
	{
		id: 'C-mdc',
		group: 'MDC',
		route: compat('mdc'),
		status: 200,
		scope: articleScope,
		includes: [
			'class="alert card"',
			'信息提示',
			'info 类型的提示内容。',
			'i-tabler:alert-triangle',
			'warning 类型的提示内容。',
			'--c-primary:#F80;',
			'class="tip"',
			'提示内容',
			'i-tabler:info-circle tip-icon',
			'class="copy"',
			'安装命令',
			'contenteditable="plaintext-only"',
			'aria-label="复制"',
			'pnpm add -D clarity-theme',
			'class="card-list"',
			'特性一',
			'特性二',
			'<details',
			'点击展开',
			'折叠内容。',
		],
		patterns: [
			[/<summary[^>]*>点击展开<\/summary>/, 'folding summary'],
			[/data-consumer-override="badge"[\s\S]*data-consumer-override="badge"/, 'two consumer badges'],
			[/class="badge-text"[^>]*>\s*Nuxt/, 'badge slot text'],
			[/class="badge-text"[^>]*>\s*GitHub/, 'second badge slot text'],
		],
		excludes: [':tip', ':badge', '::alert', '::copy', '::card-list', ':::folding'],
	},
	{
		id: 'D-math',
		group: 'Special',
		route: compat('math'),
		status: 200,
		scope: articleScope,
		includes: [
			'class="katex"',
			'class="katex-display"',
			'class="katex-html"',
			'application/x-tex',
		],
		patterns: [
			[/class="katex"[\s\S]*class="katex"[\s\S]*class="katex"[\s\S]*class="katex"/, '4 katex formulas'],
		],
		excludes: ['katex-error'],
	},
	{
		id: 'D-mermaid',
		group: 'Special',
		route: compat('mermaid'),
		status: 200,
		scope: articleScope,
		includes: ['class="mermaid-diagram"'],
		patterns: [
			[/class="mermaid-diagram"[\s\S]*class="mermaid-diagram"/, 'two mermaid containers'],
		],
		excludes: ['mermaid-error', 'sequenceDiagram'],
	},
	{
		id: 'D-music',
		group: 'Special',
		route: compat('music'),
		status: 200,
		scope: articleScope,
		includes: ['class="music-score"'],
		excludes: ['music-abc'],
	},
	{
		id: 'D-image',
		group: 'Special',
		route: compat('image'),
		status: 200,
		scope: articleScope,
		includes: [
			'alt="占位图片"',
			'title="标题属性"',
			'src="https://placehold.co/600x300/41b883/ffffff/png"',
			'<figure class="image"',
			'Pic 组件图注',
			'<figcaption',
			'cursor:zoom-in',
		],
		patterns: [
			[/srcset="https:\/\/placehold\.co\/600x300\/41b883\/ffffff\/png 1x/, 'nuxt image srcset'],
		],
	},
	{
		id: 'E-normal-article',
		group: 'Routing',
		route: '/hello-clarity',
		status: 200,
		includes: ['你好，Clarity Theme', 'id="支持的-markdown-能力"', '示例文章'],
		excludes: ['内容为空或页面不存在'],
	},
	{
		id: 'E-permalink',
		group: 'Routing',
		route: '/compatibility/routing/permalink-route',
		status: 200,
		scope: articleScope,
		includes: ['Permalink 路由', 'COMPAT-PERMALINK-RENDERED'],
	},
	{
		id: 'E-permalink-source-hidden',
		group: 'Routing',
		route: '/compatibility/routing/permalink',
		status: 404,
		includes: ['内容为空或页面不存在'],
	},
	{
		id: 'E-hidden-posts-prefix',
		group: 'Routing',
		route: '/posts/hello-clarity',
		status: 404,
		includes: ['内容为空或页面不存在'],
	},
	{
		id: 'E-missing-page',
		group: 'Routing',
		route: '/compatibility/routing/missing',
		status: 404,
		includes: ['内容为空或页面不存在'],
	},
	{
		id: 'F-site-shell',
		group: 'Site',
		route: '/',
		status: 200,
		includes: [
			'Clarity Playground',
			'class="search-btn sidebar-nav-item gradient-card"',
			'class="theme-toggle"',
			'aria-label="深色模式"',
			'aria-label="第1页，共2页"',
		],
		// playground 的 features.antiMirror 为 false：默认不得注入任何反镜像脚本
		excludes: ['bWlycm9y', 'antiMirror'],
	},
	{
		id: 'F-toc',
		group: 'Site',
		route: '/hello-clarity',
		status: 200,
		includes: [
			'文章目录',
			'class="toc"',
			'href="#支持的-markdown-能力"',
		],
	},
	{
		id: 'F-archive',
		group: 'Site',
		route: '/archive',
		status: 200,
		includes: [
			'class="archive-group"',
			'class="archive-year"',
			'>2026</h2>',
			'class="article-item"',
			'Layer 化说明',
		],
	},
	{
		id: 'F-pagination',
		group: 'Site',
		route: '/?page=2',
		status: 200,
		scope: postListScope,
		includes: [
			'aria-label="第2页，共2页"',
			'你好，Clarity Theme',
			'class="active pagination-num"',
		],
		excludes: ['Layer 化说明'],
	},
	{
		id: 'F-seo-home',
		group: 'Site',
		route: '/',
		status: 200,
		includes: [
			'rel="canonical" href="https://clarity-theme.example.com/"',
			'property="og:site_name" content="Clarity Playground"',
			'Clarity Theme 的最小可运行示例',
			'"@type":"WebSite"',
		],
	},
	{
		id: 'F-seo-article',
		group: 'Site',
		route: '/hello-clarity',
		status: 200,
		includes: [
			'<link rel="canonical" href="https://clarity-theme.example.com/hello-clarity">',
			'property="og:site_name" content="Clarity Playground"',
			'property="og:description"',
			'使用 Clarity Layer 渲染的第一篇示例文章。',
			'name="author"',
		],
	},
	{
		id: 'F-robots',
		group: 'Site',
		route: '/robots.txt',
		status: 200,
		includes: [
			'User-agent: *',
			'Sitemap: https://clarity-theme.example.com/sitemap.xml',
		],
	},
	{
		id: 'F-sitemap',
		group: 'Site',
		route: '/sitemap.xml',
		status: 200,
		includes: [
			'<loc>https://clarity-theme.example.com/</loc>',
			'<loc>https://clarity-theme.example.com/hello-clarity</loc>',
			'<loc>https://clarity-theme.example.com/archive</loc>',
		],
	},
	{
		id: 'F-llms',
		group: 'Site',
		route: '/llms.txt',
		status: 200,
		includes: [
			'# Clarity Playground',
			'## Content',
			'https://clarity-theme.example.com/raw/hello-clarity.md',
		],
	},
	{
		id: 'F-atom',
		group: 'Site',
		route: '/atom.xml',
		status: 200,
		includes: [
			'<?xml-stylesheet type="text/xsl" href="/assets/atom.xsl"?>',
			'<id>https://clarity-theme.example.com/</id>',
			'<title>Clarity Playground</title>',
			'<link href="https://clarity-theme.example.com/hello-clarity"',
		],
	},
	{
		id: 'F-opml',
		group: 'Site',
		route: '/subscriptions.opml',
		status: 200,
		includes: [
			'<opml version="2.0">',
			'Clarity Playground的友链订阅',
			'https://clarity-theme.example.com/atom.xml',
		],
	},
	{
		id: 'F-stats',
		group: 'Site',
		route: '/api/stats',
		status: 200,
		includes: [
			'"total":{"posts":2',
			'"categories":[{"name":"技术","posts":2}]',
			'"tags":["clarity","nuxt","layer"]',
		],
	},
]

/** 需要真实浏览器确认的客户端渲染结果 */
export const browserCases = [
	{
		id: 'A-markdown-client',
		group: 'Markdown',
		route: compat('markdown'),
		waitFor: 'article.article .contains-task-list input',
		evals: [
			['task list inputs rendered', 'document.querySelectorAll(\'article.article .task-list-item input\').length === 2'],
			['no unresolved inline component', 'document.querySelector(\'article.article\').innerText.includes(\':badge\') === false'],
		],
	},
	{
		id: 'B-code-client',
		group: 'Code',
		route: compat('code'),
		waitFor: 'pre.shiki .line',
		evals: [
			['shiki lines rendered', 'document.querySelectorAll(\'pre.shiki .line\').length >= 15'],
			['highlight notation applied', 'document.querySelectorAll(\'pre.shiki .line.highlighted\').length >= 2'],
			['meta wrap class kept', 'document.querySelector(\'figure.z-codeblock pre.wrap\') !== null'],
			['diff lines tokenized', 'document.querySelectorAll(\'pre.language-diff .line\').length >= 2'],
			['tab size from meta', 'getComputedStyle(document.querySelector(\'figure.z-codeblock[style*="--tab-size:2;"]\')).tabSize === \'2\''],
		],
	},
	{
		id: 'C-mdc-client',
		group: 'MDC',
		route: compat('mdc'),
		waitFor: 'article.article .tip',
		evals: [
			['tip component hydrated', 'document.querySelectorAll(\'article.article .tip\').length === 1'],
			['consumer badges hydrated', 'document.querySelectorAll(\'article.article [data-consumer-override="badge"]\').length === 2'],
			['folding details interactive', 'document.querySelector(\'article.article details:not([open])\') !== null'],
			['copy code rendered', 'document.querySelector(\'article.article code.copy .code\')?.textContent?.includes(\'pnpm add -D clarity-theme\') === true'],
		],
	},
	{
		id: 'D-math-client',
		group: 'Special',
		route: compat('math'),
		waitFor: 'article.article .katex',
		evals: [
			['katex rendered on client', 'document.querySelectorAll(\'article.article .katex\').length === 4'],
			['no katex parse error', 'document.querySelectorAll(\'article.article .katex-error\').length === 0'],
		],
	},
	{
		id: 'D-mermaid-client',
		group: 'Special',
		route: compat('mermaid'),
		waitFor: '.mermaid-diagram svg',
		timeout: 20000,
		prepare: 'document.querySelectorAll(".mermaid-diagram").forEach(el => el.scrollIntoView({ block: "center" }))',
		evals: [
			['both diagrams rendered', 'document.querySelectorAll(\'.mermaid-diagram svg\').length === 2'],
			['no mermaid error fallback', 'document.querySelectorAll(\'.mermaid-error\').length === 0'],
		],
	},
	{
		id: 'D-music-client',
		group: 'Special',
		route: compat('music'),
		waitFor: '.music-score svg',
		timeout: 15000,
		allowConsole: [/^\[music-abc\]/, /SoundFonts/],
		evals: [
			['abcjs score rendered', 'document.querySelectorAll(\'.music-score svg\').length >= 1'],
			['abcjs staff rendered', 'document.querySelectorAll(\'.music-score path\').length > 0'],
		],
	},
	{
		id: 'D-image-client',
		group: 'Special',
		route: compat('image'),
		waitFor: 'article.article img',
		evals: [
			['two images present', 'document.querySelectorAll(\'article.article img\').length === 2'],
			['pic caption present', 'document.querySelector(\'article.article figcaption\')?.textContent?.trim() === \'Pic 组件图注\''],
		],
	},
	{
		id: 'E-normal-article-client',
		group: 'Routing',
		route: '/hello-clarity',
		waitFor: 'article.article',
		evals: [
			['article hydrated', 'document.querySelector(\'article.article h2\') !== null'],
		],
	},
	{
		id: 'E-permalink-client',
		group: 'Routing',
		route: '/compatibility/routing/permalink-route',
		waitFor: 'article.article',
		evals: [
			['permalink article hydrated', 'document.body.innerText.includes(\'COMPAT-PERMALINK-RENDERED\')'],
		],
	},
	{
		id: 'F-search-client',
		group: 'Site',
		route: '/',
		waitFor: '.blog-search .search-result .search-item',
		timeout: 15000,
		prepare: `(async () => {
			document.querySelector('.search-btn')?.click()
			await new Promise(resolve => setTimeout(resolve, 600))
			const input = document.querySelector('.search-input')
			if (!input) return
			input.value = 'clarity'
			input.dispatchEvent(new Event('input', { bubbles: true }))
		})()`,
		evals: [
			['search modal opened', 'document.querySelector(\'.blog-search .search-input\') !== null'],
			['search result contains article', 'document.querySelector(\'.search-result .search-item\')?.textContent?.includes(\'Clarity\') === true'],
			['search result links to article', 'document.querySelector(\'.search-result .search-item\')?.getAttribute(\'href\')?.includes(\'hello-clarity\') === true'],
		],
	},
	{
		id: 'F-theme-toggle-client',
		group: 'Site',
		route: '/',
		waitFor: '.theme-toggle button[aria-label="深色模式"]',
		prepare: `document.querySelector('.theme-toggle button[aria-label="深色模式"]')?.click()`,
		evals: [
			['dark preference applied to html', 'document.documentElement.classList.contains(\'dark\')'],
			['dark preference persisted', 'localStorage.getItem(\'nuxt-color-mode\') === \'dark\''],
			['active toggle follows preference', 'document.querySelector(\'.theme-toggle button[aria-label="深色模式"]\')?.classList.contains(\'active\') === true'],
		],
	},
	{
		id: 'F-pagination-client',
		group: 'Site',
		route: '/?page=2',
		waitFor: 'nav.pagination',
		evals: [
			['pagination hydrated on page 2', 'document.querySelector(\'nav.pagination\')?.getAttribute(\'aria-label\') === \'第2页，共2页\''],
			['page 2 shows second article', 'document.body.innerText.includes(\'你好，Clarity Theme\')'],
			['page 2 hides first article', 'document.body.innerText.includes(\'Layer 化说明\') === false'],
		],
	},
]

/** dev 模式（Vue 开发版告警可用）下需要检查 hydration 的路由 */
export const hydrationRoutes = [
	{ id: 'A-markdown', route: compat('markdown'), waitFor: 'article.article .contains-task-list input' },
	{ id: 'B-code', route: compat('code'), waitFor: 'pre.shiki .line' },
	{ id: 'C-mdc', route: compat('mdc'), waitFor: 'article.article .tip' },
	{ id: 'D-math', route: compat('math'), waitFor: 'article.article .katex' },
	{ id: 'D-mermaid', route: compat('mermaid'), waitFor: '.mermaid-diagram svg', timeout: 20000 },
	{ id: 'D-music', route: compat('music'), waitFor: '.music-score svg', timeout: 15000 },
	{ id: 'D-image', route: compat('image'), waitFor: 'article.article img' },
	{ id: 'E-normal', route: '/hello-clarity', waitFor: 'article.article' },
	{ id: 'E-permalink', route: '/compatibility/routing/permalink-route', waitFor: 'article.article' },
	{ id: 'F-home', route: '/', waitFor: 'nav.pagination', selector: 'nav.pagination' },
	{ id: 'F-archive', route: '/archive', waitFor: '.archive-group', selector: '.archive-group' },
]

/** 日志中的致命信号 → 测试维度 */
export const logFailureRules = [
	{ re: /Failed to resolve (component|import)|Could not find component|Unknown (component|element)/i, dimension: 'missing component' },
	// 注意：不能匹配任意 hydration/mismatch 字符串：
	// <UtilHydrateSafe> 的组件名与 Vue 序列化 vnode 中的 Symbol(HYDRATION_MISMATCH)
	// 都会出现在正常组件链里；只识别 Vue 实际输出的错误消息。
	{ re: /Hydration(?: [a-z]+)+ mismatch|hydrat(?:e|ion) (?:mismatch|error|failed)/, dimension: 'hydration' },
	{ re: /\b(TypeError|ReferenceError|SyntaxError|RangeError|URIError)\b|Cannot read propert|is not (a )?function|undefined is not an object/i, dimension: 'Nuxt / Vue runtime' },
	{ re: /\[nuxt\]?\s*\[content\]|content:file:|Failed to parse|parse error|invalid markdown|minimark (encode|decode)/i, dimension: 'Content parser' },
	{ re: /\[nitro\]\s*\[error\]|error during prerender/i, dimension: 'prerender / Nuxt runtime' },
]

/** 已知的非致命日志（消费者覆盖用同名组件 / link checker 对外链的探测噪音等） */
export const logAllowRules = [
	/NUXT_B3011[\s\S]*Badge\.vue/,
	/Should not respond with status code 404 \(Not Found\)\. \(no-error-response\)/,
	/Total errors: \d+|Total warnings: \d+/,
	/\[link-checker\]|link checker/i,
	/esm\.sh\/(shiki|engine-oniguruma)/,
	/DeprecationWarning|trace-deprecation/,
	/treating it as an external dependency/,
	/PLUGIN_TIMINGS|build\.chunkSizeWarningLimit|vite-reporter/,
	/"H3Error" and "H3Event"/,
]

/** 浏览器 console 中视为失败的模式 */
export const consoleFailureRules = [
	{ re: /hydration[^\n]*(mismatch|failed)|(node|children|text|attribute|class|style) mismatch|hydrat(e|ion) (mismatch|error|failed)/i, dimension: 'hydration' },
	{ re: /Failed to resolve component|Unknown (component|element|runtime directive)/i, dimension: 'missing component' },
	{ re: /Uncaught|TypeError|ReferenceError|SyntaxError/i, dimension: 'Nuxt / Vue runtime' },
	{ re: /\[nuxt\]?\s*\[content\]|Failed to parse|parse error/i, dimension: 'Content parser' },
]

/** 浏览器 console 中允许出现的已知噪音（外部资源可用性探测） */
export const consoleAllowRules = [
	/^\[music-abc\]/,
	/SoundFonts/,
	/net::ERR/,
	/Failed to load resource/,
]

/* ------------------------------------------------------------------ */
/* Release Compatibility Contract                                     */
/* ------------------------------------------------------------------ */

/**
 * 发布兼容性契约：docs/COMPATIBILITY.md 的唯一事实来源。
 *
 * - feature / input / expected / command / status 五列即文档表格
 * - coverage 中的 `compat:<id>` 会被 scripts/test-compatibility.mjs 校验，
 *   防止契约声明了不存在的自动化用例
 * - status:
 *   - automated：CI 中必须通过（playground 渲染回归 或 real consumer）
 *   - partial：仅覆盖契约子集（例如构建脚手架行为），文档中必须说明边界
 */
export const contractGroups = [
	{ id: 'public-api', title: '第一组 · Public API' },
	{ id: 'core', title: '第二组 · 核心功能' },
	{ id: 'config', title: '第三组 · 配置分支' },
]

/** 每组必须出现的 Feature（Release Matrix 的最低覆盖面，缺失即测试缺口） */
export const requiredContractFeatures = {
	'public-api': [
		'clarity-theme/config',
		'clarity-theme/content',
		'clarity-theme/schema',
		'clarity-theme/img',
	],
	'core': [
		'Markdown',
		'MDC',
		'Code',
		'Math',
		'Mermaid',
		'Music',
		'Image',
		'Search',
		'TOC',
		'Archive',
		'Pagination',
		'Theme toggle',
		'SEO',
		'robots',
		'sitemap',
		'llms',
		'atom',
		'opml',
		'stats',
		'permalink',
		'404',
	],
	'config': [
		'enableStyle=false',
		'hidePostPrefix=false',
		'stats=false',
		'atom=false',
		'opml=false',
		'antiMirror=false',
		'antiMirror=true + blacklist',
		'antiMirror navigation (runtime)',
		'stats.includePaths multi-pattern',
		'client config boundary',
		'Twikoo enabled',
		'Twikoo disabled',
		'custom app.config',
		'custom component override',
		'custom shiki config',
	],
}

export const compatibilityContract = [
	// ---- 第一组：Public API ----
	{
		group: 'public-api',
		feature: 'clarity-theme（Layer 根入口）',
		input: 'consumer nuxt.config.ts 中 extends: [\'clarity-theme\']',
		expected: 'Layer 配置、组件、模块与 server 路由全部进入 consumer 构建，nuxt generate 成功',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:generate-default', 'consumer:generate-branches'],
	},
	{
		group: 'public-api',
		feature: 'clarity-theme/config',
		input: 'import defineClarityConfig；import type FeedGroup / ClarityUiConfig 等',
		expected: 'Node ESM 可解析可调用（默认值填充）；类型经 nuxt typecheck 真实编译',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:exports-smoke', 'consumer:typecheck'],
	},
	{
		group: 'public-api',
		feature: 'clarity-theme/content',
		input: 'import createClarityContentConfig；import type ArticleSchema',
		expected: '工厂函数可导入；配合 consumer content.config.ts 真实生成内容集合与页面',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:exports-smoke', 'consumer:typecheck', 'consumer:generate-default'],
	},
	{
		group: 'public-api',
		feature: 'clarity-theme/schema',
		input: 'import clarityConfigSchema；import type ClarityConfig',
		expected: 'zod schema 可在纯 Node 中 parse 站点配置；类型与运行时校验一致',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:exports-smoke', 'consumer:typecheck'],
	},
	{
		group: 'public-api',
		feature: 'clarity-theme/img',
		input: 'import getImgUrl / OicqAvatarSize / getGithubIcon / getFavicon',
		expected: '纯 Node 中返回确定 URL；ImgService 类型约束非法图床名',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:exports-smoke', 'consumer:typecheck'],
	},

	// ---- 第二组：核心功能 ----
	{
		group: 'core',
		feature: 'Markdown',
		input: 'playground / consumer 的 Markdown 基准页',
		expected: '标题 / 列表 / 表格 / 脚注 / 任务列表 / 删除线等渲染为语义 HTML，无原始语法泄漏',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:A-markdown', 'compat:A-markdown-client', 'compat:A-markdown-hydration', 'consumer:generate-default'],
	},
	{
		group: 'core',
		feature: 'MDC',
		input: '::alert / :tip / ::card-list / :::folding / :badge',
		expected: 'MDC 组件渲染为 Theme 组件 HTML，消费者同名组件可覆盖',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:C-mdc', 'compat:C-mdc-client', 'compat:C-mdc-hydration', 'consumer:generate-default'],
	},
	{
		group: 'core',
		feature: 'Code',
		input: 'inline / fenced / meta（filename、icon、wrap、tab-size、highlight）代码基准',
		expected: 'Shiki 高亮、meta 信息与缩进展开正确，payload 携带 highlights 元数据',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:B-code', 'compat:B-code-client', 'compat:B-code-hydration', 'consumer:generate-default'],
	},
	{
		group: 'core',
		feature: 'Math',
		input: '行内 $...$ 与块级 $$...$$ 公式',
		expected: 'SSR 输出 KaTeX HTML，客户端无 katex-error',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:D-math', 'compat:D-math-client', 'compat:D-math-hydration', 'consumer:generate-default'],
	},
	{
		group: 'core',
		feature: 'Mermaid',
		input: 'fenced mermaid 代码块',
		expected: 'remark-code-component 转交 Mermaid 组件，客户端渲染 svg 且无错误回退',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:D-mermaid', 'compat:D-mermaid-client', 'compat:D-mermaid-hydration', 'consumer:generate-default'],
	},
	{
		group: 'core',
		feature: 'Music',
		input: 'fenced abc 乐谱代码块',
		expected: 'MusicScore (abcjs) 客户端渲染五线谱 svg',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:D-music', 'compat:D-music-client', 'compat:D-music-hydration'],
	},
	{
		group: 'core',
		feature: 'Image',
		input: 'Markdown 图片与 ::pic 组件',
		expected: 'NuxtImg 生成 srcset，Pic 渲染 figure / figcaption / zoom 光标',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:D-image', 'compat:D-image-client', 'compat:D-image-hydration', 'consumer:generate-default'],
	},
	{
		group: 'core',
		feature: 'Search',
		input: '首页侧栏搜索入口 + 输入 clarity',
		expected: 'MiniSearch 弹层打开并返回 hello-clarity 相关结果',
		command: 'pnpm test:compatibility',
		status: 'automated',
		coverage: ['compat:F-site-shell', 'compat:F-search-client'],
	},
	{
		group: 'core',
		feature: 'TOC',
		input: '带 H2/H3 的文章页',
		expected: '右侧栏渲染文章目录锚点',
		command: 'pnpm test:compatibility',
		status: 'automated',
		coverage: ['compat:F-toc'],
	},
	{
		group: 'core',
		feature: 'Archive',
		input: '/archive 路由 + posts 内容',
		expected: '按年分组渲染归档卡片与统计，hydration 无告警',
		command: 'pnpm test:compatibility',
		status: 'automated',
		coverage: ['compat:F-archive', 'compat:F-archive-hydration'],
	},
	{
		group: 'core',
		feature: 'Pagination',
		input: 'playground app.config 覆盖 pagination.perPage=1，访问 /?page=2',
		expected: '第 2 页仅含第二篇文章，分页导航与标题正确，hydration 无告警',
		command: 'pnpm test:compatibility',
		status: 'automated',
		coverage: ['compat:F-pagination', 'compat:F-pagination-client', 'compat:F-home-hydration'],
	},
	{
		group: 'core',
		feature: 'Theme toggle',
		input: '点击深色模式按钮',
		expected: 'html class 与 localStorage 偏好切换为 dark，active 态跟随',
		command: 'pnpm test:compatibility',
		status: 'automated',
		coverage: ['compat:F-site-shell', 'compat:F-theme-toggle-client'],
	},
	{
		group: 'core',
		feature: 'SEO',
		input: '站点与文章元数据（title / description / author）',
		expected: 'canonical、og:site_name、og:description、WebSite JSON-LD 正确输出',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:F-seo-home', 'compat:F-seo-article', 'consumer:generate-default'],
	},
	{
		group: 'core',
		feature: 'robots',
		input: 'clarity.config 的 site.url 与 article.robotsNotIndex',
		expected: 'robots.txt 输出 sitemap 声明与 Disallow 规则',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:F-robots', 'consumer:generate-default'],
	},
	{
		group: 'core',
		feature: 'sitemap',
		input: '全部内容路由（含 permalink）',
		expected: 'sitemap.xml 使用站点规范 URL 输出首页 / 归档 / 文章路由',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:F-sitemap', 'consumer:generate-default'],
	},
	{
		group: 'core',
		feature: 'llms',
		input: 'site.url / title / description 注入 nuxt-llms',
		expected: '/llms.txt 输出站点标题、描述与内容索引',
		command: 'pnpm test:compatibility',
		status: 'automated',
		coverage: ['compat:F-llms', 'consumer:generate-default'],
	},
	{
		group: 'core',
		feature: 'atom',
		input: 'feed.limit 与内容集合',
		expected: '/atom.xml 输出站点 id、自引用与文章链接',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:F-atom', 'consumer:generate-default', 'consumer:generate-branches'],
	},
	{
		group: 'core',
		feature: 'opml',
		input: 'feeds.ts 友链数据',
		expected: '/subscriptions.opml 输出站点自身与友链订阅',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:F-opml', 'consumer:generate-default'],
	},
	{
		group: 'core',
		feature: 'stats',
		input: 'stats.includePaths = posts/%（或多模式并集）',
		expected: '/api/stats 输出文章数、字数、分类与标签统计；多个 includePaths 取并集',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:F-stats', 'consumer:generate-default', 'consumer:generate-branches'],
	},
	{
		group: 'core',
		feature: 'permalink',
		input: 'frontmatter permalink 覆盖文件路由',
		expected: '自定义路由可访问并生成，原文件路由 404',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:E-permalink', 'compat:E-permalink-source-hidden', 'compat:E-permalink-client', 'consumer:generate-default'],
	},
	{
		group: 'core',
		feature: '404',
		input: '不存在的路由',
		expected: '返回 404 状态码与 Theme 404 页面',
		command: 'pnpm test:compatibility',
		status: 'automated',
		coverage: ['compat:E-missing-page', 'compat:E-hidden-posts-prefix'],
	},

	// ---- 第三组：配置分支 ----
	{
		group: 'config',
		feature: 'enableStyle=false',
		input: 'consumer 分支配置 feed.enableStyle=false',
		expected: 'atom.xml 仍生成，但不含 XSLT 样式声明',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:generate-branches'],
	},
	{
		group: 'config',
		feature: 'hidePostPrefix=false',
		input: 'consumer 分支配置 article.hidePostPrefix=false',
		expected: '文章路由保留 /posts 前缀，无前缀路由不再生成',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:generate-branches'],
	},
	{
		group: 'config',
		feature: 'stats=false',
		input: 'consumer 分支配置 features.stats=false',
		expected: 'routeRules 关闭预渲染（产物无 api/stats），dev/SSR 运行时返回 404',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:generate-features-off'],
	},
	{
		group: 'config',
		feature: 'atom=false',
		input: 'consumer 分支配置 features.atom=false',
		expected: 'routeRules 关闭预渲染（产物无 atom.xml），head 无 alternate 声明，dev/SSR 运行时返回 404',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:generate-features-off'],
	},
	{
		group: 'config',
		feature: 'opml=false',
		input: 'consumer 分支配置 features.opml=false',
		expected: 'routeRules 关闭预渲染，generate 产物中无 subscriptions.opml，dev/SSR 运行时返回 404',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:generate-features-off'],
	},
	{
		group: 'config',
		feature: 'antiMirror=false',
		input: '默认配置（playground 与 consumer 默认变体）',
		expected: '不注入任何反镜像脚本与黑名单数据',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:F-site-shell', 'consumer:generate-default'],
	},
	{
		group: 'config',
		feature: 'antiMirror=true + blacklist',
		input: 'features.antiMirror={ blacklist: [\'mirror.example.com\'] }',
		expected: '页面内联反镜像脚本，黑名单与站点 URL 以 base64 注入',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:generate-branches'],
	},
	{
		group: 'config',
		feature: 'antiMirror navigation (runtime)',
		input: 'dev 服务经镜像主机（127.0.0.1，黑名单命中）访问，site.url 指向 localhost 同端口',
		expected: '注入脚本在真实浏览器中把页面导航回规范主机，canonical 链接同步指向规范主机',
		command: 'pnpm test:compatibility',
		status: 'automated',
		coverage: ['compat:anti-mirror-navigation'],
	},
	{
		group: 'config',
		feature: 'stats.includePaths multi-pattern',
		input: 'consumer 分支配置 stats.includePaths = [\'posts/%\', \'notes/%\']',
		expected: '统计取两类内容的并集（posts 与 notes 都计入），非匹配页面仍排除',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:generate-branches'],
	},
	{
		group: 'config',
		feature: 'client config boundary',
		input: 'site.author.email / feed.* / 完整 stats.includePaths / 构建期 article 字段',
		expected: '以上字段不进入客户端 bundle；Atom 等服务端输出仍使用完整配置（email 保留在服务端）',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:generate-default'],
	},
	{
		group: 'config',
		feature: 'Twikoo enabled',
		input: 'integrations.twikoo={ envId: \'https://twikoo.consumer.example\' }',
		expected: 'head 输出 preconnect，文章页渲染 #twikoo 容器',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:generate-branches'],
	},
	{
		group: 'config',
		feature: 'Twikoo disabled',
		input: '未配置 integrations.twikoo',
		expected: '文章页显示“本文暂未开启评论”，不渲染 #twikoo 容器',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:generate-default'],
	},
	{
		group: 'config',
		feature: 'custom app.config',
		input: 'consumer app/app.config.ts 覆盖 header.emojiTail；playground 覆盖 pagination.perPage',
		expected: 'UI 默认值被消费者覆盖并出现在渲染结果中',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:F-pagination', 'consumer:generate-default'],
	},
	{
		group: 'config',
		feature: 'custom component override',
		input: 'consumer 提供 app/components/content/Badge.vue',
		expected: 'MDC :badge 使用消费者组件（输出 data-consumer-override 标记）',
		command: 'pnpm test:compatibility && pnpm test:consumer',
		status: 'automated',
		coverage: ['compat:C-mdc', 'consumer:generate-default'],
	},
	{
		group: 'config',
		feature: 'custom shiki config',
		input: 'consumer app/shiki.config.ts 覆盖 light / dark 主题',
		expected: '构建产物加载自定义主题名，Theme 默认主题不再出现',
		command: 'pnpm test:consumer',
		status: 'automated',
		coverage: ['consumer:generate-default'],
	},
]
