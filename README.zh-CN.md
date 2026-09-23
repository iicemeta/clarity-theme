# Clarity Theme

[![CI](https://github.com/iicemeta/clarity-theme/actions/workflows/ci.yml/badge.svg)](https://github.com/iicemeta/clarity-theme/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/clarity-theme)](https://www.npmjs.com/package/clarity-theme)
[![License: MIT](https://img.shields.io/npm/l/clarity-theme)](./LICENSE)

[English](./README.md) | **简体中文**

Clarity Theme 是一个从 [L33Z22L11/blog-v3](https://github.com/L33Z22L11/blog-v3) 抽取出来的可复用 **Nuxt 4 Layer 博客主题**。它提供通用的博客 UI、页面结构、Markdown/MDC 渲染、SEO 集成以及 feed/服务端输出；你的项目只需要提供全部站点数据与内容。

## 为什么选择 Clarity？

Clarity 取代传统的 sync fork 工作流。你不需要把上游数千行代码合并进博客仓库，而是以 Layer 方式消费主题，只维护自己的文件：

- **一条 `extends` 配置**即可安装完整的博客应用骨架
- **Theme 与 Consumer 分离**：文章、友链、重定向、部署配置、密钥与依赖补丁永远不会进入主题包
- **配置带校验**：`clarity.config.ts` 由 schema 校验，提供默认值并严格拒绝未知字段
- **Content 工厂**：Nuxt Content 集合与文章 schema 由你的配置派生
- **富渲染**：Markdown、MDC 组件、Shiki 代码高亮、KaTeX、Mermaid、ABC 乐谱与富图片
- **完整输出**：文章列表、归档、分页、目录（TOC）、搜索、主题切换、小部件、Atom、OPML、统计、robots、sitemap 与 LLMs
- **集成仍归你所有**：Twikoo、head 脚本与反镜像均由消费方配置驱动
- **覆盖而无需 fork**：UI app config 覆盖、同路径组件覆盖、自定义 Shiki 主题与消费方 CSS

## 选择你的路径

| 起点 | 文档 |
| --- | --- |
| 新博客 | [创建项目](./docs/getting-started/new-project.zh-CN.md) |
| 现有 blog-v3 站点 | [从 blog-v3 迁移](./docs/getting-started/migration-from-blog-v3.zh-CN.md) · Agent Skill：`migrate-blog-v3-to-clarity` |
| 手动接入现有 Nuxt 应用 | [手动安装](./docs/getting-started/manual-installation.zh-CN.md) |

如需 Agent 协助迁移，直接让你的 Agent 使用 `migrate-blog-v3-to-clarity` Skill。完整 Skill 位于 [`skills/migrate-blog-v3-to-clarity`](./skills/migrate-blog-v3-to-clarity/SKILL.md)。

## 快速开始

```bash
pnpm create clarity-theme@beta my-blog
cd my-blog
pnpm dev
```

创建器会显示可编辑的站点默认值并自动检测系统时区；生成的项目自带
`pnpm new-blog` 写作命令。

创建包以独立的 `create-clarity-theme` npm 包分发；当前初始预发布位于 `@beta` dist-tag。完整参数见 [`create-clarity-theme/README.md`](./create-clarity-theme/README.md)。手动接入只需四个文件：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
})
```

```ts
// clarity.config.ts
import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: 'My Blog',
		description: 'Notes about technology and life',
		url: 'https://example.com/',
		author: { name: 'My Name', avatar: '/avatar.webp' },
	},
})
```

```ts
// content.config.ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

```bash
pnpm add clarity-theme
pnpm dev
```

文章放在 `content/posts/` 下，其他 Content 页面放在 `content/` 下。可选的 `feeds.ts` 友链数据与部署说明见[手动安装](./docs/getting-started/manual-installation.zh-CN.md)。

## 环境要求

| 运行时 | 版本 |
| --- | --- |
| Node.js | `^22.19 \|\| ^24.11 \|\| >=26` |
| pnpm | 12.4.1，或适用于你项目的兼容包管理器 |
| Nuxt peer | `^4.5.2` |
| Vue peer | `^3.5.42` |

Clarity 属于应用运行时的一部分（Nuxt 构建与静态生成会直接加载 Layer），因此请将其安装为常规依赖，而不是开发依赖。

## 文档

所有文档都有对应的简体中文版本（同名 `*.zh-CN.md` 文件）。入口见[文档索引](./docs/README.zh-CN.md)：

- **入门** — [创建新项目](./docs/getting-started/new-project.zh-CN.md)、[手动安装](./docs/getting-started/manual-installation.zh-CN.md)、[从 blog-v3 迁移](./docs/getting-started/migration-from-blog-v3.zh-CN.md)
- **指南** — [配置](./docs/guides/configuration.zh-CN.md)、[内容](./docs/guides/content.zh-CN.md)、[自定义](./docs/guides/customization.zh-CN.md)、[集成](./docs/guides/integrations.zh-CN.md)
- **参考** — [公共 API](./docs/reference/api.zh-CN.md)、[路由与输出](./docs/reference/routes-and-outputs.zh-CN.md)、[兼容性矩阵](./docs/reference/compatibility.zh-CN.md)
- **概念** — [架构](./docs/concepts/architecture.zh-CN.md)
- **维护者** — [开发](./docs/maintainers/development.zh-CN.md)、[测试](./docs/maintainers/testing.zh-CN.md)、[上游同步](./docs/maintainers/upstream-sync.zh-CN.md)、[补丁](./docs/maintainers/patches.zh-CN.md)、[发布](./docs/maintainers/publishing.zh-CN.md)、[发布清单](./docs/maintainers/release-checklist.zh-CN.md)、[项目状态](./docs/maintainers/project-status.zh-CN.md)、[路线图](./docs/maintainers/roadmap.zh-CN.md)、[文档规则](./docs/maintainers/documentation.zh-CN.md)
- **发布历史** — [CHANGELOG](./CHANGELOG.md)；历史记录位于 [docs/history](./docs/history/)

## 开发

```bash
pnpm install        # Theme + playground workspace
pnpm dev            # Playground dev server
pnpm generate       # Playground static generation
pnpm lint           # ESLint + Stylelint
pnpm typecheck
```

完整验证矩阵、上游同步与发布流程见[开发](./docs/maintainers/development.zh-CN.md)与[测试](./docs/maintainers/testing.zh-CN.md)。

## 许可证

主题代码为 MIT。上游博客的文章不包含在本包中。
