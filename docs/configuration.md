# Clarity Theme 配置契约（v0.1）

本文是 Theme 对 Consumer 暴露的全部配置面。字段标记含义：

- **Required**：Consumer 必须提供，缺省时 `defineClarityConfig()` 校验失败
- **Optional**：可省略
- **Default**：省略时 Theme 的默认值
- **Client-visible**：该值会进入客户端 bundle，**禁止存放任何密钥 / token**
- **Server-only**：仅在服务端（Nitro）使用

配置入口只有两个：

| 文件 | 作用 | 校验 |
| --- | --- | --- |
| `clarity.config.ts` | 站点 / 内容 / 功能配置（`defineClarityConfig`） | zod schema（`clarity-theme/schema`） |
| `app/app.config.ts` | UI 覆盖（`defineAppConfig({ clarity: ... })`） | TypeScript（`CustomAppConfig` 合并） |

## clarity.config.ts

### site

| 字段 | 类型 | 约束 | Client-visible |
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
| `author.email` | string | Optional（进入 RSS / OPML） | ✅ |
| `author.homepage` | string | Optional | ✅ |
| `copyright` | `{ abbr?, name?, url? }` | Optional | ✅ |

### article

| 字段 | 类型 | 约束 / Default | Client-visible |
| --- | --- | --- | --- |
| `defaultCategory` | string | Default `'未分类'` | ✅ |
| `categories` | `Record<string, { icon?, color? }>` | Default `{}` | ✅ |
| `types` | `Record<string, object>` | Default `{ tech: {} }`；**至少一项**（为空时 Content Schema 兜底回退 `tech`，但应显式配置） | ✅ |
| `order` | `Record<string, string>`（排序字段 → 显示名） | Default `{ date: '创建日期', updated: '更新日期' }` | ✅ |
| `useRandomPermalink` | boolean | Default `false` | ✅ |
| `hidePostPrefix` | boolean | Default `true` | ✅ |
| `robotsNotIndex` | string[] | Default `[]` | ✅ |

`types` 的**第一个键是默认文章版式**；`ui.pagination.sortOrder` 必须是 `order` 的键名。

### feed

| 字段 | 类型 | 约束 / Default | 可见性 |
| --- | --- | --- | --- |
| `limit` | number | 正整数，Default `50` | Server-only（RSS 生成） |
| `enableStyle` | boolean | Default `true`（XSLT 样式页） | Server-only |

### stats

| 字段 | 类型 | 约束 / Default | 可见性 |
| --- | --- | --- | --- |
| `includePaths` | string[] | Default `[]`（统计全部内容）；SQL LIKE 语法（`%` / `_`），匹配 `content/` 下不含扩展名的路径 | ✅（归档页年龄计算等） |

### integrations

⚠️ **本节全部 Client-visible，禁止存放真正秘密。** 密钥应放 `nuxt.config.ts` 的 `runtimeConfig`（server-only）。

| 字段 | 类型 | 约束 / Default | Client-visible |
| --- | --- | --- | --- |
| `twikoo.envId` | string | Optional；配置后渲染评论区 | ✅ |
| `twikoo.preload` | string | Optional，默认使用 `envId` | ✅ |
| `scripts` | `Record<string, string\|number\|boolean>[]` | Default `[]`，注入 `<head>` 的第三方脚本参数 | ✅ |

### features

| 字段 | 类型 | 约束 / Default | 可见性 |
| --- | --- | --- | --- |
| `atom` | boolean | Default `true`，`/atom.xml` | Server-only |
| `opml` | boolean | Default `true`，`/subscriptions.opml` | Server-only |
| `stats` | boolean | Default `true`，统计 API 与归档页 | 均有 |
| `antiMirror` | `boolean \| { blacklist: string[] }` | Default `false`；`true` = 空黑名单模式 | ✅（客户端反镜像脚本） |

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
| `#clarity/config` | Consumer → Theme | 解析并校验后的完整配置 |
| `#clarity/feeds` | Consumer → Theme | 友链数据 |

## 版式约定

- 未在此文档中列出的字段**不属于公共 API**，升级时可能变更（semver：minor 内新增、major 才移除/改名）
- `FeedEntry` / `FeedGroup` 是友链数据的公共类型契约
