# 将 blog-v3 迁移到 Clarity Theme

[English](./MIGRATION.md) | **简体中文**

本指南将现有的 Nuxt 4 `blog-v3` 项目迁移到 Clarity Theme Layer，同时保留文章、frontmatter、公共资源、重定向、补丁、自定义组件、自定义模块与服务端能力。它面向已测试的抽取基线编写；当前发布矩阵见[兼容性说明](./COMPATIBILITY.zh-CN.md)。

## 1. 范围

| 项目 | 支持基线 |
| --- | --- |
| 源项目 | `blog-v3` 3.7.2 |
| 已测试源 commit | `f6ea97d745517feb52f0c100e89acb36f0adc12f` |
| Nuxt 源/运行时 | 4.5.2 / Clarity peer `^4.5.2` |
| Node | `^22.19 \|\| ^24.11 \|\| >=26` |
| 包管理器 | pnpm 10+；Clarity 开发本身使用 pnpm 12.4.1 |

下文的字段与文件映射针对该基线维护。临近的 3.7.x 源仍可能迁移，但每一处无法识别的本地变更都必须审查，而不是盲目覆盖。更新的上游版本需要 diff 审查，也可能需要等待 Clarity 同步。

迁移不要求把 `content/` 移入主题、转换 frontmatter 或删除旧项目。Clarity 是一个 Layer；你的仓库仍然是站点与数据的所有者。

## 2. 迁移之前

### 2.1 核对工具与版本

```bash
node -v
pnpm -v
node -p "require('./package.json').version"
node -p "require('./package.json').dependencies.nuxt || require('./package.json').devDependencies.nuxt"
```

- Node 必须满足 Clarity 的 engine 范围。
- 使用 pnpm 10 或更新版本。你的站点不强制使用 Clarity 的精确开发版本。
- 确认源包版本与 commit。迁移映射针对上文所示 commit 上的 3.7.2 测试。

### 2.2 要求源仓库干净且可恢复

```bash
git status --short --branch
git log -1 --oneline
```

先 commit 或 stash 用户变更。如果工作树不干净，应停止迁移并生成清单，而不是覆盖文件。

### 2.3 盘点站点特有能力

编辑前逐项记录：

- `blog.config.ts` 的 site、article、feed、stats、script 与 Twikoo 值
- `app/app.config.ts` 的 UI 值与从站点配置派生的表达式
- `content.config.ts` 的 schema 扩展
- 自定义 Content 集合或 Markdown 插件
- `app/feeds.ts` 友链分组与辅助函数导入
- `redirects.json`
- `patches/` 与 `pnpm-workspace.yaml` 的 `patchedDependencies`
- 自定义模块、插件、中间件、组件、布局、页面、composables 与 stores
- 自定义服务端路由、中间件、nitro 插件与路由规则
- 部署文件与平台设置
- `runtimeConfig`、环境变量、预渲染路由、头与重定向
- 创建文章或检查 feed 的脚本
- 统计分析、评论、搜索、图片服务与外部 API 等集成

为每一项标记：

| 分类 | 含义 |
| --- | --- |
| `AUTO` | 本指南记载的安全机械映射 |
| `REVIEW` | 需要人工决策或站点特定测试 |
| `KEEP` | 在使用方原样保留 |
| `NEVER_TOUCH` | 用户内容或高价值数据，绝不能重写 |

`content/**`、文章正文、frontmatter 语义、公共资源、重定向、补丁、未知自定义模块与未知服务端代码永远不会被自动删除或重写。

## 3. 备份指引

1. 创建迁移分支：

   ```bash
   git switch -c migrate-to-clarity
   ```

2. 打 tag 或记录确切的源 commit：

   ```bash
   git tag pre-clarity-migration
   ```

3. 可选：把完整项目（含未跟踪文件）复制到其他位置。`.env` 文件可以放进你的私有备份，但绝不能 commit。
4. 确认你的 Git 远端或其他离线备份包含所有重要分支与 tag。
5. 在迁移后的站点完成构建、并且你审查过代表性文章路由、feed、图片、重定向与集成之前，保留原项目可用。

在迁移报告与验证完成之前，不要删除 `content/`、`public/`、`patches/`、`redirects.json`、自定义服务端代码或原始配置文件。

## 4. 迁移步骤

以下顺序保持可恢复的边界：先安装 Layer，再逐个替换配置入口，最后对账自定义代码与数据。

### 4.1 安装 Clarity Theme

首次 npm 发布之前，锁定一个已审查的 Git commit：

```bash
pnpm add github:iicemeta/clarity-theme#<commit>
```

发布版本可用后，改用文档记载的包版本范围。将 Clarity 安装为运行时依赖，而不是开发依赖。

### 4.2 替换 `nuxt.config.ts` 中的应用入口

从一个精简的使用方配置开始：

```ts
import { mapValues } from 'es-toolkit/object'
import redirectList from './redirects.json'

export default defineNuxtConfig({
	extends: ['clarity-theme'],

	routeRules: {
		...mapValues(redirectList, to => ({ redirect: { to, statusCode: 308 } })),
		// 这里只保留站点专属规则。
	},
})
```

保留使用方自有的设置：

- 重定向与自定义路由规则/头
- `runtimeConfig`，尤其是仅服务端的密钥
- 自定义模块与插件
- 自定义 nitro/预渲染/部署设置
- 平台相关的图片、托管、边缘或 CDN 行为
- Clarity 尚未提供的自定义钩子

不要复制完整的旧博客 `nuxt.config.ts`。Clarity 已经提供其模块、Content Markdown 管线、样式、色彩模式、SEO 站点元数据、robots、LLMs、常见 head 链接，以及 Atom、OPML 与统计的预渲染规则。重复这些内容会造成不稳定的合并或重复输出。

如果你的 Clarity 配置不在根目录，设置模块选项：

```ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
	clarityConfig: { configFile: 'config/clarity.config.ts' },
})
```

### 4.3 创建 `clarity.config.ts`

把站点与语义数据从 `blog.config.ts` 中迁出。与已测试上游形态几乎等价的配置：

```ts
import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: 'My Blog',
		subtitle: 'A short subtitle',
		description: 'A description used by SEO and feeds.',
		url: 'https://example.com/',
		language: 'zh-CN',
		established: '2019-07-19',
		timezone: 'Asia/Shanghai',
		favicon: '/favicon.svg',
		author: {
			name: 'My Name',
			avatar: '/avatar.webp',
			email: 'me@example.com',
			homepage: 'https://example.com/',
		},
		copyright: {
			abbr: 'CC BY 4.0',
			name: 'Attribution 4.0 International',
			url: 'https://creativecommons.org/licenses/by/4.0/',
		},
	},

	article: {
		defaultCategory: 'Uncategorized',
		categories: {
			Uncategorized: { icon: 'tabler:circle-dashed' },
			Tech: { icon: 'tabler:code', color: '#7777ff' },
		},
		types: { tech: {}, story: {} },
		order: { date: 'Created', updated: 'Updated' },
		useRandomPermalink: false,
		hidePostPrefix: true,
		robotsNotIndex: ['/preview', '/previews/*'],
	},

	feed: { limit: 50, enableStyle: true },
	stats: { includePaths: [] },

	integrations: {
		scripts: [
			// 只保留你自己的统计与 Twikoo loader 脚本。
		],
		twikoo: {
			envId: 'https://twikoo.example.com/',
			preload: 'https://twikoo.example.com/',
		},
	},

	features: {
		atom: true,
		opml: true,
		stats: true,
		antiMirror: false,
	},

	changelog: [],
})
```

绝不要把私有 token 放进这个文件。`site` 下的值、大多数 article/feed/stats 数据、功能开关、Twikoo 设置与更新日志都可能进入生成的客户端输出。密钥请使用仅服务端的 `runtimeConfig`。

完整字段契约见[配置说明](./CONFIGURATION.zh-CN.md)。

### 4.4 替换 `content.config.ts`

使用 Clarity 工厂：

```ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

未审查工厂输出之前，不要把自定义集合 schema 展开进这个文件。如果你新增过 frontmatter 字段，请判断它们属于：

- 已由 Clarity schema 表达；
- 纯展示字段，可以作为额外 Content 数据保留；或
- 需要本地 schema 扩展与测试的契约字段。

迁移期间文章正文与 frontmatter 键应保持不变。不要顺带规范化日期、分类、固定链接或措辞。

### 4.5 把 `app/app.config.ts` 转换为仅 UI 覆盖

移除旧的展开写法：

```ts
export default defineAppConfig({
	// 旧模式：不要把它带进 Clarity。
	// ...blogConfig,
	clarity: {},
})
```

只保留 `clarity` 下的 UI 分组：

```ts
export default defineAppConfig({
	clarity: {
		component: {
			codeblock: { triggerRows: 32, collapsedRows: 16 },
		},
		footer: {
			iconNav: [
				{ icon: 'tabler:home', text: 'Homepage', url: 'https://example.com/' },
			],
		},
		header: {
			showTitle: true,
			emojiTail: ['📝'],
		},
		nav: [
			{
				title: '',
				items: [
					{ icon: 'tabler:files', text: 'Articles', url: '/' },
					{ icon: 'tabler:link', text: 'Friends', url: '/link' },
					{ icon: 'tabler:archive', text: 'Archive', url: '/archive' },
				],
			},
		],
		pagination: { perPage: 10, sortOrder: 'date' },
	},
})
```

合法的顶层键恰好是 `component`、`footer`、`header`、`link`、`nav`、`pagination` 与 `themes`。从 `blog.config.ts` 派生的站点值必须来自 `clarity.config.ts`。模块在 app config 中发现站点级字段时会刻意发出警告。

Nuxt 对对象做深度合并，但数组会整体替换主题数组。重写引用过 `blogConfig` 的表达式；例如显式设置当前页脚版权文本，或依赖 Clarity 的生成默认值。

### 4.6 把友链数据移到根目录 `feeds.ts`

Clarity 期望可选的根级 `feeds.ts`、`feeds.mjs` 或 `feeds.js`：

```ts
import type { FeedGroup } from 'clarity-theme/config'

export default [
	{
		name: 'Friends',
		desc: 'Blogs I read',
		entries: [
			{
				author: 'Friend',
				title: 'Friend Blog',
				desc: 'A friend site',
				link: 'https://friend.example.com/',
				feed: 'https://friend.example.com/atom.xml',
				date: '2026-01-01',
			},
		],
	},
] satisfies FeedGroup[]
```

- 从旧的 `app/feeds.ts` 迁移友链分组；不要把旧的自有 feed 导出移进主题数据。
- Atom 输出由你的 Content 集合与 `site.*` 派生，因此不再需要自有 feed 条目。
- 只有当你的友链数据确实依赖自定义辅助函数时才保留；否则内联稳定值，避免携带私有应用工具。
- `feeds.ts` 是用户数据，永远不会随 Clarity 打包。

### 4.7 保留重定向

把 `redirects.json` 保留在使用方根目录，并继续从中派生路由规则。迁移时不要把它移进 Clarity、重命名旧路由或修改文章路径。

生成后，同时测试一个代表性重定向与一个规范文章 URL。除非旧部署刻意使用了其他状态码，重定向状态通常应保持 308。

### 4.8 对账 `package.json`

Clarity 提供其通用博客依赖。你的包应保留：

- `clarity-theme`
- 满足 Clarity peer 的 Nuxt 与 Vue 版本
- 自定义模块、集成、服务端库、部署工具与内容工具
- 文章脚手架、feed 检查等站点脚本
- 包管理器 patch 注册

只有当以下条件全部成立时才移除依赖：

1. Clarity 已为 Layer 声明它；
2. 没有任何使用方文件直接导入它；且
3. 你的 lockfile 与 typecheck/generate 运行保持干净。

拿不准时，保留依赖并标记 `REVIEW`。

### 4.9 保留补丁

修改这一区域前先阅读[补丁说明](./PATCHES.zh-CN.md)。补丁是安装根状态，永远不会通过 npm 包传递。

| 源补丁 | 迁移动作 |
| --- | --- |
| `@nuxtjs/mdc` detab 行为 | 当 tab 保留对你的代码块重要时，保留为 consumer patch |
| `@nuxt/image` 小数 density | 内容传入 `1.5x` 之类字符串值时保留；否则测试移除 |
| `plain-shiki` selector | 需要精确 copy-box 高亮颜色时，为当前 Clarity 基线保留 |
| `ipx` ICO 透传 | 只有当你的 ICO 资源真的经过 IPX 时才保留 |
| 未注册文件，例如未生效的 `@vue/shared` patch | 不要仅仅因为它存在就注册或复制 |

补丁文件与其 `patchedDependencies` 映射要一起保留，重新生成 lockfile，并检查结果 diff。绝不要把补丁复制进主题包。

### 4.10 保留自定义组件

Clarity 已包含上游派生的通用组件。不要把整个旧的 `app/components/` 树复制过来。

对每个旧组件：

1. 如果它是未修改的通用博客代码，交给 Layer 提供。
2. 如果它是你的自定义组件，保留在使用方相对路径。
3. 如果它有意修改通用 Clarity 行为，只把该组件复制到同路径作为使用方覆盖。
4. 如果它依赖旧的 `blogConfig`，只在过渡审查期间从 `~/clarity.config` 导入；最终运行时代码应使用 Clarity composables 或显式 props/配置。

常见覆盖位置包括：

```text
app/components/content/Badge.vue
app/components/blog/BlogFooter.vue
app/components/post/Article.vue
app/components/widget/BlogStats.vue
```

使用方同路径组件优先。Nuxt 可能对这种模式发出有意的重名警告。

### 4.11 保留自定义服务端与路由代码

Clarity 提供：

- `server/api/stats.get.ts`
- `server/routes/atom.xml.get.ts`
- `server/routes/subscriptions.opml.get.ts`

保留你的自定义服务端路由、中间件、nitro 插件、API 端点、认证、代理、webhook 与部署 handler。如果与 Clarity 输出路径冲突，不要静默删除；比较行为并选择一个显式实现。

路由规则与重定向仍由使用方持有。保留认证、缓存、头、SSR/ISR、平台变换与部署相关行为。

### 4.12 保留资源、公共文件与内容

- `content/` 原地保留。
- 保留 `public/` 文件与缓存指纹/路径。
- 保留文章引用的源图片与其他资源目录。
- 只有当站点仍在使用时才保留自定义字体与图标。
- 不要把重写文章正文、frontmatter、图片 URL、分类名、固定链接或链接文本作为主题迁移的一部分。

如果某个资源必须移动以修复失效路径，把它作为单独的已审查变更，并做前后验证。

## 5. `blog.config.ts` → `clarity.config.ts` 映射

| blog-v3 字段 | Clarity 字段 | 说明 |
| --- | --- | --- |
| `title` | `site.title` | 必填 |
| `subtitle` | `site.subtitle` | 可选 |
| `description` | `site.description` | 必填 |
| `url` | `site.url` | 必填；必须以 `/` 结尾 |
| `author` | `site.author` | `name`、`avatar`、`email` 与 `homepage` 含义不变 |
| `copyright` | `site.copyright` | `abbr`、`name` 与 `url` 仍可用 |
| `favicon` | `site.favicon` | 可使用外部或公共 URL |
| `language` | `site.language` | 默认 `zh-CN` |
| `timeEstablished` | `site.established` | 可选日期字符串 |
| `timeZone` | `site.timezone` | 小写 `zone`；默认 `Asia/Shanghai` |
| `defaultCategory` | `article.defaultCategory` | 移到 `article` 下 |
| `article.categories` | `article.categories` | icon/color 形态相同 |
| `article.types` | `article.types` | 第一个键仍是默认版式 |
| `article.order` | `article.order` | 排序字段 → 显示名 |
| `article.useRandomPremalink` | `article.useRandomPermalink` | 修正源码拼写错误；当前是脚手架开关，不是生成器 |
| `article.hidePostPrefix` | `article.hidePostPrefix` | 控制 `/posts/` 前缀移除 |
| `article.robotsNotIndex` | `article.robotsNotIndex` | 供给 robots 配置 |
| `feed.limit` | `feed.limit` | 正整数 |
| `feed.enableStyle` | `feed.enableStyle` | Atom XSLT 开关 |
| `stats.includePaths` | `stats.includePaths` | SQL-LIKE Content 路径模式 |
| `scripts` | `integrations.scripts` | 保留统计与 Twikoo loader 脚本 |
| `twikoo` | `integrations.twikoo` | `envId` 与可选 `preload` |
| `myFeed` | 无 Clarity 配置字段 | Atom 自有 feed 数据由 `site` 与 Content 派生 |

变成显式 `features` 的字段：

| 旧行为 | 新字段 | 默认值 |
| --- | --- | --- |
| 始终生成 Atom | `features.atom` | `true` |
| 始终生成 OPML | `features.opml` | `true` |
| 统计 API/小部件始终启用 | `features.stats` | `true` |
| 反镜像脚本在私有代码中配置 | `features.antiMirror` | `false` |

Twikoo UI 由 `integrations.twikoo.envId` 的存在启用；它不是 `features` 开关。其 loader 脚本保留在 `integrations.scripts`。

## 6. `app/app.config.ts` 映射

| 旧顶层键 | 新使用方键 |
| --- | --- |
| `component` | `clarity.component` |
| `footer` | `clarity.footer` |
| `header` | `clarity.header` |
| `link` | `clarity.link` |
| `nav` | `clarity.nav` |
| `pagination` | `clarity.pagination` |
| `themes` | `clarity.themes` |

不要把旧博客配置展开进 app config。站点身份与语义配置属于 `clarity.config.ts`；app config 只覆盖响应式 UI 默认值。

特殊情况：

- `header.logo` 默认取自 `site.author.avatar`。
- `header.subtitle` 默认取自 `site.subtitle`。
- `footer.copyright` 有由当前年份、作者与可选版权名称生成的默认值。
- `pagination.sortOrder` 必须是 `article.order` 中的键。
- `component.stats.wordCount` 已废弃；小部件从统计 API 计算当前字数。

## 7. `nuxt.config.ts` 原则

### Clarity 提供

- 核心博客模块与 Layer 组件/样式注册
- Content Markdown、MDC、数学、Mermaid、ABC、阅读时长与站点地图管线
- 色彩模式与常见 UI 运行时设置
- 站点名称/URL/语言、robots、sitemap 与 LLMs 默认值
- 常见 head 元数据与输出功能路由规则
- Atom、OPML 与统计服务端输出
- permalink 与 `/posts/` 前缀 Content 钩子

### 保留在使用方

- `extends: ['clarity-theme']`
- 从 `redirects.json` 导入的重定向
- 自定义 `routeRules`、头、缓存、认证与代理
- 仅服务端的 `runtimeConfig` 与环境集成
- 自定义模块与插件
- 主题不知道的部署与预渲染路由
- 平台相关的图片、边缘、CDN 或托管设置
- 实现站点策略的自定义钩子

只有当你能验证某设置是覆盖而非重复主题行为时，才把它合并进使用方配置。

## 8. 补丁迁移

Clarity 刻意没有补丁目录。在你的包管理器配置中保留所需补丁，当前处置见[补丁说明](./PATCHES.zh-CN.md)。

- **已由主题代码消化：** MDC 兼容问题的行内代码部分由 Clarity 的代码组件处理。
- **仍由使用方持有：** MDC detab 保留、用到小数图片密度处、短期 plain-Shiki selector 补丁，以及可选的 IPX ICO 透传。
- **上游 PR 候选：** 小数图片密度解析与 plain-Shiki selector 默认值。MDC detab 行为需要更广泛的上游设计讨论。

复制文件本身不等于迁移补丁。依赖版本、补丁路径、lockfile 与 `patchedDependencies` 注册必须全部匹配。

## 9. 数据安全边界

- Clarity 不迁移也不持有文章；`content/` 保留在你的项目中。
- Clarity 不携带你的友链；`feeds.ts` 保留在你的项目中。
- Clarity 不携带你的统计后端或统计分析标识；只支持通用统计生成与配置的 head 脚本。
- Clarity 不携带重定向、部署文件、私有媒体、密钥或补丁。
- 主题包输出不得包含用户文章或站点特定数据。

## 10. 验证

串行运行命令；不要在同一项目上同时启动多个 dev/build 进程。

最低使用方验证：

```bash
pnpm install
pnpm typecheck
pnpm generate
```

如果你的项目没有 `typecheck` 脚本，使用 `pnpm exec nuxt typecheck` 或添加等价脚本。然后运行你自己的单元、lint、链接、内容、截图、部署预览与集成测试。

代表性人工检查：

1. 首页与分页
2. 最新与最旧文章路由
3. 带自定义固定链接的文章
4. 带图片、代码 tab、数学公式、Mermaid 与乐谱的文章
5. 归档、友链、搜索、TOC 与 404 页面
6. Atom、OPML、统计、robots、sitemap 与 LLMs 输出
7. 重定向与自定义头
8. Twikoo 与统计分析分支
9. light/dark/system 主题行为
10. 每个自定义组件与服务端路由

主题维护者还应额外运行 Clarity 发布套件：

```bash
pnpm test:consumer
pnpm test:compatibility
```

这些命令验证主题的夹具与打包消费者；它们不能替代针对你站点内容的测试。

## 11. 故障排查

### Layer 未加载

- 确认 `clarity-theme` 安装在要求的 commit/版本。
- 确认 `extends: ['clarity-theme']`。
- 入口变更后清除陈旧的 `.nuxt/`、`.output/` 与 `.data/` 缓存。
- 确认没有自定义模块或配置钩子替换掉 Clarity 的模块列表。

### 配置被拒绝或被忽略

- 使用精确的 Clarity 字段名；schema 拒绝未知字段。
- 检查 `timeZone → timezone`、`timeEstablished → established` 与 `useRandomPremalink → useRandomPermalink`。
- 保持 `site.url` 以斜杠结尾。
- 确认 `clarity.config.ts` 在根目录，或被 `clarityConfig.configFile` 引用。
- 从 app config 中移除旧的 `...blogConfig`。

### Content schema 错误

- 确保 `content.config.ts` 导出 `createClarityContentConfig(clarityConfig)`。
- 导入同一个根 Clarity 配置；不要创建两个分叉的配置对象。
- 确认文章 `type` 值存在于 `article.types`。
- 未审查 Nuxt Content 查询行为之前，不要添加第二个 `content` 集合。

### 文章返回 404

- 检查 `article.hidePostPrefix` 与 `content/posts/` 下的物理路径。
- 检查 frontmatter `permalink` 值，但不要编辑它们。
- 检查生成的路由与重定向是否冲突。
- 确认平台的尾部斜杠与预渲染设置。

### 固定链接不一致

Clarity 在应用前缀隐藏之前先尊重 Content frontmatter `permalink`。迁移期间不要重新生成固定链接。对比源路由、规范路由、重定向目标与生成的路由列表。

### 图片失败

- 保留公共/源资源路径。
- 检查外部图片提供商与平台图片设置。
- 内容传入 `1.5x` 字符串时，保留小数 density 补丁。
- 保留或刻意测试 ICO/IPX 补丁。
- 验证自定义 `Img`/content 组件覆盖仍接收相同的 props。

### Shiki 输出变化

- 把使用方主题放进 `app/shiki.config.ts`。
- 确认 light 与 dark 主题导入都存在。
- 受限/离线构建可能受远程 Shiki 导入影响。
- 需要精确 plain 高亮颜色时，保留短期 selector 补丁。

### Mermaid 变化

使用主题 Markdown 管线，而不是注册重复的 `remark-code-component` 配置。检查围栏语言、组件 props、自定义 `Mermaid.vue` 覆盖与浏览器控制台错误。

### 数学渲染变化

避免添加第二个 KaTeX 样式表或重复的 remark/rehype 插件。分别检查行内与块级公式，并保留自定义数学组件覆盖。

### Twikoo 不初始化

- 配置 `integrations.twikoo.envId`。
- 把 Twikoo loader 脚本保留在 `integrations.scripts`；主题不打包 Twikoo。
- 检查 `preload`、浏览器网络访问、CSP 与部署域名设置。
- 确认文章页包含 `#twikoo`。

### Atom 或 OPML 缺失

- 检查 `features.atom` 与 `features.opml`。
- 清缓存后确认生成的文件与路由规则。
- Atom 检查 Content 草稿/日期行为与 `feed.limit`。
- OPML 确认根 `feeds.ts` 被发现并导出 `FeedGroup[]`。

### 统计不正确

- 检查 `features.stats` 与 `stats.includePaths`。
- 注意在已测试基线上，多个模式当前是已知正确性问题；遇到时使用单个已审查模式。
- 修改配置前先确认 Content 路径与生成的 JSON。

### 重定向失败

- 保留 `redirects.json` 及其路由规则映射。
- 检查状态码、尾部斜杠、平台变换顺序与文章路由冲突。
- 在规范 URL 与外链验证完成之前，不要删除旧路由。

### 补丁行为变化

- 确认每个补丁都在使用方包管理器配置中注册。
- 依赖或补丁变更后重新生成 lockfile。
- 对比 MDC tab、图片密度、Shiki selector 行为与 ICO 处理。
- 绝不要把补丁复制进 Clarity，也不要依赖包来激活它们。
