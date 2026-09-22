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
