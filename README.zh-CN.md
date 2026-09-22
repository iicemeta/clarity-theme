# Clarity Theme

[English](./README.md) | **简体中文**

Clarity Theme 是一个从 [L33Z22L11/blog-v3](https://github.com/L33Z22L11/blog-v3) 抽取出来的可复用 **Nuxt 4 Layer 博客主题**。它提供通用的博客 UI、页面结构、Markdown/MDC 渲染、SEO 集成以及 feed/服务端输出；你的项目只需要提供全部站点数据与内容。

## 功能特性

- 通过一条 `extends` 配置即可完成 Nuxt 4 Layer 安装
- 带默认值校验的站点配置，并严格拒绝未知字段
- 用于文章元数据与站点地图数据的 Nuxt Content 集合工厂
- Markdown、MDC 组件、Shiki 代码高亮、KaTeX、Mermaid、ABC 乐谱与富图片
- 文章列表、归档、分页、目录（TOC）、搜索、主题切换、小部件、预览与 404 路由
- Atom、OPML、统计、robots、sitemap 与 LLMs 输出
- 由使用方配置驱动的 Twikoo、head 脚本与反镜像集成
- UI 默认值、app config 覆盖、自定义 Shiki 主题与同路径组件覆盖
- 自动化的 workspace、tarball 消费者、SSR、浏览器、水合、纯度、契约、peer 与上游同步检查

## 环境要求

| 运行时 | 版本 |
| --- | --- |
| Node.js | `^22.19 \|\| ^24.11 \|\| >=26` |
| pnpm | 12.4.1，或适用于你项目的兼容包管理器 |
| Nuxt peer | `^4.5.2` |
| Vue peer | `^3.5.42` |

Clarity 已通过 npm 注册表以 `clarity-theme` 分发。它属于应用运行时的一部分（Nuxt 构建与静态生成会直接加载 Layer），因此请将其安装为常规依赖（dependency），而不是开发依赖（devDependency）；生产环境安装也必须能解析到它。

## 安装

```bash
pnpm add clarity-theme
```

### Git commit 安装（开发回退方式）

如需使用未发布的 commit、本地调试，或在发布前审查某个具体变更，可以直接从 GitHub 安装：

```bash
pnpm add github:iicemeta/clarity-theme#<commit>
```

该方式仅用于开发场景。正式站点应使用已发布的 npm 版本，以保证安装可复现并被发布验证矩阵覆盖。

## 快速开始

### 1. 继承 Layer

```ts
// nuxt.config.ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
})
```

### 2. 定义站点配置

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

`site.title`、`site.description`、`site.url` 与 `site.author.name` 为必填项。article、feed、stats、integration、feature 与 changelog 分组均为可选，并使用文档中记载的默认值。

### 3. 创建 Content schema

```ts
// content.config.ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

文章放在 `content/posts/` 下，其他 Content 页面放在 `content/` 下。

### 4. 可选：提供友链数据

```ts
// feeds.ts
import type { FeedGroup } from 'clarity-theme/config'

const feeds: FeedGroup[] = []

export default feeds
```

如果没有这个文件，友链页面和 OPML 输出会使用空数据，并且构建时会记录一条警告。

### 5. 生成或开发

```bash
pnpm dev
pnpm generate
```

从现有 blog-v3 项目完整迁移的操作流程，见[迁移指南](./docs/MIGRATION.zh-CN.md)。主题数据与用户内容是被刻意分开的：这个包永远不会携带你的文章、友链、重定向、部署配置或包补丁。

## 从 blog-v3 迁移

完整的人工迁移指南见[迁移指南](./docs/MIGRATION.zh-CN.md)。如果你希望让当前 Agent 使用 `migrate-blog-v3-to-clarity` Skill 自动执行迁移，可以直接使用下面的提示词：

```markdown
请使用 `migrate-blog-v3-to-clarity` Skill，把当前这个 blog-v3 项目迁移到 Clarity Theme。

要求：

1. 先只读扫描项目，不立即修改。
2. 判断当前项目是否属于支持的 blog-v3 结构。
3. 检查 blog.config.ts、app/app.config.ts、content.config.ts、nuxt.config.ts、feeds.ts、redirects.json、patches、content、public、custom components、server、modules。
4. 生成迁移计划，并把所有风险项标出来。
5. 不修改文章正文和 frontmatter。
6. 不删除 content、public、redirects、patches 或未知自定义代码。
7. 能自动迁移的部分自动处理。
8. 需要人工判断的部分暂停修改并记录原因。
9. 迁移完成后执行 typecheck、generate 和兼容性验证。
10. 最后输出完整 migration report，包括修改文件、保留配置、人工处理项和测试结果。

整个过程只使用当前 Agent 串行执行，不启动并行 Agent。
```

## 基础配置

| 文件 | 职责 |
| --- | --- |
| `clarity.config.ts` | 站点身份、文章语义、友链、统计、集成、功能开关、更新日志 |
| `app/app.config.ts` | 仅限可选的响应式 UI 覆盖 |
| `content.config.ts` | Nuxt Content 集合/schema |
| `feeds.ts` | 可选的友链数据 |
| 使用方 `runtimeConfig` | 环境相关配置，以及唯一合法的密钥存放位置 |

逐字段的默认值、可见性与示例见[配置说明](./docs/CONFIGURATION.zh-CN.md)。

可选分组示例：

```ts
export default defineClarityConfig({
	site: {
		title: 'My Blog',
		description: 'A Nuxt blog',
		url: 'https://example.com/',
		author: { name: 'My Name' },
	},
	article: {
		defaultCategory: 'Uncategorized',
		categories: {
			Tech: { icon: 'tabler:code', color: '#7777ff' },
		},
		types: { tech: {}, story: {} },
	},
	feed: { limit: 50, enableStyle: true },
	features: {
		atom: true,
		opml: true,
		stats: true,
		antiMirror: false,
	},
})
```

绝不要把 token 或私有部署凭据放在 `clarity.config.ts` 或 `app/app.config.ts` 中；这两者都可能影响生成的客户端产物。

## 公共 API

| 入口 | API |
| --- | --- |
| `clarity-theme` | Nuxt Layer 根入口 |
| `clarity-theme/config` | `defineClarityConfig()` 与配置/schema 类型 |
| `clarity-theme/content` | `createClarityContentConfig()` 与 `ArticleSchema` |
| `clarity-theme/schema` | 全部 `clarity*` Zod schema 及派生类型 |
| `clarity-theme/img` | 头像/favicon/图片 URL 辅助函数 |

Layer 还暴露了 `useClarityConfig()`、`useClaritySite()`、`useClarityArticle()` 与 `useClaritySiteFeedEntry()` 运行时自动导入，以及 `#clarity/feeds` 注入。它们是 Layer 契约，而不是独立的包子路径。

确切的导出/类型边界记录在 [API 文档](./docs/API.zh-CN.md) 中。

## 自定义

### UI 配置

```ts
// app/app.config.ts
export default defineAppConfig({
	clarity: {
		header: { emojiTail: ['📝'] },
		pagination: { perPage: 10 },
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
	},
})
```

对象会深度合并；数组会整体替换主题的值。

### 组件

在使用方项目中创建同路径的 Layer 相对组件即可替换，例如：

```text
app/components/content/Badge.vue
```

使用方组件优先于 Layer 组件。Nuxt 目前会针对这种有意的覆盖模式输出重名警告。

### Shiki 主题

在使用方项目中提供 `app/shiki.config.ts`。只有当该文件不存在时，才会使用主题的回退配置。

UI 分组、同路径组件覆盖、CSS 覆盖、服务端/路由自定义与 Shiki 归属详见[自定义说明](./docs/CUSTOMIZATION.zh-CN.md)。

## 兼容性与验证

验证套件覆盖：

- Playground 静态生成
- 独立的 `pnpm pack` 消费者安装
- Node 与 TypeScript 中的五个包导出
- 三种配置分支
- Markdown/MDC/代码/数学公式/Mermaid/乐谱/图片渲染
- 生产 SSR、真实浏览器渲染与开发水合
- 搜索、分页、归档、TOC、SEO、robots、sitemap、LLMs、Atom、OPML、统计、固定链接、404、Twikoo 分支、反镜像注入、UI 覆盖与组件覆盖
- 主题纯度、peer 依赖、同步工具与上游漂移

生成的发布矩阵见[兼容性说明](./docs/COMPATIBILITY.zh-CN.md)。当前的精确数量、已知限制、技术债与发布阻塞项见[项目状态](./docs/PROJECT-STATUS.zh-CN.md)与[路线图](./docs/ROADMAP.zh-CN.md)。发布前必须在确切的 commit 上重新按顺序运行整套验证；早先的结果不能替代。

站点相关的依赖补丁刻意由使用方持有；见[补丁说明](./docs/PATCHES.zh-CN.md)。

## 文档

| 文档 | 用途 |
| --- | --- |
| [项目状态](./docs/PROJECT-STATUS.zh-CN.md) | 当前快照、已验证能力、限制、技术债、缺口与里程碑 |
| [路线图](./docs/ROADMAP.zh-CN.md) | 按优先级排序的 P0/P1/P2 技术债清单、延后决策与里程碑顺序 |
| [迁移指南](./docs/MIGRATION.zh-CN.md) | 在采用 Clarity 的同时保留 blog-v3 的内容、配置、重定向、补丁、自定义代码与资源 |
| [架构](./docs/ARCHITECTURE.zh-CN.md) | 主题/使用方边界与构建/运行时数据流 |
| [API](./docs/API.zh-CN.md) | 公共包/Layer API 与内部实现的边界 |
| [配置说明](./docs/CONFIGURATION.zh-CN.md) | 字段级 Clarity 配置契约与示例 |
| [自定义说明](./docs/CUSTOMIZATION.zh-CN.md) | UI、组件、Shiki、CSS、服务端与路由覆盖 |
| [兼容性说明](./docs/COMPATIBILITY.zh-CN.md) | 生成的发布兼容性矩阵 |
| [上游同步](./docs/UPSTREAM.zh-CN.md) | 基线、manifest、命令、冲突与工作流 |
| [补丁说明](./docs/PATCHES.zh-CN.md) | 使用方补丁归属与当前结论 |
| [发布审计](./docs/RELEASE-AUDIT.zh-CN.md) | 收尾前工程审计与剩余发布门槛 |
| [发布清单](./docs/RELEASE-CHECKLIST.zh-CN.md) | 确切的最终检查、剩余阻塞项与验证证据 |
| [发布指南](./docs/PUBLISHING.zh-CN.md) | 版本管理、tag、GitHub Release、OIDC 发布、provenance 与回滚策略 |
| [更新日志](./CHANGELOG.md) | 面向使用者的发布历史 |
| [抽取历史](./docs/history/2026-09-layer-extraction.zh-CN.md) | 历史阶段与一次性差分验证 |

## 开发

```bash
pnpm install              # 主题 + playground workspace
pnpm dev                  # Playground 开发服务器
pnpm generate             # Playground 静态生成
pnpm lint
pnpm typecheck
pnpm verify               # 纯度/静态泄漏检查
pnpm peers check
pnpm test:sync
pnpm test:migration
pnpm test:contract
pnpm test:consumer
pnpm test:compatibility
```

CI 从包元数据推导 Node 与 pnpm 版本。它先在固定的 Node 矩阵上运行 lint/typecheck/verify/sync/migration/contract/peers，再在主 Node 版本上运行 playground 生成、真实消费者验收与渲染兼容性。另有一个每周工作流只检测并报告上游漂移。

确切的 CI 阶段与权限见[项目状态 → CI](./docs/PROJECT-STATUS.zh-CN.md#10-ci)。

## 上游同步

Clarity 从一个上游 Nuxt 博客抽取而来，并在 `sync-manifest.json` 中记录确切的已审查基线。同步工具区分可直接包含的路径、使用方持有的排除项、经过转换的主题契约与人工审查路径；未知的上游变更会阻止 apply。使用：

```bash
pnpm sync:check   # 比较 manifest 基线与远端
pnpm sync:diff    # 对上游变更分类
pnpm sync:apply   # 事务式应用已审查的 include-only 变更
pnpm sync:verify  # 重新运行主题纯度与基线检查
```

每周工作流只检测并报告漂移，绝不会 apply、commit 或 push 变更。见[上游同步](./docs/UPSTREAM.zh-CN.md)。

## 发布状态

Clarity Theme 是一个 **v0.1.0 npm 发布候选版本**。Layer/包边界、已校验配置、Content 工厂、渲染管线、服务端输出、playground、真实消费者验收、兼容性矩阵、三层 CI、上游同步基线、发布门禁与 OIDC 发布工作流均已实现。剩余的人工发布步骤见[发布检查清单](./docs/RELEASE-CHECKLIST.zh-CN.md)。

[路线图](./docs/ROADMAP.zh-CN.md)中的 v0.1.0 正确性门禁已解决：服务端/客户端配置已拆分、功能关闭路由在运行时返回 404、反镜像导航已在真实浏览器中验证、no-op 随机固定链接字段已移除，多模式统计已增加回归测试。其余推迟事项记录在路线图与发布说明中。

## 许可证

主题代码采用 MIT 许可证。上游博客的文章不包含在本包中。
