# Clarity Theme 配置契约（v0.1）

**English** | [简体中文](./CONFIGURATION.zh-CN.md)

> Source of truth: `config/schema.ts` / `config/schema.mjs`, `modules/clarity-config/index.ts`,
> `config/app.ts`, and their tests. Current project state is summarized in
> [PROJECT-STATUS](./PROJECT-STATUS.md); the API boundary is in [API](./API.md).

本文是 Theme 对 Consumer 暴露的全部配置面。字段标记含义：

- **Required**：Consumer 必须提供，缺省时 `defineClarityConfig()` 校验失败
- **Optional**：可省略
- **Default**：省略时 Theme 的默认值
- 可见性列标记：**✅ Client-visible**（该值会进入客户端 bundle，**禁止存放任何密钥 / token**）；
  **⚠️ 遗留**（仅服务端消费，但当前仍随 appConfig 进 bundle，为已登记的架构债务）；
  **⚙️ 构建期**（不进 appConfig，由模块在构建期消费，可能出现在最终页面 HTML）

应用配置入口如下：

| 文件 | 作用 | 校验 |
| --- | --- | --- |
| `clarity.config.ts` | 站点 / 内容 / 功能配置（`defineClarityConfig`） | zod schema（`clarity-theme/schema`） |
| `app/app.config.ts` | UI 覆盖（`defineAppConfig({ clarity: ... })`） | TypeScript（`CustomAppConfig` 合并） |
| `content.config.ts` | 调用 Theme 工厂生成 Content 集合 | `createClarityContentConfig` 内部再次 parse |
| `feeds.ts` | 友链数据（`FeedGroup[]`） | TypeScript |
| `runtimeConfig` | 环境与密钥；密钥仅允许 server-only 区 | Nuxt |

## 完整示例

以下示例展示 v0.1 配置面的全部顶层分组。字段级约束见后续章节；迁移 blog-v3 时请优先对照 [MIGRATION](./MIGRATION.md) 的映射表。

```ts
import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: 'My Blog',
		subtitle: 'Notes and experiments',
		description: 'A Nuxt 4 blog about technology and life.',
		url: 'https://example.com/',
		language: 'zh-CN',
		timezone: 'Asia/Taipei',
		established: '2026-01-01',
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
			Life: { icon: 'tabler:leaf', color: '#ff7777' },
		},
		types: { tech: {}, story: {} },
		order: { date: 'Created', updated: 'Updated' },
		hidePostPrefix: true,
		robotsNotIndex: ['/preview', '/previews/*'],
	},
	feed: { limit: 50, enableStyle: true },
	stats: { includePaths: ['posts/%'] },
	integrations: {
		scripts: [
			{ src: 'https://analytics.example.com/script.js', defer: true },
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
		antiMirror: { blacklist: ['mirror.example.com'] },
	},
	changelog: [
		{ date: '2026-01-01', text: 'Moved to Clarity Theme.' },
	],
})
```

## clarity.config.ts

### site

| 字段 | 类型 | 约束 | 可见性 |
| --- | --- | --- | --- |
| `title` | string | **Required**，非空 | ✅ |
| `subtitle` | string | Optional | ✅ |
| `description` | string | **Required**，非空 | ✅ |
| `url` | string | **Required**，合法 URL 且**必须以 `/` 结尾**（用于 `new URL()` 相对路径解析） | ✅ |
| `language` | string | Default `'zh-CN'` | ✅ |
| `timezone` | string | Default `'Asia/Shanghai'` | ✅ |
| `established` | string | Optional，建站日期 | ✅ |
| `favicon` | string | Default `'/favicon.svg'` | ✅ |
| `author.name` | string | **Required**，非空 | ✅ |
| `author.avatar` | string | Optional | ✅ |
| `author.email` | string | Optional（进入 author meta / Atom / OPML 公开元数据） | ⚙️ 仅服务端消费（不进 appConfig；作为公开元数据出现在 HTML head 与 feed 输出） |
| `author.homepage` | string | Optional | ✅ |
| `copyright` | `{ abbr?, name?, url? }` | Optional | ✅ |

### article

| 字段 | 类型 | 约束 / Default | 可见性 |
| --- | --- | --- | --- |
| `defaultCategory` | string | Default `'未分类'` | ✅ |
| `categories` | `Record<string, { icon?, color? }>` | Default `{}` | ✅ |
| `types` | `Record<string, object>` | Default `{ tech: {} }`；允许显式空对象，但 Content Schema 会兜底回退 `tech`，因此应显式配置 | ✅ |
| `order` | `Record<string, string>`（排序字段 → 显示名） | Default `{ date: '创建日期', updated: '更新日期' }` | ✅ |
| `hidePostPrefix` | boolean | Default `true`，仅模块构建期使用 | ⚙️ 仅构建期（不进 appConfig / 客户端 bundle） |
| `robotsNotIndex` | string[] | Default `[]`，仅模块构建期使用 | ⚙️ 仅构建期（不进 appConfig / 客户端 bundle） |

`types` 的**第一个键是默认文章版式**；`ui.pagination.sortOrder` 必须是 `order` 的键名。

### feed

| 字段 | 类型 | 约束 / Default | 可见性 |
| --- | --- | --- | --- |
| `limit` | number | 正整数，Default `50` | ⚙️ 仅服务端消费（Atom 生成，不进 appConfig / 客户端 bundle） |
| `enableStyle` | boolean | Default `true`（XSLT 样式页） | ⚙️ 同上 |

### stats

| 字段 | 类型 | 约束 / Default | 可见性 |
| --- | --- | --- | --- |
| `includePaths` | string[] | Default `[]`（统计全部内容）；SQL LIKE 语法（`%` / `_`），匹配 `content/` 下不含扩展名的路径；**多模式取并集**（`['posts/%', 'notes/%']` 同时计入两类内容） | ⚙️ 仅 stats API 服务端消费（完整规则不进 appConfig；客户端仅获得派生的 `stats.postsOnly` 展示事实） |

### integrations

⚠️ **本节禁止存放真正秘密。** `twikoo.*` 为 Client-visible（进入 appConfig / 客户端 bundle）；
`scripts` 不进 appConfig，由模块在构建期注入 `<head>`（脚本属性会出现在最终页面 HTML 中）。
密钥应放 `nuxt.config.ts` 的 `runtimeConfig`（server-only）。

| 字段 | 类型 | 约束 / Default | 可见性 |
| --- | --- | --- | --- |
| `twikoo.envId` | string | Optional；配置后渲染评论区 | ✅（appConfig） |
| `twikoo.preload` | string | Optional，默认使用 `envId` | ✅（appConfig） |
| `scripts` | `Record<string, string\|number\|boolean>[]` | Default `[]`，注入 `<head>` 的第三方脚本参数 | ⚙️ 构建期注入 `<head>`（已从 appConfig 剔除；出现在页面 HTML） |

### features

| 字段 | 类型 | 约束 / Default | 可见性 |
| --- | --- | --- | --- |
| `atom` | boolean | Default `true`，`/atom.xml`；关闭时静态产物缺省且 dev/SSR 运行时返回 404 | ⚙️ 构建期路由规则 + 服务端运行时守卫（不进 appConfig） |
| `opml` | boolean | Default `true`，`/subscriptions.opml`；关闭语义同上 | ⚙️ 同上 |
| `stats` | boolean | Default `true`，统计 API（服务端）；关闭语义同上 | ⚙️ 同上 |
| `antiMirror` | `boolean \| { blacklist: string[] }` | Default `false`。**Theme 不携带任何默认黑名单**：镜像站域名必须由消费者在 `blacklist` 中提供；`true`（等价于空黑名单）会**跳过脚本注入并输出 WARN**，需改用 `{ blacklist: [...] }` 显式提供域名。脚本会把镜像主机导航回 `site.url` 的规范主机 | ⚙️ 构建期注入客户端脚本（黑名单与站点 URL 以 base64 内联进页面，不进 appConfig） |

### changelog

`{ date, text }[]`，Default `[]`。按时间倒序展示在更新日志组件。Client-visible。

## app/app.config.ts（UI 覆盖，全部 Optional）

类型为 `ClarityUiConfig`（`clarity-theme/config`）。所有字段均可按需覆盖：

| 分组 | 字段 |
| --- | --- |
| `component.alert` | `defaultStyle: 'card' \| 'flat'` |
| `component.codeblock` | `triggerRows` / `collapsedRows` / `enableIndentGuide` / `indent` / `tabSize` |
| `component.excerpt` | `animation` / `caret` |
| `component.slide` | `showTitle` |
| `component.stats` | `birthYear?`（归档页年龄） |
| `header` | `logo`（默认取 `site.author.avatar`）/ `showTitle` / `subtitle`（默认取 `site.subtitle`）/ `emojiTail` |
| `nav` / `footer.nav` | `NavGroup[]`（`{ title, items }`） |
| `footer` | `copyright`（支持内联 HTML）/ `iconNav` |
| `link` | `remindNoFeed` / `randomInGroup` |
| `pagination` | `perPage` / `sortOrder`（须为 `article.order` 键）/ `allowAscending` |
| `themes` | light / system / dark 的 `icon` / `tip` |

## Consumer 必须自行提供的文件（Theme 永不携带）

| 文件 | 说明 |
| --- | --- |
| `clarity.config.ts` | 站点配置 |
| `content.config.ts` | 调用 `createClarityContentConfig(clarityConfig)` |
| `feeds.ts`（经 `#clarity/feeds` 注入） | 友链数据，类型 `FeedGroup[]`（`clarity-theme/config`） |
| `content/` | 文章内容 |

## 注入点与内部虚拟模块

| 标识 | 方向 | 说明 |
| --- | --- | --- |
| `#clarity/config` | Consumer → Theme | 指向消费者 clarity 配置模块的构建期 alias；该模块通常已由 `defineClarityConfig()` 返回完整配置，但 alias 本身不是独立公共 API |
| `#clarity/feeds` | Consumer → Theme | 友链数据 |

## 模块选项（nuxt.config.ts）

| 选项 | 类型 | Default | 说明 |
| --- | --- | --- | --- |
| `clarityConfig.configFile` | string | 自动发现（相对 rootDir 依次查找 `clarity.config.ts` → `clarity.config.mjs` → `clarity.config.js`） | 消费项目中 clarity 配置文件路径 |

友链数据按相同顺序自动发现 `feeds.ts` → `feeds.mjs` → `feeds.js`；
未找到时回退 Theme 内置空数据并输出 WARN（友链页与 OPML 输出空列表）。

## 版式约定

- 未在此文档中列出的字段**不属于公共 API**，升级时可能变更（semver：minor 内新增、major 才移除/改名）
- `FeedEntry` / `FeedGroup` 是友链数据的公共类型契约
