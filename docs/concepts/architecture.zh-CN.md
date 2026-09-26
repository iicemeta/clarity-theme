# 架构

[English](./architecture.md) | **简体中文**

本文描述当前实现，以源码与测试为准。一次性审计与阶段叙事存放于 [docs/history](../history/)——那是历史记录，不是现行规范。

## 0. 管线总览

```text
Upstream blog-v3（事实来源，由 sync-manifest.json 钉住基线）
        ↓  sync / 机械适配
src/  （Layer 运行时源码；include 同步面冻结）
        ↓  应用 Layer 布局且不泄漏到消费项目
clarity-source-layout（Nuxt 模块）
        ↓  发现 consumer 配置，注入别名/appConfig/head/SEO
clarity-config（Nuxt 模块）
        ↓  extends: ['clarity-theme']
consumer 博客（clarity.config.ts、content/、feeds.ts、app.config、部署）
```

consumer 只看到一个 Layer。`sync-manifest.json` 与 consumer 契约之间的一切，都是为了让 upstream 派生文件在该 Layer 内不加改写地运行。

## 1. 源码分类

`src/` 下每个文件属于且仅属于一类。权威登记表：`sync-manifest.json`（include/transform/manual）、`tests/upstream-parity.manifest.json`（include 面逐文件分类）、`docs/maintainers/transform-parity.md`（`nuxt.config.ts` 派生面登记）：

| 分类 | 含义 | 示例 |
| --- | --- | --- |
| **SOURCE** | upstream 文件，EOL 归一后逐字一致（`identical`）或仅机械导入路径适配（`mechanical`）。禁止手改；漂移即 `pnpm test:upstream-parity` 失败。 | `src/components/`、`src/pages/`、`src/composables/`、`src/assets/` 的大多数 |
| **TRANSFORM** | 需要人工重设计为 Layer 形态的 upstream 文件；上游侧变更必须人工重放并重新登记。 | `nuxt.config.ts`、`src/config/*`（取代上游 `blog.config.ts`/`app.config.ts`）、`src/modules/clarity-config`、remark 插件 `.mjs` 运行时 |
| **CLARITY-ONLY** | 无 upstream 对应物的 Layer 边界基础设施。 | `src/modules/clarity-source-layout`、`src/config/ui.ts`、`src/config/public.ts`、`src/img/`、`patches/temporal-spec.patch` |
| **LEGACY** | 为 0.1.x 旧 consumer 保留的兼容面，已废弃，计划 0.2.0 移除。见[legacy 政策](../maintainers/legacy-policy.zh-CN.md)。 | `useClarityConfig()` / `useClaritySite()` / `useClarityArticle()` / `useClaritySiteFeedEntry()`（`src/shared/utils/clarity.ts`）、app-config 的 `clarity` 键、`article.useRandomPermalink` 警告并忽略逻辑 |

## 2. 主题 / 消费项目边界

```text
clarity-theme（Nuxt Layer 包）
├── nuxt.config.ts         Layer 能力与模块集成（TRANSFORM）
└── src/                   Layer srcDir — SOURCE / TRANSFORM / CLARITY-ONLY / LEGACY 混合
    ├── modules/           clarity-source-layout、clarity-config、anti-mirror
    ├── config/            公共 config/content/schema API（TS + MJS 双轨）
    ├── assets/ components/ composables/ layouts/ pages/ plugins/ stores/ types/ utils/
    ├── img/               纯图片助手导出
    ├── remark-plugins/    内容管线插件
    ├── server/            Atom/OPML/stats Nitro 路由
    ├── shared/            跨边界工具（含 LEGACY composables）
    └── public/            通用订阅源样式与字体资产

consumer 博客
├── nuxt.config.ts         extends clarity-theme；自有 routeRules/重定向/部署
├── clarity.config.ts      站点与功能契约（defineClarityConfig）
├── content.config.ts      createClarityContentConfig(clarityConfig)
├── content/               文章与页面
├── feeds.ts               可选友链数据
├── tsconfig.json          根工程引用（标准 Nuxt 文件；必需）
└── app/app.config.ts      可选 UI 覆盖（upstream 形状的扁平键）
```

Theme 提供通用行为。consumer 提供全部站点数据，并自行负责密钥、部署、重定向与补丁。

## 3. Layer 模型

### 包 / Layer 根

`clarity-theme` 解析到 `nuxt.config.ts`。该配置：

- 注册 Content、SEO、image、icon、color mode、Pinia、VueUse、Bikariya、LLMs，以及下述两个本地模块。
- Layer CSS、组件目录、图标、模块与 SCSS 变量全部使用包内绝对路径。
- Markdown remark/rehype 插件通过 `file://` URL 指向 `.mjs` 运行时实现。
- 设置运行时构建元数据、prerender 平台行为（CF Pages/GH Actions/Netlify 关闭 `autoSubfolderIndex`）、Vite 优化、图片密度/格式，并禁用 OG 图生成。

### `clarity-source-layout`（最先运行）

将 `src/`、`src/modules/`、`src/public/`、`src/server/`、`src/shared/` 与派生应用目录应用到 Clarity layer 元数据，**且不经 c12 泄漏到 consumer 根配置**。

### `clarity-config`（先于 `nuxt-llms` 与 `anti-mirror`）

consumer 配置桥。`setup` 阶段：

1. 发现 `clarity.config.ts` / `.mjs` / `.js` 与 `feeds.ts`，经 Zod schema 校验（legacy 键警告并忽略——见 §6），依赖前二次 parse。
2. 注入别名（§5），使 upstream 导入说明符在 Layer 内解析。
3. 将解析数据映射进 appConfig（upstream 扁平形状）、Nitro 私有 runtimeConfig、`nuxt.options.site`、robots 规则、`nuxt-llms`、head meta/link/scripts，以及 feature 路由规则。
4. 将**构建期生成模块**写入 `<buildDir>/clarity/`（§4），并在 `build:before` 重写（Nuxt 在模块运行后清理 buildDir）。
5. 注册 Vite `resolveId` 契约：把 consumer 的绝对路径 `<rootDir>/package.json` / `pnpm-workspace.yaml` 重定向到生成模块（§5）。
6. 注册 `content:file:afterParse` 钩子（frontmatter `permalink`、可选 `/posts` 前缀移除）。

### 运行时应用

`src/`（Layer `srcDir`）包含布局、页面、组件、composables、stores、插件、样式与类型。Nuxt 自动导入在扩展应用内生效。全部 upstream 派生组件通过 `useAppConfig()` 读取 **upstream 形状的扁平 app config**——绝不读 LEGACY `clarity` 键。

### 服务端

`src/server/` 含三个 Nitro 路由——`GET /atom.xml`、`GET /subscriptions.opml`、`GET /api/stats`。它们经 Nitro 私有 runtimeConfig（`useClarityServerConfig()`）读取 site/feed/stats 配置与 feature 开关；关闭的功能在运行时 404。

## 4. 构建期生成模块

upstream 文件通过 `~~/package.json`、`~~/pnpm-workspace.yaml`、`~~/blog.config` 读取 consumer 数据。JSON/YAML 无法被 Nitro prerenderer 导入，而把生成数据写进安装包内部会污染 pnpm store（跨 consumer 共享的硬链接目标）。因此 `clarity-config` 在 `<buildDir>/clarity/` **生成归一化 ES 模块**：

| 模块 | 内容 | 消费方 |
| --- | --- | --- |
| `package-json.mjs` | consumer `name` / `version` / `packageManager`，恒有 `version` 导出 | `BlogTech.vue`（client bundle） |
| `pnpm-workspace.mjs` | consumer catalogs 或 Theme 回退 | `BlogTech.vue`（client bundle） |
| `blog.config.mjs` | 由 `clarity.config.ts` 派生的 upstream 形状配置 | `anti-mirror`（构建期 head 脚本）；`~~/blog.config` 别名消费方走 `src/blog.config.ts` 适配层 |

写入时机**幂等且双写**：模块 `setup` 一次（供 prepare/dev 与 jiti 加载的 Layer 模块），`build:before` 再写一次（Nuxt 在模块运行后清理 buildDir）。prerenderer 将这些模块内联（`prerender:config` → `externals.inline`），TS 路径映射把 `~~/package.json` / `~~/pnpm-workspace.yaml` 类型指向声明模板。consumer 缺 `version` 降级为空显示加构建警告——不会使构建失败。

## 5. 注入别名与 prerender 契约

| 别名 / id | 解析到 | 说明 |
| --- | --- | --- |
| `#clarity/feeds` | consumer feeds 模块或 Theme 空回退 | 友链页 + OPML |
| `#clarity/config` | consumer clarity 配置模块路径 | 内部构建别名 |
| `~/shiki.config` | consumer 提供时用之；否则 Theme 回退 | |
| `~~/blog.config` | `src/blog.config.ts` 适配层（由 `clarity.config.ts` 派生的 upstream 扁平形状） | App/Nitro 上下文；jiti 加载的 Layer 模块读生成的 `blog.config.mjs` |
| `~~/shared` | consumer 无 `shared/` 时指向 Theme `src/shared` | |
| `~/feeds` | consumer 无 `feeds.ts` 时指向 Theme 回退 | |
| `~~/package.json` / `~~/pnpm-workspace.yaml` | `<buildDir>/clarity/` 生成模块 | 精确说明符别名 |
| *（Vite resolveId 契约）* | 绝对路径 `<rootDir>/package.json` / `pnpm-workspace.yaml` → 生成模块 | **原因**：生产（bundled）构建中 rolldown 原生 alias 插件会让更短的 `~~` → rootDir 前缀别名抢过精确别名，把导入改写到 consumer 真实 JSON（缺 `version` 键曾使 client 构建失败）。重定向契约使 client / nitro / prerender 在任何别名命中顺序下行为一致。 |

这些别名使 Theme 代码不假设 consumer 目录布局；upstream 文件保持原始导入说明符。

## 6. Legacy 面（0.1.x）

以下内容仅为按 0.1.0 API 编写的 consumer 存在。它们**已废弃**，不属于推荐路径，计划 0.2.0 移除——见[legacy 政策](../maintainers/legacy-policy.zh-CN.md)：

- `useClarityConfig()`、`useClaritySite()`、`useClarityArticle()`、`useClaritySiteFeedEntry()`（读取注入的 `clarity` app-config 键）。
- consumer `app/app.config.ts` 中的 `clarity` 键。
- `clarity.config.ts` 的 `article.useRandomPermalink`（接受但输出废弃警告并忽略；注册表之外的未知键仍然致命）。

组件与 consumer 的现行读取路径是经 `useAppConfig()` 的扁平 upstream 形状 app config。

## 7. 组件覆盖、包导出与双轨

- consumer 按相同 Layer 相对路径覆盖组件（如 `app/components/content/Badge.vue`）；consumer 组件优先。重复路径的 `NUXT_B3011` 警告是预期噪音，不是覆盖失败。
- 包导出：Layer 根加 `./config`、`./content`、`./schema`、`./img`。Node 加载的代码在 `.ts` 类型源旁提供 `.mjs` 运行时（`schema`、`define`、`content`、`img`、remark 插件）；两轨必须保持行为同步。

## 8. Prerender / Client / Nitro

- **Prerender**：`nuxt generate` 预渲染全部页面路由加 feed/server 输出、payload 端点、sitemap 支持文件与回退文档；爬虫从 `/` 发现文章路由。生成模块内联进 prerenderer 构建（§4）。CF Pages / GH Actions / Netlify 上 `nitro.prerender.autoSubfolderIndex` 关闭（扁平 `page.html` 而非 `page/index.html`）。
- **Nitro 运行时**：Atom/OPML/stats 处理器直接查询 Content；关闭的功能运行时 404。
- **Client 运行时**：水合、Shiki/Mermaid/ABC 渲染、搜索、颜色模式、弹窗/灯箱、Twikoo 挂载。真实密钥留在 consumer `runtimeConfig`；appConfig 与 `clarity.config.ts` 不是密钥存储。

## 9. 开发 / 测试专用面

`playground/`（workspace consumer）、`scripts/`（验证、consumer/兼容性/file-generate/runtime-parity 测试台、同步工具）、`tests/`（source parity 门、config 回归、transform parity 门、runtime/visual parity 测试台）、`docs/`、`.github/`、`skills/` 不进包。`docs/history/` 是过往审计与修复阶段的冻结记录。`docs/_content/mdc/` 的 Markdown/MDC 写作语料是 `article-beautifier` skill 的内容创作素材，不是主题文档。

见[上游同步](../maintainers/upstream-sync.zh-CN.md)、[Transform 面治理](../maintainers/transform-parity.zh-CN.md)与[测试](../maintainers/testing.zh-CN.md)。
