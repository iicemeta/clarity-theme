# 架构

[English](./ARCHITECTURE.md) | **简体中文**

本文档描述当前实现。它从属于源代码与测试。

## 1. 主题 / 使用方边界

```text
clarity-theme (Nuxt Layer package)
├── nuxt.config.ts         Layer capabilities and module integration
├── modules/clarity-config Consumer config discovery/injection
├── app/                   UI, pages, components, stores, composables
├── config/                Public config/content/schema API
├── img/                   Pure image helper export
├── remark-plugins/        Content pipeline plugins
├── server/                Atom/OPML/stats routes
├── shared/                Shared types and utilities
└── public/                Generic feed style and font assets

consumer blog
├── nuxt.config.ts         extends clarity-theme; deployment/site rules
├── clarity.config.ts      site and feature contract
├── content.config.ts      Theme content factory call
├── content/               articles and pages
├── feeds.ts               optional friend data
└── app/app.config.ts      optional UI override
```

主题提供通用行为。使用方提供全部站点相关数据，并继续对密钥、部署、重定向与补丁负责。

## 2. 目录归属

| 目录 | 职责 | 是否入包 | 环境 | 上游同步关系 |
| --- | --- | --- | --- | --- |
| `app/` | UI、页面、布局、组件、composables、stores、plugins、样式、类型、工具 | 是 | 主题运行时 | 大多数列出的子路径为 `include`；若干文件经过适配，`app/types/**`、`app/stores/**` 与 `app/utils/**` 未被显式分类 |
| `config/` | 公共 config/content/schema API 与 TS/MJS 双轨 | 是 | 构建/消费者 API | 主题派生的契约层；根 transform 文件促成了这次替换 |
| `img/` | 公共纯图片辅助导出 | 是 | 消费者 API | 主题持有的包导出，包装 `app/utils/img.ts` 类型 |
| `modules/` | `clarity-config` 构建桥与反镜像客户端 | 是 | Nuxt 构建 | `modules/**` 为 `include`，但上游反镜像模块已被主题配置模块替换 |
| `remark-plugins/` | Markdown AST 转换 | 是 | Content 构建 | 上游派生的 `.ts` 加上 `include` 下的主题 `.mjs`/`.d.mts` 运行时轨 |
| `server/` | Atom、OPML 与统计的 Nitro handler | 是 | SSR/静态生成 | 上游派生并适配；`server/**` 为 `include` |
| `shared/` | Content 行类型与跨边界工具 | 是 | 主题运行时/服务端 | 上游派生加主题新增；`shared/**` 为 `include` |
| `public/` | 通用 Atom XSL/CSS 与内置字体 | 是 | 静态资源 | `public/assets/**` 与 `public/fonts/**` 为 `include` |
| `playground/` | 最小 workspace 消费者与兼容性夹具 | 否 | 开发 | 主题持有；不打入包中 |
| `scripts/` | 验证、消费者/兼容性测试装置、同步工具 | 否 | 开发/测试 | 主题持有；上游 `scripts/**` 被排除 |
| `tests/` | 同步回归套件 | 否 | 测试 | 主题持有；未针对未来上游路径显式分类 |
| `docs/` | 用户与维护文档 | 否 | 开发 | 主题持有；未针对未来上游路径显式分类 |

根级包/Layer 元数据、workspace 配置、质量配置、CI、许可证与同步 manifest 在[上游同步](./UPSTREAM.zh-CN.md)中有各自的包或 manifest 处理说明。

## 3. Layer 模型

### 包/Layer 根

`clarity-theme` 解析到 `nuxt.config.ts`。该配置：

- 注册 Content、SEO、图片、图标、色彩模式、Pinia、VueUse、Bikariya、LLMs 以及本地 clarity-config 模块。
- 为 Layer CSS、组件目录、图标、模块与 SCSS 变量使用包内绝对路径。
- 通过指向 `.mjs` 运行时实现的 `file://` URL 配置 Markdown remark/rehype 插件。
- 设置运行时构建元数据、预渲染平台行为、Vite 优化、图片密度/格式、链接检查器行为，并禁用 OG 图片生成。

### 构建期模块

`modules/clarity-config` 在 `nuxt-llms` 之前运行。它发现并校验使用方文件，注入别名与 appConfig，派生 SEO/head/路由规则，并注册主题 Pinia store 与 Shiki 回退。

### 运行时应用

`app/` 包含布局、页面、全局/content/partial/post/widget/popover 组件、composables、stores、plugins、样式与类型。Nuxt 自动导入在被扩展的应用内生效。

### 服务端

`server/` 包含三个 Nitro 路由：

- `GET /atom.xml`
- `GET /subscriptions.opml`
- `GET /api/stats`

它们查询 Content 集合，并通过 Nitro 私有 runtime 配置（`useClarityServerConfig()`）读取站点/feed/统计配置与 feature 路由开关；禁用的功能在运行时返回 404。

### 仅开发/测试的表面

`playground/`、`scripts/`、`tests/`、`docs/` 与 `.github/` 不打入包中。它们验证 Layer，但不会成为使用方的运行时依赖。

## 4. 配置流

1. 使用方在 `clarity.config.ts` 中调用 `defineClarityConfig()`。
2. Zod schema 填充默认值，并立即拒绝未知/无效字段。
3. `modules/clarity-config` 发现 `clarity.config.ts` / `.mjs` / `.js`，用 jiti 加载，并在依赖它之前进行第二次解析。
4. 模块映射解析后的数据：
   - `toPublicClarityConfig()`（客户端子集）加上派生的 header/footer 默认值进入 appConfig。
   - `toServerClarityConfig()` 进入 Nitro 私有 runtime 配置，供服务端 handler 与 feature 路由守卫使用。
   - 站点 title/URL/language 映射到 `nuxt.options.site`。
   - `article.robotsNotIndex` 映射到 robots disallow 规则。
   - 站点域名/标题/描述映射到 `nuxt-llms`。
   - 作者/favicon/alternate/preconnect/scripts/标题模板映射到 head。
   - 主题/使用方/Nuxt/Vue 包版本映射到公共运行时配置。
   - stats/Atom/OPML 功能开关映射到预渲染路由规则。
5. 一个 `content:file:afterParse` 钩子应用 frontmatter `permalink` 与可选的 `/posts` 前缀移除。
6. 反镜像在配置了黑名单时，会被序列化、压缩并注入为内联 head 脚本。

配置是严格的。`integrations.scripts` 被排除在 appConfig 之外并在构建期消费；`feed.*`、完整 `stats.*`、feature 路由开关、仅构建期 article 字段与 `site.author.email` 通过服务端专用 runtime 配置提供，不进入 appConfig。

## 5. App Config 流

主题的 `app/app.config.ts` 只提供 `clarity` 下的 UI 默认值：

- `component`
- `footer`
- `header`
- `link`
- `nav`
- `pagination`
- `themes`

Nuxt 将 app config 与使用方输入合并，且使用方输入优先于主题默认值；模块注入的由站点派生的默认值优先级更低。对象分支深度合并，数组整体替换。当使用方把站点级键放进 `app.config.ts` 时模块会发出警告，因为这些键可能覆盖从 `clarity.config.ts` 派生的值。

生成的 TypeScript 模板同时扩展 `CustomAppConfig` 的输入侧与读取侧，因此使用方覆盖可获得部分 UI 类型提示，而主题读取方保留解析后的完整形态。

## 6. Content 流

使用方的 `content.config.ts` 通常包含：

```ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

该工厂：

1. 通过 `clarityConfigSchema` 重新解析配置。
2. 构建文章字段：标题、描述、日期、分类、标签、类型、图片、推荐、引用、草稿、固定链接与阅读时长。
3. 使用配置的文章类型作为枚举，record 为空时回退到 `tech`。
4. 定义单个 `content` 集合，source 为 `**`，page 类型。
5. 用站点地图 URL/lastmod 元数据扩展 schema。

Markdown 处理由 Layer 配置：

- `remark-code-component` 将配置的 `mermaid` 与 `music-abc` 围栏代码块转换为组件 props。
- `remark-math` 加 `rehype-katex` 渲染公式。
- `remark-reading-time` 填充阅读元数据。
- `rehype-meta-slots` 将 `meta-*` 元素提取为可复用的 slot 树。
- Content 构建期刻意禁用 Shiki 高亮；主题 Prose 组件在运行时执行高亮。

## 7. Feed 流

### Atom

`server/routes/atom.xml.get.ts` 查询 `posts/%` 下的 Content 行，按更新日期排序，根据 `feed.limit` 截断，从 `site.url` 构建绝对 URL，并输出 Atom XML。`feed.enableStyle` 控制 XSLT 声明。

### 友链数据

模块将 `#clarity/feeds` 别名到使用方的 `feeds.ts` / `.mjs` / `.js`，或主题的空回退。友链页面通过该别名读取模块。

### OPML

`server/routes/subscriptions.opml.get.ts` 将站点自身的 feed 条目与展平后带 feed URL 的友链条目合并，输出 OPML 2.0。

## 8. 服务端路由 / 客户端边界

- 文章/列表/归档/页面渲染发生在 Vue SSR/客户端代码中。
- Atom、OPML 与统计是使用 `@nuxt/content/server` 的 Nitro handler。
- 统计直接查询 Content，并预渲染为 JSON。
- 公共运行时配置暴露构建环境与包版本。
- 真正的密钥必须保留在使用方 `runtimeConfig` 中；appConfig 与 `clarity.config.ts` 不是密钥存储。

服务端 handler 不再通过 appConfig 读取 feed/统计配置，这些字段不再进入客户端 payload。`site.author.email` 仍作为有意的公开元数据（HTML `author` meta 与 feed 输出），等待单独的可见性决策。

## 9. 注入别名

| 别名 | 指向 | 稳定性 |
| --- | --- | --- |
| `#clarity/feeds` | 使用方 feeds 模块或主题空回退 | Layer/服务端代码受支持的注入契约 |
| `#clarity/config` | 使用方 clarity 配置模块路径 | 内部构建别名 / 潜在的服务端安全配置来源；不是稳定的独立公共导出 |
| `~/shiki.config` | 存在时指向使用方文件；否则指向主题 `app/shiki.config.ts` | 受支持的回退机制 |

这些别名避免主题代码假设使用方的目录布局。

## 10. 组件覆盖机制

使用方可以在相同的 Layer 相对路径放置组件，例如 `app/components/content/Badge.vue`。使用方组件优先于 Layer 组件。这一点由 playground 与 tarball 消费者的 Badge 覆盖验证。

当前重复路径会刻意触发 Nuxt 警告 `NUXT_B3011`；这是警告噪音，不是覆盖失败。组件名称、内部 props 与视觉标记不是稳定的公共 API，除非作为功能契约的一部分被文档化。稳定的契约是覆盖行为与渲染出的功能输出。

## 11. 包导出与运行时双轨

`package.json` 暴露 Layer 根加四个辅助子路径。Node 加载的配置、schema、content、图片与 remark 插件代码使用 `.mjs` 运行时实现，因为不能依赖 `node_modules` 内文件的原生 TypeScript 剥离。`.d.mts` 文件重新导出 TypeScript 类型源。

这意味着若干契约刻意拥有成对实现：

- `config/schema.ts` 与 `config/schema.mjs`
- `config/define.ts` 与 `config/define.mjs`
- `config/content.ts` 与 `config/content.mjs`
- `img/index.ts` 与 `img/index.mjs`
- 每个 remark 插件的 `.ts` 类型源与 `.mjs` 运行时

它们必须保持行为同步。

## 12. 构建 / 运行时 / 使用方关系

- **构建期：** 配置解析/校验、appConfig 注入、别名、路由规则、SEO 接线、head 脚本、Content schema 生成与静态预渲染。
- **SSR 运行时：** Vue 页面/组件、Content payload 渲染、Nitro feed/统计 handler。
- **客户端运行时：** 水合、Shiki/Mermaid/ABC 渲染、搜索、色彩模式、弹窗/灯箱、Twikoo 挂载与交互组件。
- **使用方安装：** npm/Git 包解析带来声明的依赖与 Layer 文件；消费者项目不要求 playground workspace 行为。

静态生成目前会预渲染 playground 的 Content 页面、原始 content/payload 端点、feed/服务端输出、favicon 重定向输出、sitemap 支持文件与回退文档。

## 13. 上游同步边界

当前 Layer 派生自一个上游博客，但不是 git subtree 或子模块。`sync-manifest.json` 记录 commit 基线与路径分类。只有未修改的 `include` 路径可以快进。当前大多数 UI/服务端文件已经被适配，上游修改它们时会产生冲突。transform/manual 文件始终需要人工审查。

见[上游同步](./UPSTREAM.zh-CN.md)。
