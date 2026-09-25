# 将 blog-v3 迁移到 Clarity Theme

[English](./migration-from-blog-v3.md) | **简体中文**

本指南将现有的 Nuxt 4 `blog-v3` 项目迁移到 Clarity Theme Layer，同时保留文章、frontmatter、公共资源、重定向、补丁、自定义组件、自定义模块与服务端能力。它依据 [`sync-manifest.json`](../../sync-manifest.json) 记录的源基线（上游 `blog-v3` 3.7.2）维护；当前已验证矩阵见[兼容性说明](../reference/compatibility.zh-CN.md)。

如需 Agent 协助迁移，直接让你的 Agent 使用 `migrate-blog-v3-to-clarity` Skill。该 Skill 封装了同样的「清单 → 分类 → 计划 → 应用 → 验证」流程，并为非交互执行提供更严格的安全约束。

## 新建项目与既有项目的区别

从零创建博客和迁移既有站点是两个不同的契约，不要混用：

| 场景 | 必须使用的路径 | 绝对禁止 |
| --- | --- | --- |
| 全新 Clarity 博客 | [`create-clarity-theme`](./new-project.zh-CN.md) —— `pnpm create clarity-theme <project>` 或 `npx create-clarity-theme@latest <project>` | 手写 `package.json`、自行猜测 Nuxt/Vue/Nuxt Content 版本、手工拼接 Nuxt 骨架、把本仓库整个复制为站点 |
| 既有 `blog-v3` | 本指南与 `migrate-blog-v3-to-clarity` Skill | 对项目重新运行创建器、用创建器模板替换消费方文件、删除 content、`public/`、重定向、补丁或自定义代码 |

创建器是新项目骨架、`package.json` 与最小已测试直接依赖的 source of
truth。迁移则保留消费方自己的 `package.json`，只通过包管理器命令修改依赖。
如果 Agent 被要求「创建一个 Clarity 博客」，必须使用官方创建器，不得手写
`package.json`。

### 迁移后的 Theme 更新

`package.json` 中的 range 不等于实际安装的版本。按 npm node-semver 规则，
`^0.2.0` 表示 `>=0.2.0 <0.3.0`：可以接受后续 `0.2.x` patch 版本，但不能接受
`0.3.0` —— caret range 不是锁死版本。`pnpm-lock.yaml` 记录的是实际解析安装的
resolved version，在你主动更新之前，它可能一直停留在 range 内较旧的 patch
版本上；仅运行 `pnpm install` 不会刷新它。仍固定在 `^0.1.x` range 的 consumer
会停留在 legacy 0.1.x 线上，必须放宽 range 才会拿到 0.2.x。

```bash
pnpm update clarity-theme          # 在已声明范围内刷新 resolved version
pnpm add clarity-theme@<version>   # 显式修改依赖声明本身
```

永远不要手工编辑 `pnpm-lock.yaml`。

## 1. 范围

迁移**不会**把 `content/` 移入 Theme、转换 frontmatter 或删除旧项目。Clarity 是 Layer；你的仓库始终是站点与数据的所有者。任何未识别的本地改动都必须经过审查，而不是盲目覆盖。如果源项目不是 blog-v3，或其基线与下述映射差异过大且无法对齐，请停止并说明差距。

| 项目 | 支持值 |
| --- | --- |
| 源项目 | `blog-v3` 3.7.2（基线记录在 `sync-manifest.json`） |
| Nuxt 源/运行时 | 4.5.2 / Clarity peer `^4.5.2` |
| Node | `^22.19 \|\| ^24.11 \|\| >=26` |
| 包管理器 | 消费方使用 pnpm 10+ 即可；Theme 开发本身使用 pnpm 12.4.1 |

## 2. 迁移之前

1. 验证工具链：`node -v`、`pnpm -v`，并确认源包/Nuxt 版本满足上表。
2. 要求仓库干净、可恢复：

   ```bash
   git status --short --branch
   git log -1 --oneline
   ```

   先提交或暂存用户改动。如果工作树不干净，请停止并输出清单，而不是覆盖文件。

3. 创建迁移分支并标记源 commit：

   ```bash
   git switch -c migrate-to-clarity
   git tag pre-clarity-migration
   ```

4. 在编辑任何文件之前，先盘点站点特有能力：`blog.config.ts`、`app/app.config.ts`、`content.config.ts`、自定义集合或 Markdown 插件、`app/feeds.ts`、`redirects.json`、`patches/` 及其包管理器注册、自定义 modules/plugins/middleware/components/layouts/pages/composables/stores、自定义服务端路由与 route rules、部署文件、`runtimeConfig`、文章脚手架脚本与各类集成。
5. 为每个清单项分类：

   | 分类 | 含义 |
   | --- | --- |
   | `AUTO` | 本指南记载的安全机械映射 |
   | `REVIEW` | 需要人工决策或站点特有测试 |
   | `KEEP` | 在消费项目中保持不变 |
   | `NEVER_TOUCH` | 用户内容或高价值数据，绝不能改写 |

   `content/**`、文章正文、frontmatter 语义、公共资源、重定向、补丁、未知自定义模块与未知服务端代码永远不会被自动删除或改写。

## 3. 迁移步骤

该顺序保持可恢复边界：先安装 Layer，再逐个替换配置入口，最后对齐自定义代码与数据。

### 3.1 安装 Clarity Theme

把已发布的 npm 包安装为运行时依赖：

```bash
pnpm add clarity-theme
```

如需使用未发布的 commit 或调试某个具体变更，可回退到固定 Git 依赖（`pnpm add github:iicemeta/clarity-theme#<commit>`）；正式站点应使用 npm 包。
需要显式指定版本或修改 range 时，使用 `pnpm add clarity-theme@<version>`，
而不是手工编辑 `package.json`。

### 3.2 替换 `nuxt.config.ts` 应用入口

```ts
import { mapValues } from 'es-toolkit/object'
import redirectList from './redirects.json'

export default defineNuxtConfig({
	extends: ['clarity-theme'],

	routeRules: {
		...mapValues(redirectList, to => ({ redirect: { to, statusCode: 308 } })),
		// 这里只保留站点特有规则。
	},
})
```

保留消费方自有配置：重定向与自定义 route rules/headers、`runtimeConfig`（尤其是服务端密钥）、自定义模块与插件、自定义 nitro/prerender/部署设置、平台图片/边缘/CDN 行为以及自定义 hooks。不要复制完整的旧博客 `nuxt.config.ts`——Clarity 已提供其模块、Content Markdown 管线、样式、颜色模式、SEO 元数据、robots、LLMs、通用 head 链接以及 Atom/OPML/stats 的 prerender 规则。

### 3.3 创建 `clarity.config.ts`

把站点与语义数据从 `blog.config.ts` 中迁出：

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
		copyright: { abbr: 'CC BY 4.0', name: 'Attribution 4.0 International', url: 'https://creativecommons.org/licenses/by/4.0/' },
	},
	article: {
		defaultCategory: 'Uncategorized',
		categories: {
			Uncategorized: { icon: 'tabler:circle-dashed' },
			Tech: { icon: 'tabler:code', color: '#7777ff' },
		},
		types: { tech: {}, story: {} },
		order: { date: 'Created', updated: 'Updated' },
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
	features: { atom: true, opml: true, stats: true, antiMirror: false },
	changelog: [],
})
```

绝不要把私有 token 放进该文件。`site` 下的大部分 article/feed/stats 数据、feature 开关、Twikoo 设置与 changelog 都可能进入生成的客户端输出；密钥属于服务端 `runtimeConfig`。完整字段契约见[配置](../guides/configuration.zh-CN.md)。

### 3.4 替换 `content.config.ts`

```ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

未经审查不要把自定义集合 schema 展开进该文件。如果你新增过 frontmatter 字段，先判断它属于：Clarity schema 已有字段、仅用于展示的额外 Content 数据，还是需要本地 schema 扩展与测试的契约字段。文章正文与 frontmatter 键应保持不变——不要在迁移时顺手规范化日期、分类、固定链接或措辞。

### 3.5 把 `app/app.config.ts` 转换为仅 UI 覆盖

移除旧的 `...blogConfig` 展开，只保留 `clarity` 下的 UI 分组：

```ts
export default defineAppConfig({
	clarity: {
		component: { codeblock: { triggerRows: 32, collapsedRows: 16 } },
		header: { showTitle: true, emojiTail: ['📝'] },
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

允许的顶层键只有 `component`、`footer`、`header`、`link`、`nav`、`pagination` 与 `themes`。从 `blog.config.ts` 派生的站点值必须放进 `clarity.config.ts`；模块发现 app config 中出现站点级字段时会输出 WARN。对象深度合并；数组整体替换 Theme 值。

### 3.6 把友链数据移到根目录 `feeds.ts`

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

把旧 `app/feeds.ts` 中的友链分组迁出；**不要**迁移旧的 self-feed 导出——Atom 输出由你的 Content 集合与 `site.*` 派生。只有在数据确实依赖时才保留自定义 helper 函数。`feeds.ts` 是用户数据，永远不会随 Clarity 打包。

### 3.7 保留重定向

`redirects.json` 保留在消费项目根目录，并继续从中派生 route rules（§3.2）。不要把它移入 Clarity，不要在迁移时重命名旧路由或修改文章路径。生成后测试一个代表性重定向与一个规范文章 URL。

### 3.8 对齐 `package.json`

你的包保留：`clarity-theme`、满足 Clarity peer 的 Nuxt/Vue、自定义模块/集成/服务端库/部署工具、站点脚本与补丁注册。只有当 Clarity 已为 Layer 声明该依赖、没有消费方文件直接导入它、且 lockfile 与 typecheck/generate 都干净时才移除。拿不准就保留并标记 `REVIEW`。

### 3.9 保留补丁

补丁属于安装根目录状态，永远不会通过 npm 包传递——见[补丁策略](../maintainers/patches.zh-CN.md)。

| 源补丁 | 迁移动作 |
| --- | --- |
| `@nuxtjs/mdc` detab 行为 | 当 tab 保留对代码块重要时，保留为消费方补丁 |
| `@nuxt/image` 小数 density | 内容传入 `1.5x` 之类字符串时保留；否则测试移除 |
| `plain-shiki` selector | 当前基线下需要精确 copy-box 高亮色时保留 |
| `ipx` ICO 透传 | 仅当 ICO 资产真的经过 IPX 时保留 |
| 未注册文件（如未生效的 `@vue/shared` 补丁） | 不要仅因存在就注册或复制 |

补丁文件与 `patchedDependencies` 注册必须成对保留；重新生成 lockfile 并检查 diff。

### 3.10 保留自定义组件

不要复制整个旧的 `app/components/` 目录。对每个组件：

1. 未修改的通用博客代码 → 交给 Layer 提供；
2. 你自己的自定义组件 → 保留在同一消费方相对路径；
3. 对通用 Clarity 行为的有意修改 → 只复制该组件到同路径作为消费方覆盖；
4. 依赖旧 `blogConfig` 的代码 → 改写为使用 Clarity 公共 composables 或显式 props/配置。

消费方同路径组件优先；该模式下 Nuxt 可能输出有意的重名警告（`NUXT_B3011`）。见[自定义](../guides/customization.zh-CN.md)。

### 3.11 保留自定义服务端与路由代码

Clarity 提供 `server/api/stats.get.ts`、`server/routes/atom.xml.get.ts` 与 `server/routes/subscriptions.opml.get.ts`。保留你的自定义路由、middleware、nitro plugins、端点、鉴权、代理、webhook 与部署 handler。如果与 Clarity 输出路径冲突，比较行为并选择一个明确的所有者，而不是依赖偶然的优先级。

### 3.12 保留资源、公共文件与内容

`content/`、`public/`、源图片与被引用的资源目录保持原位。不要在主题迁移中改写文章正文、frontmatter、图片 URL、分类名、固定链接或链接文字。如果某个资产必须移动以修复路径，请作为单独的受审变更处理。

## 4. `blog.config.ts` → `clarity.config.ts` 映射

| blog-v3 字段 | Clarity 字段 | 说明 |
| --- | --- | --- |
| `title` | `site.title` | 必填 |
| `subtitle` | `site.subtitle` | 可选 |
| `description` | `site.description` | 必填 |
| `url` | `site.url` | 必填；必须以 `/` 结尾 |
| `author` | `site.author` | `name`、`avatar`、`email`、`homepage` 含义不变 |
| `copyright` | `site.copyright` | `abbr`、`name`、`url` 仍可用 |
| `favicon` | `site.favicon` | 可用外部或公共 URL |
| `language` | `site.language` | 默认 `zh-CN` |
| `timeEstablished` | `site.established` | 可选日期字符串 |
| `timeZone` | `site.timezone` | 小写 `zone`；默认 `Asia/Shanghai` |
| `defaultCategory` | `article.defaultCategory` | 移到 `article` 下 |
| `article.categories` | `article.categories` | icon/color 结构相同 |
| `article.types` | `article.types` | 首个键仍是默认版式 |
| `article.order` | `article.order` | 排序字段 → 显示名 |
| `article.useRandomPremalink` | 无 Clarity 字段 | 随机固定链接生成属于消费方构建脚手架；删除该字段，`permalink` frontmatter 保持不变 |
| `article.hidePostPrefix` | `article.hidePostPrefix` | 控制 `/posts/` 前缀移除 |
| `article.robotsNotIndex` | `article.robotsNotIndex` | 对接 robots 配置 |
| `feed.limit` | `feed.limit` | 正整数 |
| `feed.enableStyle` | `feed.enableStyle` | Atom XSLT 开关 |
| `stats.includePaths` | `stats.includePaths` | SQL-LIKE Content 路径模式；多模式取并集 |
| `scripts` | `integrations.scripts` | 保留统计与 Twikoo loader 脚本 |
| `twikoo` | `integrations.twikoo` | `envId` 与可选 `preload` |
| `myFeed` | 无 Clarity 配置字段 | Atom self-feed 数据由 `site` 与 Content 派生 |

上游隐式行为变成显式 feature 开关（除 `antiMirror` 外默认均为 `true`）：`features.atom`、`features.opml`、`features.stats` 与 `features.antiMirror`。Twikoo UI 由 `integrations.twikoo.envId` 的存在启用，不是 `features` 开关；其 loader 脚本保留在 `integrations.scripts`。

## 5. `app/app.config.ts` 映射

Clarity 保持上游形状的**扁平** app config，因此映射是恒等映射：顶层键名不变。

| 旧顶层键 | 新消费方键 |
| --- | --- |
| `component` | `component` |
| `footer` | `footer` |
| `header` | `header` |
| `link` | `link` |
| `nav` | `nav` |
| `pagination` | `pagination` |
| `themes` | `themes` |

0.1.x 的嵌套形式（`app.config.clarity.component` 等）已在 0.2.0 移除。若迁移后的项目仍带 `clarity` 键，请删除该键并把每个值移到对应的顶层键。见 [legacy 政策](../maintainers/legacy-policy.zh-CN.md)。

特例：`header.logo` 默认取 `site.author.avatar`；`header.subtitle` 默认取 `site.subtitle`；`footer.copyright` 有生成默认值；`pagination.sortOrder` 必须是 `article.order` 的键；`component.stats.wordCount` 已废弃（小部件从 stats API 计算当前字数）。

## 6. 数据安全边界

- Clarity 不迁移、不持有文章；`content/` 留在你的项目。
- Clarity 不携带友链；`feeds.ts` 留在你的项目。
- Clarity 不携带你的统计后端或统计标识；只支持通用统计生成与已配置的 head 脚本。
- Clarity 不携带重定向、部署文件、私有媒体、密钥或补丁。
- Theme 包输出不得包含用户文章或站点特有数据。

## 7. 验证

串行执行命令；不要在同一个项目上同时启动多个 dev/build 进程。

```bash
pnpm install
pnpm typecheck   # 或：pnpm exec nuxt typecheck
pnpm generate
```

然后运行你自己的单元、lint、链接、内容、截图、部署预览与集成测试。代表性人工检查：

1. 首页与分页
2. 最新与最旧的文章路由
3. 带自定义固定链接的文章
4. 带图片、代码 tab、数学公式、Mermaid 与乐谱的文章
5. 归档、友链、搜索、TOC 与 404 页面
6. Atom、OPML、stats、robots、sitemap 与 LLMs 输出
7. 重定向与自定义 headers
8. Twikoo 与统计分支
9. 亮/暗/系统主题行为
10. 每个自定义组件与服务端路由

修改 Clarity 迁移契约的 Theme 维护者还应额外在 Theme 仓库运行 `pnpm test:migration` 与 `pnpm test:compatibility`；它们验证的是 Theme 的 fixtures，不是你的站点内容。

## 8. 故障排查

- **Layer 未加载** —— 确认 `extends: ['clarity-theme']`，清除过期的 `.nuxt/`、`.output/`、`.data/` 缓存，并确认没有自定义模块替换了 Clarity 的模块列表。
- **配置被拒绝或忽略** —— schema 拒绝未知字段；检查 `timeZone → timezone` 与 `timeEstablished → established`；移除源项目的 `useRandomPremalink` 标志（Clarity 无对应字段）；`site.url` 必须以 `/` 结尾；确认配置文件在根目录或由 `clarityConfig.configFile` 指定；移除 app config 中旧的 `...blogConfig`。
- **Content schema 错误** —— 导出 `createClarityContentConfig(clarityConfig)` 并导入同一个根配置（不要创建两个分叉的配置对象）；确认文章 `type` 值存在于 `article.types`。
- **文章 404 / 固定链接不一致** —— 检查 `article.hidePostPrefix`、`content/posts/` 下的物理路径，以及 frontmatter `permalink` 值（不要编辑它们）；检查生成路由与重定向是否冲突。Clarity 先应用 `permalink`，再处理前缀隐藏。
- **图片失败** —— 保留公共/源资源路径；内容传入 `1.5x` 字符串时保留小数 density 补丁；确认自定义 `Img`/content 覆盖仍接收相同 props。
- **Shiki 输出变化** —— 把消费方主题放进 `app/shiki.config.ts`，亮暗主题都要导入；受限/离线构建可能受 Shiki 远程导入影响。
- **Mermaid / 数学渲染变化** —— 使用 Theme 的 Markdown 管线，不要注册重复插件；分别检查围栏语言、组件 props、行内/块级公式的控制台错误。
- **Twikoo 不初始化** —— 配置 `integrations.twikoo.envId` 并把 loader 脚本保留在 `integrations.scripts`；检查 `preload`、网络访问、CSP，以及文章页面是否包含 `#twikoo`。
- **Atom 或 OPML 缺失** —— 检查 `features.atom`/`features.opml`、清缓存后的生成文件与 route rules、`feed.limit`，以及根目录 `feeds.ts` 是否导出 `FeedGroup[]`。
- **统计不对** —— 检查 `features.stats` 与 `stats.includePaths`；多模式取并集（`['posts/%', 'notes/%']` 同时计入两类）；先确认 Content 路径与生成的 JSON，再调整配置。
- **重定向失败** —— 保留 `redirects.json` 及其 route-rule 映射；检查状态码、尾斜杠、平台转换顺序与路由冲突。
- **补丁行为变化** —— 确认每个补丁都注册在消费方包管理器配置中；依赖或补丁变更后重新生成 lockfile；绝不要把补丁复制进 Clarity。
