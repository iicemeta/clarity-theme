# 项目状态

[English](./project-status.md) | **简体中文**

面向维护者的当前架构与验证事实。本页描述仓库现状，而不是发布快照：最新已发布版本及其证据位于根目录 [CHANGELOG](../../CHANGELOG.md)，已完成的一次性工作记录在[历史](../history)中。当本页与源码、测试、CI 或 `sync-manifest.json` 不一致时，以后者为准。

## 当前架构

Clarity Theme 是以 `nuxt.config.ts` 为根的可复用 Nuxt 4 Layer，全部运行时源码位于 `src/`（见[架构](../concepts/architecture.zh-CN.md)）：

- layer-only 的 `clarity-source-layout` 引导模块只把 `src/` 布局应用到 Clarity layer，npm、Git commit 与本地目录安装解析一致，且不会覆盖消费方目录。
- `clarity-config` 模块加载并校验 `clarity.config.ts`（Zod 严格模式），注入上游形状的扁平 app config（使上游组件与 blog-v3 完全一致地读取 `useAppConfig()`），生成 `~~/package.json`、`~~/pnpm-workspace.yaml` 的构建期数据模块，接线 SEO/robots/llms/route rules/head 脚本，并应用固定链接与 `/posts` 前缀 Content hook。
- 上游 `modules/anti-mirror` 模块被显式注册（位于 `clarity-config` 之后）并保持始终启用、沿用上游硬编码黑名单；`features.antiMirror` 配置可被接受但会被忽略（该模块无法关闭），并计划在未来的破坏性发布中移除。
- 五个公共包导出（`.` / `./config` / `./content` / `./schema` / `./img`），带成对的 `.mjs` 运行时与 `.d.mts` 类型轨道。
- 通用 UI、页面、组件、样式、composables、stores、Markdown/MDC/Shiki/KaTeX/Mermaid/ABC 渲染、搜索、分页、归档、TOC、Atom/OPML/stats 输出。
- 独立的 `create-clarity-theme` workspace 包（独立版本、changelog、测试与发布工作流）为新消费者提供脚手架。

## 当前验证状态

验证管线分层（见[测试](./testing.zh-CN.md)），且全部层都接入 CI：

- 静态/契约：lint、typecheck、Theme 纯度、上游同步工具回归、迁移 Skill 回归、兼容性契约、peer 审计、文档治理。
- 生成：通过 workspace 链接 Layer 的 playground 静态生成。
- 真实消费者：打包 tarball 消费者（导出/typecheck/配置分支断言）；生产 SSR + 真实浏览器 + dev 水合兼容性；创建器 CLI/E2E/tarball 套件。
- 发布：`release:check` 门禁 + 安装已发布 npm 版本的 registry 消费者测试。

逐功能生成的矩阵见[兼容性说明](../reference/compatibility.zh-CN.md)；它断言功能的存在/行为，不追求视觉质量。

## 包边界

| 属性 | 值 |
| --- | --- |
| npm 包 | `clarity-theme`，MIT，`publishConfig.access=public` |
| 发布负载 | `src/`（全部 Theme 运行时源码）+ 根 Layer/配置元数据、许可证、README |
| 不进入负载 | `docs/`、`playground/`、`scripts/`、`tests/`、`skills/`、`.github/`、workspace/lock 文件、同步 manifest |
| 创建包 | `create-clarity-theme/` 中的 `create-clarity-theme`——独立 npm 元数据、bin、模板、测试与工作流 |
| 运行时契约 | Node `^22.19 \|\| ^24.11 \|\| >=26`、pnpm `12.4.1`（开发）、Nuxt peer `^4.5.2`、Vue peer `^3.5.42` |

Theme 包不含 patch 目录与站点数据：文章、友链、重定向、部署配置、密钥与包管理器补丁都由消费方持有（见[补丁策略](./patches.zh-CN.md)）。

## 上游基线

已审查的上游基线记录在 [`sync-manifest.json`](../../sync-manifest.json)（仓库、分支、commit、上游版本、框架版本、同步时间）。每周同步工作流只检测并报告漂移；应用变更永远是人工的、事务性的决策（见[上游同步](./upstream-sync.zh-CN.md)）。

## 已知限制

1. 远程 CSS/字体来源（KaTeX、Inter、JetBrains Mono、Noto Serif SC）是内置默认值；使其可配置是路线图工作。
2. `plain-shiki` 作用域渲染需要文档记载的消费方补丁，直到上游依赖修复其 selector 行为。
3. 若干上游派生同步路径（`app/stores/**`、`app/types/**`、`app/utils/**`）仍需在上游同步时人工分类。
4. 同路径组件覆盖会输出有意的 `NUXT_B3011` 重名警告。
5. 兼容性测试容忍一些非致命告警类别（Vue slot/readonly、og:image/twitter:card 弃用、外部资源噪声）。
6. Shiki 依赖远程 esm.sh 导入；受限/离线构建可能受影响。
7. engine 允许 Node 26+，但没有稳定的 CI 矩阵代表版本。
8. 远程服务行为（Twikoo 初始化、ABC 音频、搜索键盘行为、图片服务失败）与若干 UI 交互缺少系统化自动化；这并不意味着功能未实现。
9. `site.author.email` 仍是有意公开的元数据（HTML author meta 与 feed 输出）；可见性选项已推迟。
10. 成对的 TS/MJS 运行时轨道靠人工保持同步；parity 门禁是路线图工作。

## 非目标

- Clarity 不打包文章、作者配置、重定向、部署配置、统计 ID、私有 token 或友链数据。
- 不作为后端运行 Twikoo、统计、图片代理、搜索索引或评论服务。
- 不携带消费方包管理器补丁。
- 不自动合并上游变更。
- 目前不计划 CMS、数据库层、通用 i18n 框架或视觉回归系统。

## 指针

- 公共 API 边界：[API](../reference/api.zh-CN.md) · 配置面：[配置](../guides/configuration.zh-CN.md)
- 开放工作：[路线图](./roadmap.zh-CN.md) · 发布流程：[发布](./publishing.zh-CN.md) · 发布模板：[发布清单](./release-checklist.zh-CN.md)
- 文档规则：[文档规则](./documentation.zh-CN.md) · 历史审计：[历史](../history)
