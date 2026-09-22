# 项目状态

[English](./PROJECT-STATUS.md) | **简体中文**

> 快照日期：2026-09-22，Asia/Taipei。本文档描述当前仓库。历史阶段叙述与旧的一次性审计结果保留在 [history](./history/2026-09-layer-extraction.zh-CN.md) 或被标记为历史审计记录。

## 文档事实来源

当文档之间不一致时，优先级为：

1. 当前源代码与包 manifest
2. `package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml`
3. 自动化测试与兼容性契约
4. GitHub Actions 工作流
5. `sync-manifest.json`
6. README 与其他文档

代码、测试、CI 与同步 manifest 优先于文字描述。本文中的陈述不能替代这些来源。

## 1. 快照

| 项目 | 当前事实 |
| --- | --- |
| 仓库分支 | `master` |
| Phase 20 开始时的 HEAD | `433d042ed3b626a048e84000ba2039102df61f28`（`docs: establish current reality-sync baseline`） |
| 工作树 | 文档变更前干净并与 `origin/master` 同步 |
| 包 | `clarity-theme` v0.1.0，MIT |
| 分发状态 | Git 包工作流；当前没有 npm 产物。2026-09-22 的 npm 注册表查询显示该包名未发布/不可用 |
| 上游基线 | `blog-v3` 3.7.2，`main` @ `f6ea97d745517feb52f0c100e89acb36f0adc12f` |
| 上游漂移 | 无：Phase 20 的一次直接远端头检查返回了 manifest 基线 commit |
| 用于验证的本地运行时 | Node.js 24.15.0、pnpm 12.4.1、Nuxt 4.5.2、Vue 3.5.43 |
| 当前本地验证 | 完整有序套件在代码 commit `e601eb5` 通过；Phase 20 只重跑了纯度验证与兼容性契约，未重跑 build/consumer/浏览器套件 |

本 Git 仓库之外的差分消费者是历史/手工环境，不属于 CI。其持久化输出早于当前主题 HEAD，不得被视为当前发布门槛。

## 2. 包 / 运行时

| 字段 | 值 |
| --- | --- |
| 名称 | `clarity-theme` |
| 版本 | `0.1.0` |
| 许可证 | MIT |
| 主页 / 仓库 | `https://github.com/iicemeta/clarity-theme` |
| Node engine | `^22.19 \|\| ^24.11 \|\| >=26` |
| 包管理器 | `pnpm@12.4.1` |
| Nuxt peer | `^4.5.2` |
| Vue peer | `^3.5.42` |
| 开发 workspace 中安装的 Nuxt | 4.5.2 |
| 开发 workspace 中安装的 Vue | 3.5.43 |
| 发布包负载 | `app/`、`config/`、`img/`、`modules/`、`public/`、`remark-plugins/`、`server/`、`shared/`、根 Layer/config 元数据、许可证与 README |
| 不打入包负载 | `docs/`、`playground/`、`scripts/`、`tests/`、`.github/`、workspace 与 lock 文件、同步 manifest |

当前 `pnpm pack` 审计报告 148 个文件，包括 28 个发布必需文件。该包暴露五个导出入口，且没有补丁目录。

## 3. 上游基线

- 上游项目：GitHub 上的 `blog-v3`；确切 Git URL 存储在 `sync-manifest.json`。
- 基线 commit：`f6ea97d745517feb52f0c100e89acb36f0adc12f`。
- manifest 记录的上游版本：3.7.2。
- 记录的上游框架版本：Nuxt 4.5.2，Content 依赖范围 `^3.16.0`。
- 记录的同步时间：2026-09-21 16:40 +08:00。
- 当前远端 `main` 等于该 commit。

manifest 分类、命令、冲突行为与已知分类缺口见[上游同步](./UPSTREAM.zh-CN.md)。

## 4. 项目定位

Clarity Theme 是从上游博客实现中抽取的可复用 Nuxt 4 Layer。它持有通用博客 UI、路由、Markdown/MDC 渲染、Content schema 生成、SEO/feed/服务端输出与配置桥。

**主题职责**

- Nuxt Layer 配置与依赖集成
- 通用页面、布局、组件、样式、stores 与 composables
- Markdown、MDC、代码高亮、数学、Mermaid、ABC 乐谱与图片渲染管线
- `clarity.config.ts` schema、默认值、校验与构建期注入
- Content 集合工厂与文章元数据 schema
- Atom、OPML、统计、robots、sitemap 与 LLMs 输出路由/配置
- UI 默认值与使用方覆盖机制

**使用方职责**

- `clarity.config.ts` 中的站点身份与公共站点元数据
- `content/` 下的文章与其他内容
- 使用 `createClarityContentConfig()` 的 `content.config.ts`
- 可选的 `feeds.ts` 友链数据
- UI 与同路径组件覆盖
- 运行时密钥、部署配置、重定向、统计分析 ID 与站点级包补丁

**主题非职责**

- 存储任何具体博客内容或上游作者数据
- 提供评论后端、统计分析后端、图片服务、数据库或 CMS
- 携带包管理器补丁或使用方部署规则
- 未经人工审查自动合并上游变更

## 5. 当前架构

该包是单个 Nuxt Layer 入口，由一个构建期配置模块支撑：

```text
consumer clarity.config.ts
  -> defineClarityConfig() validation/defaults
  -> modules/clarity-config build-time load and second validation
  -> appConfig / SEO / head / route rules / aliases
  -> Layer pages, components, server routes, and Content pipeline

consumer app/app.config.ts
  -> deep UI override, merged above Theme defaults and module-injected defaults

consumer content/ + content.config.ts + optional feeds.ts
  -> Content collection, article routes, friend page, Atom/OPML outputs
```

完整边界、配置流、内容流、服务端流、别名与覆盖机制记录在[架构](./ARCHITECTURE.zh-CN.md)。

## 6. 公共 API

显式包导出：

| 导出 | 用途 |
| --- | --- |
| `clarity-theme` | Nuxt Layer 根（`nuxt.config.ts`） |
| `clarity-theme/config` | `defineClarityConfig()` 与配置/schema 类型 |
| `clarity-theme/content` | `createClarityContentConfig()` 与 `ArticleSchema` |
| `clarity-theme/img` | 纯图片/头像/favicon URL 辅助函数 |
| `clarity-theme/schema` | Zod schema 与 schema 派生类型 |

Layer 还支持 `useClarity*` 运行时自动导入与同路径组件覆盖。这些是 Layer 使用契约，不是独立 ESM 子路径。完整边界见 [API](./API.zh-CN.md)。

## 7. 配置面

| 配置面 | 归属 | 必需？ | 消费时机 | 说明 |
| --- | --- | --- | --- | --- |
| `clarity.config.ts` | 使用方 | 是；顶层仅 `site` 必填 | 定义时、模块 setup、Content 构建、appConfig、SEO、服务端路由 | 严格 Zod schema；未知字段失败 |
| `app/app.config.ts` | 使用方 | 否 | 运行时 appConfig | 仅 UI 分组；对象深度合并，数组整体替换 |
| `content.config.ts` | 使用方 | Content 必需 | Content 构建 | 用解析后的站点配置调用主题工厂 |
| `feeds.ts` | 使用方 | 否 | 友链页与 OPML | 回退为空数据并警告 |
| `runtimeConfig` | 使用方 | 按需 | Nuxt 运行时 | 真正密钥的唯一合法位置 |
| `clarityConfig.configFile` 模块选项 | 使用方 | 否 | 模块 setup | 覆盖自动配置文件发现 |

字段级必填/默认值/客户端可见性规则维护在[配置说明](./CONFIGURATION.zh-CN.md)。

## 8. 功能

图例：✅ 已实现，🧪 除非显式标记为历史，否则由当前自动化测试验证，⚠️ 已知限制，📌 未来工作。

| 能力 | 状态 | 当前事实 |
| --- | --- | --- |
| Nuxt Layer 入口 | ✅ 🧪 | workspace playground 与独立 tarball 消费者均生成成功 |
| 公共 config/schema/content/img 导出 | ✅ 🧪 | 纯 Node 冒烟、typecheck 与消费者生成覆盖全部五个入口 |
| Markdown | ✅ 🧪 | 标题、强调、链接、列表、任务、引用、表格、脚注与行内代码由 SSR/浏览器/消费者断言覆盖 |
| MDC 组件 | ✅ 🧪 | Alert、Tip、Copy、CardList、Folding、Badge 与消费者 Badge 覆盖已覆盖；其他已实现组件未被穷举断言 |
| 代码与 Shiki | ✅ 🧪 ⚠️ | 行内/围栏代码、语言、文件名、meta、diff、tab、高亮、折叠默认值与自定义主题已验证；plain 高亮行为与精确颜色依赖补丁环境，且 Shiki 导入远程 esm.sh 资源 |
| 数学 | ✅ 🧪 | 行内/块级/对齐 KaTeX SSR 与浏览器渲染已验证 |
| Mermaid | ✅ 🧪 | 两种图类型在真实浏览器渲染 SVG；已检查无错误回退 |
| ABC 乐谱 | ✅ 🧪 ⚠️ | 乐谱 SVG/路径已验证；音频控件/音源未断言 |
| 图片 | ✅ 🧪 ⚠️ | Markdown 图片与 `Pic` figure/zoom 标记已验证；小数 `densities="1.5x"` 行为需要消费者 `@nuxt/image` 补丁 |
| 客户端搜索 | ✅ 🧪 ⚠️ | MiniSearch 弹层、结果文本/链接与文章导航已验证；键盘导航与排序未覆盖 |
| 文章列表 | ✅ 🧪 | 排序、分类过滤、分页、封面/元数据渲染按当前契约深度覆盖 |
| 归档 | ✅ 🧪 ⚠️ | 年份分组与水合已验证；间距/栏控制与全部交互控件未覆盖 |
| 分页 | ✅ 🧪 | 第 2 页查询、列表切换与水合已验证 |
| TOC | ✅ 🧪 ⚠️ | SSR 结构与 4 层管线已验证；滚动同步未断言 |
| SEO | ✅ 🧪 ⚠️ | WebSite/文章元数据、canonical、og site/name/description 已验证；空 og:image 与缺失图片尺寸产生非致命警告 |
| Robots | ✅ 🧪 | sitemap 声明与配置的 disallow 规则已验证 |
| Sitemap | ✅ 🧪 | 基础站点、普通文章与固定链接 URL 已验证 |
| LLMs | ✅ 🧪 | 站点标题/描述输出已验证 |
| Atom | ✅ 🧪 | 默认与 `enableStyle=false`、上限、条目、固定链接与 XSLT 分支已验证 |
| OPML | ✅ 🧪 | 自有 feed 与友链 feed 输出已验证 |
| 统计 | ✅ 🧪 | 计数、字数、分类与年度 JSON 断言通过 |
| 404/错误路由 | ✅ 🧪 ⚠️ | 缺失/固定链接源路由在 SSR 测试中返回 404；完整自定义错误 UI 未断言 |
| 固定链接 | ✅ 🧪 | frontmatter `permalink` 覆盖源路径并隐藏源路由 |
| `useRandomPermalink` | ✅ ⚠️ 📌 | 仅 schema 接受/构建兼容；主题不生成随机固定链接 |
| UI app-config 覆盖 | ✅ 🧪 | 消费者 `header.emojiTail` 与 playground 分页设置已验证 |
| 组件覆盖 | ✅ 🧪 ⚠️ | 同路径 Badge 覆盖已验证，伴随预期的 Nuxt 重名警告 |
| 反镜像 | ✅ 🧪 ⚠️ | 编码黑名单/站点脚本注入与禁用分支已验证；真实浏览器重定向未测试 |
| Twikoo | ✅ 🧪 ⚠️ | 启用容器/preload 与禁用文本/无容器分支已验证；远程 Twikoo 初始化/UI 未测试 |
| head 脚本/集成 | ✅ ⚠️ | 构建期注入已实现；当前自动化夹具使用空脚本列表，完整历史差分站点不是当前 CI 门槛 |
| 小部件 | ✅ ⚠️ | stats/tech/log 小部件在已覆盖页面外壳中渲染；小部件注册组合与更新日志内容未被系统性断言 |
| 预览页 | ✅ ⚠️ | 路由存在且生成；当前没有预览文章夹具行使隐藏列表 |
| 响应式布局 | ✅ ⚠️ | 上游 UI 已实现；无 viewport/抽屉测试自动化 |

## 9. 测试

| 命令 / 检查 | 实际验证内容 | 当前结果 |
| --- | --- | --- |
| `pnpm lint` | 仓库源码 ESLint 加主题/Playground Vue 与 SCSS 的 Stylelint | ✅ 通过 |
| `pnpm typecheck` | Playground `nuxt typecheck`，包括 Layer 类型生成与消费者式 app config 类型 | ✅ 通过，伴随预期的 `NUXT_B3011` Badge 警告 |
| `pnpm verify` | 静态纯度：禁止的上游作者/站点标识、站点文件与跨项目导入 | ✅ 通过 |
| `pnpm test:sync` | 13 个临时 Git 测试：同步快进、冲突、删除、新文件、transform/manual 排除、unknown 阻止、verify 失败与回滚 | ✅ 13/13 |
| `pnpm test:migration` | 静态迁移 Skill 契约加伪 blog-v3 夹具检查：发现、schema 映射、UI 边界、Twikoo/feed/统计、重定向、补丁、自定义覆盖与受保护资产 | ✅ 10/10 |
| `pnpm test:contract` | 39 个契约行与必需的功能/覆盖引用与生成的 `docs/COMPATIBILITY.md` 保持同步 | ✅ 通过 |
| `pnpm peers check` | workspace peer 依赖审计 | ✅ 无问题 |
| `pnpm generate` | 经 workspace Layer 链接的 playground 静态生成 | ✅ 通过；Nitro 预渲染 51 条路由；一条预期的链接检查器警告 |
| `pnpm test:consumer` | 打包、tarball 边界/泄漏审计、导出/类型声明图、独立安装、纯 Node 冒烟、typecheck 与三种生成变体 | ✅ 通过 |
| `pnpm test:compatibility` | 契约、生产构建日志扫描、24 个 SSR 用例、12 个真实浏览器用例、11 条 dev 水合路由 | ✅ 通过；51 个断言组 |
| `pnpm sync:check` | 远端上游头对比 manifest 基线 | ✅ 最新 |
| `pnpm test:release` | verify + 真实消费者 + 兼容性 | 脚本存在；当前本地运行以上文更广的 CI 集合执行了其组件命令 |

当前消费者变体事实：

- Tarball：148 个文件；28 个必需文件；五个导出入口。
- 从当前脚本派生的运行时契约：100 次断言调用加 15 项纯 Node 冒烟检查。
- `default`：42 条预渲染路由。
- `branches`（`enableStyle=false`、`hidePostPrefix=false`、Twikoo、反镜像）：42 条预渲染路由。
- `features-off`（Atom/OPML/统计关闭、随机固定链接开关被接受）：39 条预渲染路由。

兼容性警告为非致命，列于已知限制。

## 10. CI

### `ci.yml`

- 触发：push/PR 到 `main` 或 `master`，加手动 dispatch。
- 并发取消同一引用的旧运行。
- 权限：`contents: read`。
- 版本派生自包元数据，而非手写工作流值。
- Node 矩阵从固定 engine 分支解析：22.19 与 24.11。开放的 `>=26` 分支未被代表，因为没有声明稳定的固定分支。
- pnpm 由读取 `packageManager` 的 `pnpm/action-setup` 安装。

阶段严格有序：

1. Node 矩阵上的 **Layer 1 lint**。
2. Node 矩阵上的 **Layer 1 typecheck + verify + 同步回归 + 迁移夹具 + 兼容性契约 + peers**。
3. 主 Node 24.11 上的 **Layer 2 playground generate**。
4. 主 Node 24.11 上的 **Layer 3 真实消费者测试 + 兼容性回归**。

### `sync.yml`

- 每周一 03:00 UTC 定时，加手动 dispatch。
- 权限：`contents: read`、`issues: write`。
- 不安装依赖即运行 `pnpm sync:check --fail-on-update`。
- 漂移时创建/复用一个带 `sync:diff` 详情的 `sync` Issue，并以明确消息失败。
- 绝不 apply、commit 或 push 变更。

## 11. 上游同步

同步 manifest 将路径分为 `include`、`exclude`、`transform` 与 `manual`；未分类变更阻止 apply。`apply` 只快进未修改的 include 文件，检测已适配文件冲突，事务式运行纯度校验，且只在成功后推进基线。transform/manual 文件只被报告，绝不覆盖。

重要边界事实：若干上游派生路径（`app/stores/**`、`app/types/**`、`app/utils/**`）未被显式分类；两个类型文件已被主题适配。未来上游在这些路径的变更会被视为 unknown 并阻止 apply。这被登记为 manifest/文档缺口，本次仅文档任务不改变它。

详情：[上游同步](./UPSTREAM.zh-CN.md)。

## 12. 补丁策略

Clarity Theme 本身不携带补丁。包管理器补丁是 workspace/安装根状态，不随 npm 包传递；它们也是站点相关的兼容性决策。

当前细化结论：

- 迁移上游博客内容当前需要 detab-only 的 `@nuxtjs/mdc` 消费者补丁；旧的行内代码 hunk 已移除，因为主题同时支持 slot 与 `code` prop 输入。
- 当前上游内容的图片 props 需要 `@nuxt/image` 小数 density 消费者补丁。
- `plain-shiki` 是短期消费者补丁；此前审计确认可在主题侧做 selector 配置，作为未来工作。
- `ipx` ICO 透传是可选的，只有当 ICO 真的经过 IPX 时才需要；不是主题默认要求。
- 上游/差分工作副本中还存在一个额外的 `@vue/shared` 补丁文件，但未注册、不生效。

详情：[补丁说明](./PATCHES.zh-CN.md)。

## 13. 已验证能力

当前自动化证据验证：

- 包边界与已知上游私有数据缺失
- Node 与 TypeScript 中的全部五个包导出
- 来自 tarball 的真实独立消费者安装
- 三种配置变体及其生成的路由/文件
- 核心 Markdown/MDC/代码/数学/图表/乐谱/图片渲染
- 生产 SSR、真实浏览器渲染与 dev 水合
- 按所述契约深度的搜索、主题切换、分页、归档、TOC、SEO、robots、sitemap、LLMs、Atom、OPML、统计、固定链接、404、反镜像注入、Twikoo 分支、UI 覆盖与组件覆盖
- 上游同步工具回归与当前基线新鲜度

完整生成的功能矩阵见[兼容性说明](./COMPATIBILITY.zh-CN.md)。

## 14. 已知限制

1. **面向服务端的配置仍对客户端可见。** feed/统计与若干仅构建期 article 字段仍流经 appConfig，因为服务端路由与共享读取方使用 `useClarityConfig()`。这是边界缺陷，不代表 `clarity.config.ts` 中存放了密钥。
2. **功能关闭主要是预渲染/head 移除。** Atom/OPML/统计禁用时，服务端路由未被证明会在运行时返回 404。
3. **反镜像导航未验证且可能有缺陷。** 脚本注入已验证，但继承的客户端把完整 `site.url` 赋给 `location.host`；发布前需要专项浏览器测试与修正。
4. **多个统计路径模式组合成交集。** handler 在其查询组内串联 `where()` 条件，而文档中的数组自然被读作并集。只测试了单模式夹具。
5. **区域 CDN 默认值固定。** KaTeX、Inter 与 Google 字体链接指向面向中国的镜像域名，无使用方覆盖。
6. **自动化主题测试在无补丁环境运行。** 这是正确的默认环境，但 tab 保留、小数图片密度与精确 plain-Shiki 作用域因此与打了补丁的真实博客环境不同。
7. **差分消费者不是当前的，也未自动化。** 它在 Git 之外，指向较旧的本地 tarball，其持久化输出早于当前 HEAD。
8. **远程服务行为未被完全测试。** Twikoo 初始化、反镜像导航、ABC 音频、搜索键盘行为与图片服务失败未被断言。
9. **若干 UI 交互缺少测试。** 归档控件、代码折叠/复制交互、小部件组合、预览入口、响应式抽屉/遮罩与自定义错误 UI 未被系统性覆盖。这本身不代表这些功能未实现。
10. **`useRandomPermalink` 不生成固定链接。** 主题接受该开关，但期望由别处持有的构建脚手架完成生成。
11. **同路径组件覆盖触发 `NUXT_B3011`。** 功能已验证，但警告仍在。
12. **兼容性存在非致命警告类别。** Vue slot/readonly 警告、空/过小 og:image、废弃的 `twitter:card` 与外部资源警告出现在 dev/浏览器日志。
13. **Shiki 依赖远程 esm.sh 导入。** 受限/离线构建可能受影响。
14. **Node 26+ 被允许但未 CI 测试。** engine 的开放范围没有稳定的矩阵代表。

## 15. 技术债

技术债清单现维护在[路线图](./ROADMAP.zh-CN.md)。当前头条项：

- **P0：** 服务端/客户端配置拆分、功能路由守卫、反镜像导航验证/修正、移除或显式迁移 no-op 的 `useRandomPermalink` 契约。
- **P1：** 可配置资源源、多模式统计正确性、同步 manifest 分类、TS/MJS 一致性检查、`plain-shiki` 补丁缩减与发布工作流设计。
- **P2：** 增量的交互/无障碍/响应式/服务失败覆盖、警告削减、离线 Shiki 支持、作者 email 可见性、纯度泛化与测试装置可维护性。

此前重复的列表在限制与未来工作之间重复了这些项；请使用路线图 ID，不要创建平行跟踪器。

## 16. 文档缺口

已由本文档集解决：

- 此前没有单一的当前状态、架构、API 或上游工作流入口。
- README 把当前事实与已完成的阶段 TODO 及一次性历史结果混在一起。
- 补丁摘要曾把 `ipx` 描述为普遍需要，尽管详细审计发现它是可选的。

仍然开放：

- `docs/COMPATIBILITY.md` 是生成的且刻意以契约为焦点；它不解释视觉质量或未覆盖的交互。
- 历史审计文件保留原路径，因为 `verify-theme.mjs` 有按路径的白名单；现在标记为非权威，而不是在移动会破坏验证时移动它们。
- 确切的上游 Git URL 在非 README 文档中刻意通过 `sync-manifest.json` 引用，以避免在当前纯度白名单之外重新引入上游标识字符串。
- 字段级配置文档不枚举每个内部组件 prop，因为这些 prop 不是稳定的公共 API。
- 运行时校验错误仍会把部分读者指向历史配置审计，而不是当前字段级配置文档；在配置边界工作触及这些文件时修正。

## 17. 未来工作

未来实现按[路线图](./ROADMAP.zh-CN.md)排序：

1. **里程碑 1——核心边界与正确性加固：** 配置边界、路由语义、反镜像导航、固定链接契约与统计路径组合。
2. **里程碑 2——兼容性与质量细化：** 资源源、同步分类、双轨一致性与 `plain-shiki` 策略。
3. **里程碑 3——发布候选加固：** 发布工作流、确切 commit 验证与最终契约/文档冻结。
4. **里程碑 4——发布与维护：** 首次 npm 发布与发布后增量覆盖。

旧的基于阶段的 TODO 清单不再是活跃的规划轨道。

## 18. 非目标 / 不计划

- Clarity Theme 不会打包文章、作者配置、重定向、部署配置、统计分析 ID、私有 token 或友链数据。
- 它不会作为后端运行 Twikoo、统计分析、图片代理、搜索索引或评论服务。
- 它不会携带使用方包管理器补丁。
- 它不会自动合并上游变更。
- 它当前不计划 CMS、数据库层、通用 i18n 框架或视觉回归系统。

## 19. 当前里程碑

**Phase 20——技术债分诊完成。**

当前状态已对照代码、manifest、测试、CI 与上游基线重新审计。既有限制被分类为 P0/P1/P2/Deferred/Won't Fix 条目，识别了误报与重复跟踪器，未来工作现按[路线图](./ROADMAP.zh-CN.md)排序。本阶段没有修改运行时代码。
