# 手动安装

[English](./manual-installation.md) | **简体中文**

当你想把手动的 Clarity 接入现有 Nuxt 项目——而不是迁移 blog-v3 站点（那请看[从 blog-v3 迁移](./migration-from-blog-v3.zh-CN.md)）或使用[创建器 CLI](./new-project.zh-CN.md)——请按本文操作。

## 1. 安装包

```bash
pnpm add clarity-theme
```

Clarity 属于应用运行时——Nuxt 构建与静态生成会直接加载 Layer——因此请安装为常规依赖，而不是开发依赖。

如需使用未发布的 commit、本地调试，或在发布前审查某个具体变更，可以直接从 GitHub 安装：

```bash
pnpm add github:iicemeta/clarity-theme#<commit>
```

该方式仅用于开发场景。正式站点应使用已发布的 npm 版本，以保证安装可复现并被发布验证矩阵覆盖。

## 2. 继承 Layer

```ts
// nuxt.config.ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
})
```

请把你自己的 `routeRules`、重定向、`runtimeConfig`、自定义模块、插件与部署设置留在这个文件里。Layer 已经提供其模块、Markdown 管线、样式、颜色模式、SEO 默认值与功能路由规则；重复配置会产生不稳定的合并。

## 3. 定义站点配置

```ts
// clarity.config.ts
import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: 'My Blog',
		description: 'Notes about technology and life',
		url: 'https://example.com/',
		author: {
			name: 'My Name',
			avatar: '/avatar.webp',
		},
	},
})
```

`site.title`、`site.description`、`site.url` 与 `site.author.name` 为必填项。article、feed、stats、integration、feature 与 changelog 分组均为可选，并使用文档中记载的默认值——见[配置](../guides/configuration.zh-CN.md)。

如果配置文件不在根目录，用模块选项指向它：

```ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
	clarityConfig: { configFile: 'config/clarity.config.ts' },
})
```

## 4. 创建 Content schema

```ts
// content.config.ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

文章放在 `content/posts/` 下，其他 Content 页面放在 `content/` 下。文章 schema 与固定链接行为见[内容](../guides/content.zh-CN.md)。

## 5. 可选：提供友链数据

```ts
// feeds.ts
import type { FeedGroup } from 'clarity-theme/config'

const feeds: FeedGroup[] = []

export default feeds
```

没有该文件时，友链页面与 OPML 输出使用空数据，并在构建时输出 WARN。

## 6. 开发与部署

```bash
pnpm dev
pnpm generate
```

配置职责速览：

| 文件 | 职责 |
| --- | --- |
| `clarity.config.ts` | 站点标识、文章语义、订阅、统计、集成、功能开关、更新日志 |
| `app/app.config.ts` | 仅可选的响应式 UI 覆盖 |
| `content.config.ts` | Nuxt Content 集合/schema |
| `feeds.ts` | 可选友链数据 |
| 消费方 `runtimeConfig` | 环境相关值；密钥唯一合法存放位置 |

不要把 token 或私有部署凭据放进 `clarity.config.ts` 或 `app/app.config.ts`；两者都可能影响生成的客户端输出。
