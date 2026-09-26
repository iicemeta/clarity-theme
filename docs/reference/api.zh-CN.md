# 公共 API

[English](./api.md) | **简体中文**

本文档将稳定的包/Layer 契约与内部实现区分开。当源代码、消费者测试与文字描述不一致时，以源代码和消费者测试为准。

## API 稳定性模型

### 公共包 API

由 `package.json` `exports` 显式声明的入口。它们计划遵循语义化版本。

### 公共 Layer 契约

通过 `extends: ['clarity-theme']` 获得的行为、有文档记载的配置文件、受支持的别名、HTTP 路由以及有文档记载的组件覆盖机制。这些不一定拥有独立的 ESM 子路径。

### 内部实现

组件的私有 props、普通 composables、工具函数、模块内部结构、生成模板与源码布局。除非有文档记载的功能契约依赖它们，否则这些内容可以在不升级主版本的情况下变更。

## 包导出

| 导入 | 条件 | 运行时/类型目标 | 公共导出 |
| --- | --- | --- | --- |
| `clarity-theme` | default | `./nuxt.config.ts` | Nuxt Layer 根配置 |
| `clarity-theme/config` | types / default | `src/config/index.d.mts` / `src/config/index.mjs` | `defineClarityConfig`、下文列出的全部 Zod schema 与配置类型 |
| `clarity-theme/content` | types / default | `src/config/content.d.mts` / `src/config/content.mjs` | `createClarityContentConfig`、`ArticleSchema` 类型 |
| `clarity-theme/img` | types / default | `src/img/index.d.mts` / `src/img/index.mjs` | 图片/头像/favicon 辅助函数与枚举/常量 |
| `clarity-theme/schema` | types / default | `src/config/schema.d.mts` / `src/config/schema.mjs` | 全部 `clarity*` Zod schema 与由 schema 派生的类型 |

根导出是 Nuxt Layer 入口，不是通用的 JavaScript 工具模块。

## `clarity-theme/config`

### 运行时函数

```ts
function defineClarityConfig(config: ClarityConfigInput): ClarityConfig
```

它会立即解析、应用默认值，并在字段无效或未知时抛出带字段路径的错误。

### 类型

通过 TypeScript 入口提供：

- `ClarityConfig`
- `ClarityConfigInput`
- `ClarityUiConfig`
- `ClarityPublicIntegrationsConfig`
- `FeedEntry`
- `FeedGroup`
- `Arch`
- `Nav`
- `NavItem`
- `NavGroup`
- `clarity-theme/schema` 下列出的全部 schema 派生类型

`.mjs` 入口刻意只导出运行时值；仅类型名称在运行时按常规消失。

## `clarity-theme/schema`

### 运行时 schema

- `clarityConfigSchema`
- `claritySiteSchema`
- `clarityArticleSchema`
- `clarityFeedSchema`
- `clarityStatsSchema`
- `clarityIntegrationsSchema`
- `clarityFeaturesSchema`
- `clarityAntiMirrorSchema`
- `clarityAuthorSchema`
- `clarityChangelogEntrySchema`
- `clarityHeadScriptSchema`

### 类型

- `ClarityConfig`
- `ClarityConfigInput`
- `ClaritySiteConfig`
- `ClarityArticleConfig`
- `ClarityFeedConfig`
- `ClarityStatsConfig`
- `ClarityIntegrationsConfig`
- `ClarityFeaturesConfig`
- `ClarityAntiMirrorConfig`
- `ClarityAuthor`
- `ClarityChangelogEntry`
- `ClarityHeadScript`

除 `article.types` 的值仍是可扩展布局的 record 之外，schema 均使用 strict 对象。

## `clarity-theme/content`

```ts
function createClarityContentConfig(config: ClarityConfig): ReturnType<typeof defineContentConfig>
```

它会重新解析传入的配置，并使用文章与站点地图 schema 创建 `content` 集合。纯 Node 冒烟测试只能验证导入/函数形态，因为完整 schema 创建依赖 Nuxt Content 模块上下文；真实生成由消费者测试覆盖。

`ArticleSchema` 描述：

- `title`、`description`
- `date`、`updated`、`published`
- `categories`、`tags`、`type`
- `image`、`recommend`
- `references`
- `draft`、`permalink`
- `readingTime`

categories/tags/type/draft 的默认值来自解析后的配置与 Content schema。

## `clarity-theme/img`

### 函数

| 导出 | 用途 |
| --- | --- |
| `getWsrvGhAvatar(name, options?)` | 通过 wsrv 的 GitHub 头像 URL |
| `getGithubAvatar(name, options?)` | 通过 webp.se 服务的 GitHub 头像 URL |
| `getGithubIcon(name)` | 圆形小号 GitHub 图标 URL |
| `getOicqAvatar(qq, size?)` | QQ 头像 URL |
| `getOciqGroupAvatar(group, size?)` | QQ 群头像 URL |
| `getFavicon(domain, options?)` | Google/静态或 webp.se favicon URL |
| `getImgUrl(src, service?)` | 为来源添加配置的图片代理前缀，或原样返回 |

### 常量与类型

- `OicqAvatarSize`
- `QgroupAvatarSize`
- `ImgService`

这些辅助函数只构建 URL，本身不抓取、缓存、转换或代理图片。它们依赖第三方公共服务，没有备用传输通道。

## Layer 运行时 API

消费者组件受支持的读取路径是经 Nuxt `useAppConfig()` 的上游形状扁平 app config——`title`、`nav`、`component.*`、`footer`、`header`、`pagination`、`themes` 等。全部 Theme 组件都使用这一形状，消费者组件也应使用它。

0.1.x 的 `useClarityConfig()`、`useClaritySite()`、`useClarityArticle()`、`useClaritySiteFeedEntry()`（读取已删除的嵌套 `clarity` app-config 键）**已在 0.2.0 移除**：不再自动导入，包内也不再存在。旧 API 到新 API 的对照见 [legacy 政策](../maintainers/legacy-policy.zh-CN.md)。

Theme 服务端路由使用内部 `useClarityServerConfig()` 助手，从 Nitro 私有 runtimeConfig 读取完整 site/feed/stats 配置与 feature 路由开关。它不会进入客户端 bundle，也不是公开的包导出。

## 公共 HTTP 功能

启用后，Layer 会暴露以下静态/服务端输出：

| 路由 | 输出 |
| --- | --- |
| `GET /atom.xml` | Atom feed |
| `GET /subscriptions.opml` | OPML 订阅 |
| `GET /api/stats` | 文章数、字数、年度/分类/标签统计 |

生成的 SEO 输出还包括通过配置的 Nuxt 模块产出的 `/robots.txt`、`/sitemap.xml` 与 `/llms.txt`。关闭 `features.atom` / `opml` / `stats` 会移除预渲染与 head 接线，**并且**使路由在 dev/SSR 运行时返回 404。

完整的公共页面与输出清单见[路由与输出](./routes-and-outputs.zh-CN.md)。

## 配置入口

### 使用方文件

- `clarity.config.ts` —— 公共站点/功能契约
- `app/app.config.ts` —— 可选 UI 覆盖
- `content.config.ts` —— Content 工厂调用
- `feeds.ts` —— 可选友链数据

### 模块选项

```ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
	clarityConfig: {
		configFile: 'clarity.config.ts',
	},
})
```

`configFile` 相对于使用方根目录，并覆盖自动发现。

### 受支持的注入

- `#clarity/feeds` 解析使用方的友链数据模块。

### 内部别名

- `#clarity/config` 目前为构建接线解析使用方配置模块。它不是序列化的已解析配置服务，不应被视为稳定的公共导入。

## 内部实现

以下内容刻意不作为公共 ESM API：

- `src/modules/clarity-config` 内部结构
- 全部普通 `src/composables/*`（消费者组件改读 `useAppConfig()`）
- `src/stores/*`、内部工具函数与生成的类型模板
- 单个组件的 props/样式，除非被有文档记载的渲染契约覆盖
- remark 插件实例；Nuxt Layer 配置在内部加载它们
- `src/shared/utils/*` 辅助函数，除非被某个包入口重新导出或通过有文档记载的功能使用

包中包含这些源文件是为了 Nuxt Layer 编译；tarball 中包含某个文件并不意味着其中每个符号都是公共 API。
