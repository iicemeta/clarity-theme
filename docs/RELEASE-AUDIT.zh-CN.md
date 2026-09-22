# 发布审计

[English](./RELEASE-AUDIT.md) | **简体中文**

> 审计日期：2026-09-22，Asia/Taipei。这是收尾阶段的只读工程审计。它记录文档、迁移 Skill 与发布清单工作之前的仓库状态；它不重新设计主题 Layer，也不修改运行时代码。

## 1. 被审计基线

| 项目 | 结果 |
| --- | --- |
| 仓库 | `iicemeta/clarity-theme` |
| 分支 | `master`，跟踪 `origin/master` |
| 审计开始时主题 HEAD | `f370ef4`（`docs: establish phase 20 roadmap`） |
| 主题工作树 | 本报告撰写前干净 |
| 包 | `clarity-theme` v0.1.0，MIT |
| 运行时契约 | Node `^22.19 \|\| ^24.11 \|\| >=26`、pnpm `12.4.1`、Nuxt peer `^4.5.2`、Vue peer `^3.5.42` |
| 上游 | `sync-manifest.json` 记录的 blog-v3 仓库，分支 `main` |
| 上游 HEAD | `f6ea97d745517feb52f0c100e89acb36f0adc12f`（`fix: 修复静态页面侧栏重复与快捷键水合不匹配`） |
| 上游包版本 | 3.7.2 |
| Manifest 基线 | 与 `sync-manifest.json` 中的上游 commit 与版本一致 |
| 本地上游工作树 | 干净，检出在 manifest commit |

本次审计使用的上游工作副本位于主题 Git 仓库之外。它是只读参考，不是发布产物。

## 2. 当前已完成工作

### 2.1 包与 Layer 边界

- 主题是以 `nuxt.config.ts` 为根的 Nuxt 4 Layer。
- `package.json` 暴露五个入口：Layer 根、`./config`、`./content`、`./img` 与 `./schema`。
- 包负载排除用户内容、playground、文档、CI、测试、同步 manifest 与消费者补丁。
- 开发与运行时依赖分离；Nuxt 与 Vue 是 peer 依赖。
- `scripts/test-consumer.mjs` 演练真实打包 tarball 与独立安装，而不只是 workspace 链接。

### 2.2 配置契约

- `clarity.config.ts` 由 `modules/clarity-config` 加载。
- Zod strict schema 校验 site、article、feed、stats、integration、feature 与 changelog 分组；未知字段使构建失败。
- `defineClarityConfig()` 与生成的声明文件通过 `clarity-theme/config` 导出。
- `createClarityContentConfig()` 从解析后的 Clarity 配置派生 Content 集合与文章 schema。
- 消费者 `app/app.config.ts` 被刻意限制为 `clarity.component`、`clarity.footer`、`clarity.header`、`clarity.link`、`clarity.nav`、`clarity.pagination` 与 `clarity.themes` 下的 UI 覆盖。
- 模块在站点级字段被错误放进消费者 app config 时发出警告。

### 2.3 使用方持有的数据

- 文章与其他 Content 源保留在使用方的 `content/` 目录。
- 友链数据保留在使用方持有的 `feeds.ts`；缺失时回退空数据并警告。
- 重定向、部署配置、运行时密钥、自定义模块、自定义服务端路由与包补丁在主题负载之外。
- 当前主题包没有补丁目录，也没有具体上游文章、友链数据、统计分析标识或私有凭据。

### 2.4 渲染与输出功能

Layer 当前提供通用 UI、布局、页面、组件、样式、composables、stores、Markdown/MDC 渲染、Shiki、数学、Mermaid、ABC 乐谱、富图片、搜索、分页、归档、TOC、Twikoo 集成点、Atom、OPML、统计、robots、sitemap 与 LLMs 输出。

### 2.5 上游同步

- `sync-manifest.json` 记录确切的上游仓库、分支、commit、版本、框架版本与同步时间。
- 它区分 `include`、`exclude`、`transform` 与 `manual` 路径；未匹配路径视为 unknown 并阻止 apply。
- `scripts/sync-upstream.mjs` 实现 check、diff、事务式 apply 与 verify 模式。
- Apply 要求干净的主题工作树，只快进未修改的 include 文件，阻止冲突，并在校验或 manifest 失败时回滚。
- 已知边界缺口是 `app/stores/**`、`app/types/**` 与 `app/utils/**` 下的若干上游派生路径未被显式分类。

### 2.6 补丁边界

上游有五个补丁文件，其中四个注册在 `pnpm-workspace.yaml`：

- `@nuxtjs/mdc`：上游内容 tab 保留所需；主题现在持有行内代码兼容，但 detab-only 补丁仍由消费者持有。
- `@nuxt/image`：当前上游内容使用的小数 density 字符串所需；消费者补丁或上游修复。
- `plain-shiki`：短期消费者补丁；未来主题侧公开 selector 选项可能移除它。
- `ipx`：可选 ICO 透传 recipe，不是通用主题要求。
- `@vue/shared`：文件存在但未注册；不生效，绝不能复制或启用。

主题刻意不携带这些补丁中的任何一个。

## 3. 既有验证

### 3.1 已声明命令

| 命令 | 实际覆盖 |
| --- | --- |
| `pnpm lint` | ESLint 加主题与 playground Vue/SCSS 的 Stylelint |
| `pnpm typecheck` | Playground `nuxt typecheck`，包括生成的 Layer 与 app-config 类型 |
| `pnpm verify` | 静态纯度、禁止的标识/站点数据、包边界与导入检查 |
| `pnpm test:sync` | 使用临时 Git 仓库的 Node 测试套件，覆盖同步操作与回滚 |
| `pnpm test:contract` | 契约行与功能引用与生成的兼容性文档同步 |
| `pnpm generate` | 经 workspace Layer 链接的 playground 静态生成 |
| `pnpm test:consumer` | 打包审计、导出/类型图、独立安装、冒烟/typecheck 与三种生成变体 |
| `pnpm test:compatibility` | 契约、生产构建扫描、SSR、真实浏览器与 dev 水合检查 |
| `pnpm sync:check` / `sync:diff` / `sync:apply` / `sync:verify` | 上游漂移与事务式同步 |
| `pnpm test:release` | verify、真实消费者与兼容性的有序简写 |
| `pnpm peers check` | workspace peer 依赖审计 |

### 3.2 CI

- `ci.yml` 运行三层有序管线：Node 矩阵上的静态/回归、playground 生成，然后真实消费者与渲染兼容性。
- Node 与 pnpm 版本派生自包元数据。
- `sync.yml` 每周运行，只检测/报告上游漂移；绝不 apply 或 push 变更。

### 3.3 证据状态

状态文档记录了完整套件在更早的代码等价 commit 上通过，以及 Phase 20 文档 HEAD 上只做了部分重跑。因此，**仍需要在最终发布 commit 上完整有序运行一次**。文字记录的结果不能替代那次最终运行。

## 4. 尚未完成

1. **P0-1——服务端/客户端配置拆分：** 服务端消费的 feed/统计与仅构建期 article 字段仍通过 appConfig 可见。
2. **P0-2——feature-off 路由语义：** 禁用的 Atom/OPML/统计路由已从预渲染配置移除，但运行时 404 行为未被断言。
3. **P0-3——反镜像正确性：** 注入已测试，但导航行为未验证，且继承的对 `location.host` 赋值疑似有缺陷。
4. **P0-4——随机固定链接契约：** `article.useRandomPermalink` 被接受但不生成固定链接；首次发布前必须移除或显式迁移到文档化的构建脚手架 API。
5. **P1 正确性与兼容性债务：** 多模式统计当前表现为交集而配置读起来像并集；远程 CSS/字体来源固定；同步分类不完整；TypeScript/MJS 一致性没有门槛；短期 `plain-shiki` 补丁策略尚未消除。
6. **发布工作流：** 首个 npm 版本/tag/provenance/演练/回滚流程未定义。
7. **迁移文档：** 不存在完整的面向用户的迁移指南。
8. **配置指南：** 字段文档以 `docs/configuration.md` 存在，但请求的面向用户的 `docs/CONFIGURATION.md` 入口与命名未确立。
9. **自定义指南：** 不存在整合的公共覆盖指南。
10. **Agent 迁移 Skill：** `.agents/skills/migrate-blog-v3-to-clarity/` 不存在。
11. **迁移夹具/回归：** 没有伪 blog-v3 消费者夹具验证迁移映射、分类、重定向、补丁、组件覆盖或自定义 Shiki 行为。
12. **确切 commit 发布验证：** 最终有序套件与发布清单尚未生成。

## 5. README 与当前现实

当前 README 已基本面向用户，不含 `YOURNAME` 占位符、过时的上游版本或陈旧的 Phase 0–6 TODO 清单。剩余不一致或缺口：

1. 它声称宽泛的验证，但没有限定最后一次完整套件运行在更早的代码等价 commit 而非当前 HEAD。
2. 快速开始推荐 `pnpm add -D`；Nuxt Layer 通常是运行时依赖，因此发布指引应使用常规依赖，除非有意选择文档化的仅开发立场。
3. 它没有链接迁移指南，因为该指南尚不存在。
4. 它链接小写的 `docs/configuration.md`；请求的公共入口是大写的 `docs/CONFIGURATION.md`。
5. 除简短的 README 片段外，没有整合的自定义入口。
6. “当前状态”围绕内部 Phase 20 路线图撰写，而不是面向主题用户的简明发布就绪状态。
7. 功能列表提到反镜像，但没有提及其已知的发布前正确性限制。
8. 文档与测试命令列表尚未包含本阶段必须添加的迁移/夹具检查。

## 6. 文档缺口

- `docs/MIGRATION.md`：缺失。
- `docs/CONFIGURATION.md`：请求的规范入口缺失；现有小写文档更偏契约而非用户操作指南。
- `docs/CUSTOMIZATION.md`：缺失。
- `docs/RELEASE-CHECKLIST.md`：缺失。
- 上游 `blog.config.ts`、`app/app.config.ts`、`content.config.ts`、`nuxt.config.ts`、`app/feeds.ts`、`redirects.json`、补丁、自定义组件与服务端代码的迁移专属映射未整合。
- 现有文档正确识别技术债，但用户需要“主题 API 迁移”与“已知发布阻塞项”的分离。
- 历史审计文档仍有用，但应保持明确标记为非权威；它们不应成为主要迁移路径。

## 7. 迁移缺口

上游配置形态已被审计，但目前没有为用户或 Agent 打包的安全操作流程：

- 上游根级身份字段需要映射进 `site.*`。
- 上游 `article`、`feed` 与 `stats` 需要移入各自的 Clarity 分组。
- 上游 `scripts` 与 `twikoo` 需要移入 `integrations.*`。
- 输出开关需要显式的 `features.*` 文档。
- 上游 app config 必须停止展开整个 `blog.config`；只有 UI 分组可以保留在 `clarity` 下。
- 上游 Content config 必须替换为 `createClarityContentConfig(clarityConfig)`。
- 消费者 `feeds.ts` 应尽可能移除自有 feed 导出与站点专属辅助函数；该文件只应包含友链分组。
- 重定向必须保持使用方持有，并继续转换为路由规则。
- 自定义模块、插件、服务端路由、运行时配置、部署设置与预渲染路由需要盘点与审查，而不是删除。
- 补丁必须保留在消费者包管理器配置中。
- 自定义组件与 Shiki 配置必须通过同路径覆盖规则保留。
- 目前没有夹具针对真实主题 API 证明这些规则。

## 8. Agent Skill 缺口

不存在 `.agents/skills/migrate-blog-v3-to-clarity/` Skill。缺失的必需资产：

- 符合规范的 `SKILL.md`，带指定的名称/描述 frontmatter；
- 发现、盘点、分类、计划、应用、验证、报告与回滚工作流；
- `references/migration-map.md`；
- `references/config-mapping.md`；
- `references/validation.md`；
- 针对最小 blog-v3、Twikoo、统计/feed、重定向、补丁、消费者组件覆盖与自定义 Shiki 的确定性夹具场景；
- 防止对 content、frontmatter、公共资源、重定向、补丁、未知模块与服务端代码进行破坏性变更的静态规则检查。

## 9. 发布阻塞项

状态更新（2026-09-22）：

1. ✅ 所有 ROADMAP P0 正确性事项已解决；P1 推迟项已记录在发布说明中。
2. ✅ 用户迁移、配置与自定义文档已完成。
3. ✅ 迁移 Skill 与知识参考已存在。
4. ✅ 可重复的迁移夹具/静态验证已存在。
5. ⏳ 完整有序验证套件在当前工作树通过；必须在确切 tag commit 上重跑（`publish.yml` 自动执行）。
6. ⏳ 真实 tarball 安装通过（`test:consumer`）；npm publish 演练在 `publish.yml` 中于 tag commit 上执行。
7. ✅ 包版本/tag 契约、更新日志、provenance 与回滚已在 `docs/PUBLISHING.zh-CN.md` 定义。
8. ✅ 上游基线最新。
9. ✅ 包导出、文件、许可证、元数据与泄漏检查通过，由 `pnpm release:check` 强制执行。
10. ✅ `docs/RELEASE-CHECKLIST.md` 已生成并评审。

剩余人工门禁：确认 npm 名称/所有权（该名称带有 2025-10-16 的 unpublish 墓碑记录）、配置 Trusted Publisher、打 `v0.1.0` tag 并发布 GitHub Release，以及发布后的 registry 消费者测试。

## 10. 可选增强

- 添加机器可读的迁移盘点模板。
- 把夹具验证从静态分类扩展为生成临时消费者并运行 typecheck/generate。
- 为 Agent 添加专用迁移报告格式。
- 添加发布后的 registry 漂移监控自动化。
- 添加针对性的无障碍、响应式、交互与远程服务失败测试。
- 使远程 CSS/字体来源可配置。
- 添加离线/受限 Shiki 构建覆盖。
- 在验证 Nuxt API 边界后减少有意的组件覆盖警告噪音。

## 11. 审计结论

Layer 抽取、包边界、配置 schema、Content 工厂、真实消费者测试、兼容性回归、playground、CI、上游 manifest 与补丁审计已基本到位。此前的 P0 正确性阻塞项（服务端/客户端配置拆分、feature-off 运行时语义、反镜像导航、no-op 固定链接契约）已修复并有针对性测试，发布管线（发布门禁、更新日志、带 provenance 的 OIDC 发布工作流、registry 消费者测试）已实现。

最高优先级的下一步是人工发布序列：确认 npm 名称/所有权、配置 Trusted Publishing、打 `v0.1.0` tag、发布 GitHub Release，并验证 registry 中的包。推迟的 P1/P2 事项继续显式记录在路线图与发布说明中。
