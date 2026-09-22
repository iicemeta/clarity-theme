# 发布清单

[English](./RELEASE-CHECKLIST.md) | **简体中文**

> 清单日期：2026-09-22，Asia/Taipei。v0.1.0 的 P0 正确性门禁已解决，发布管线已实现。当前工作树在打 tag 前通过了有序验证套件；实际发布仍需在确切 tag 上运行一次，并完成第 9 节的 npm/GitHub 人工步骤。

图例：

- `[x]` 完成
- `[ ]` 未完成
- `[!]` 需要人工确认或 commit 后动作

## 1. 必需文档

- [x] `README.md` 面向用户，覆盖介绍、功能、要求、安装、快速开始、迁移、配置、自定义、开发、测试、上游同步、发布状态与许可证。
- [x] `docs/MIGRATION.md` 覆盖已测试的 blog-v3 基线、备份、盘点、有序迁移、字段/文件映射、补丁归属、数据安全、验证与故障排查。
- [x] `docs/CONFIGURATION.md` 记录 `site`、`article`、`feed`、`stats`、`integrations`、`features`、`changelog`、app-config 边界、可见性、默认值与完整示例。
- [x] `docs/CUSTOMIZATION.md` 记录 UI 配置、组件覆盖、Shiki、CSS、自定义应用文件、服务端路由、路由规则、公共资源与验证。
- [x] `docs/COMPATIBILITY.md` 由兼容性契约生成，并记录当前自动化矩阵。
- [x] `docs/PATCHES.md` 记录补丁为何保持使用方持有，并裁定每个已知补丁。
- [x] `.agents/skills/migrate-blog-v3-to-clarity/SKILL.md` 有有效的标准 frontmatter 与必需的发现/盘点/分类/计划/应用/验证/报告/回滚工作流。
- [x] Skill 参考包含文件映射、字段映射与验证成功标准。
- [x] `docs/RELEASE-AUDIT.md` 记录收尾前审计、实际状态、缺口、阻塞项与可选工作。
- [x] 本发布清单存在，并区分已完成工作与发布阻塞项。

## 2. 迁移能力

- [x] 已测试源基线被显式文档化为 commit `f6ea97d745517feb52f0c100e89acb36f0adc12f` 上的 blog-v3 3.7.2。
- [x] 根级站点字段、article 字段、feed/stats 字段、scripts、Twikoo、功能开关与 app UI 字段有显式映射。
- [x] 指南禁止把文章、友链数据、重定向、补丁、部署数据、密钥或公共资源移入主题。
- [x] 消费者 `feeds.ts`、重定向、补丁、自定义模块、自定义服务端路由、自定义组件与自定义 Shiki 配置有文档化的保留规则。
- [x] 一个伪消费者夹具覆盖最小源形态、Twikoo、feed/统计、重定向、补丁、组件覆盖、自定义 Shiki、自定义模块、自定义服务端路由、受保护内容与受保护公共资源。
- [x] `pnpm test:migration` 验证 Skill 契约、夹具发现、真实 Clarity 配置 schema、UI 边界、受保护分类与迁移场景。
- [ ] 尚未实现把 Skill 应用于临时 Git 仓库并运行真实迁移消费者构建的全自动 Agent 执行测试。

## 3. Skill 能力

- [x] Skill 名称恰为 `migrate-blog-v3-to-clarity`。
- [x] 描述匹配必需的触发与保留范围。
- [x] 发现环节识别 blog-v3 源文件与基线差异。
- [x] 盘点包含 site/article/integration/UI/feed/redirect/patch/自定义模块/组件/服务端/包数据。
- [x] 每个资产必须分类为 `AUTO`、`REVIEW`、`KEEP` 或 `NEVER_TOUCH`。
- [x] 编辑前必须有计划，并记录当前状态、目标状态、原因、风险与人工审查。
- [x] 应用规则禁止对文章、frontmatter 语义、公共资源、重定向、补丁、未知模块与服务端代码进行破坏性变更。
- [x] 验证要求串行 install/typecheck/generate 加既有项目测试。
- [x] 报告必须包含新增/修改/删除/保留文件、未解决项、失败与完成状态。
- [x] 回滚要求干净的起始工作树，并在存在既有用户变更时停止。
- [x] 详细知识保留在 references 中，而不是塞满 `SKILL.md`。

## 4. 包契约

- [x] 包名为 `clarity-theme`。
- [x] 当前包版本为 `0.1.0`，即计划的首个 npm 发布版本。
- [x] 首个发布版本/tag 决策：从 `v0.1.0` tag 发布 `0.1.0`。
- [x] License 字段为 MIT 且包含 `LICENSE`。
- [!] 发布前应由维护者/法律审查者确认现有 MIT 版权署名是否需要追加当前权利人行。
- [x] 包元数据有 repository、homepage、bugs、engines 与包管理器数据。
- [x] 包元数据没有作者 email 或其他个人联系字段。
- [x] 五个导出存在：`.`、`./config`、`./content`、`./img` 与 `./schema`。
- [x] 运行时与类型声明入口由真实消费者测试解析。
- [x] `files` 包含 Layer/config/运行时负载，排除 docs、playground、tests、CI、Skill、同步 manifest、workspace 文件与 lockfile。
- [x] 真实 `pnpm pack` 审计报告 151 个文件，包括全部 30 个必需文件（含中文 README、`config/server.ts`、`server/utils/clarity.ts`）。
- [x] Tarball 审计未发现上游私有标识、文章或私有配置。
- [x] 主题纯度验证未发现禁止的作者/站点数据或跨项目导入。
- [x] 消费者补丁保留在包负载之外。
- [x] `publishConfig.access` 为 `public`。
- [x] `CHANGELOG.md` 存在面向使用者的 `0.1.0` 条目。
- [x] 运行时依赖完整声明（48 个，经 pack 审计验证）。
- [x] `main`、`type`、`engines`、`peerDependencies` 与 `packageManager` 已冻结，并由 `pnpm release:check` 断言。

## 5. 正确性与发布阻塞项

- [x] P0-1：服务端消费配置（`feed.*`、完整 `stats.*`、feature 路由开关、`site.author.email`）移入 Nitro 私有 runtimeConfig；客户端 appConfig 仅保留渲染必需子集；由消费者 bundle/产物断言覆盖。
- [x] P0-2：feature-off 路由在 dev/SSR 运行时返回 404（`test:consumer` 中 `nuxt build` + 真实服务断言），同时静态产物缺省。
- [x] P0-3：反镜像导航已修正（从 `site.url` 派生规范主机），并由 `test:compatibility` 的真实浏览器镜像主机用例验证。
- [x] P0-4：no-op 的 `useRandomPermalink` 字段已从 schema、文档、迁移映射与测试中移除。
- [x] P1-2：多模式统计选择验证为并集语义（`@nuxt/content` 3.16 的 `orWhere` 组），并由 `posts/% + notes/%` 消费者回归锁定。
- [ ] P1-1：使远程 CSS/字体来源可配置。**已推迟**到里程碑 2；在 0.1.0 发布说明中记录为已知限制。
- [ ] P1-3：补全已知上游派生路径的同步 manifest 分类。**已推迟**到里程碑 2；记录为已知限制。
- [ ] P1-4：添加 TypeScript/MJS 一致性门槛。**已推迟**到里程碑 2；记录为已知限制。
- [x] P1-6：设计首个 npm 发布工作流。执行（实际发布）仍是人工发布动作。
- [x] 在发布说明中解决或显式延后其余每个 P1/P2 项（P1-1/P1-3/P1-4/P1-5 与 P2 项记录在 `CHANGELOG.md` 与 `docs/RELEASE-NOTES-0.1.0.md`）。

这些事项在[路线图](./ROADMAP.zh-CN.md)中跟踪。文档完成不能清除它们。

## 6. 上游基线

- [x] Manifest 仓库是预期的上游仓库。
- [x] Manifest 分支为 `main`。
- [x] Manifest commit 为 `f6ea97d745517feb52f0c100e89acb36f0adc12f`。
- [x] Manifest 上游版本为 3.7.2。
- [x] Manifest 记录 Nuxt 4.5.2 与 Content `^3.16.0`。
- [x] `pnpm sync:check` 通过：远端头仍是 `f6ea97d`。
- [x] 每周同步工作流只读，并创建/复用漂移 issue。
- [x] 事务式 apply、冲突阻止、回滚与未知路径保护有 13 个通过的测试。

## 7. CI

- [x] CI 在从 `engines.node` 派生的固定 Node 矩阵上运行 lint 与 Layer 1 检查。
- [x] pnpm 从 `packageManager` 安装。
- [x] Layer 1 现包含 `pnpm test:migration`。
- [x] Layer 2 运行 playground 生成。
- [x] Layer 3 运行真实消费者与渲染兼容性。
- [x] 作业保持严格有序，不并发运行构建/测试阶段。
- [x] 工作流权限受限。
- [x] `publish.yml` 仅在 `release: published` 触发：检出 tag、校验 tag/version 一致、串行重跑有序套件、打包/审计同一个 tarball，并以 OIDC provenance 发布。
- [x] 发布工作流权限最小化（`contents: read`、`id-token: write`），不保存 `NPM_TOKEN`。
- [!] 更新后的工作流必须在本工作树 commit 后在 GitHub 上运行；此处只运行了本地等价套件。

## 8. 验证证据

所有命令于 2026-09-22 串行运行。

| 命令 | 最终结果 | 备注 |
| --- | --- | --- |
| `pnpm lint` | ✅ 通过 | 导入/代码块修复后无错误 |
| `pnpm typecheck` | ✅ 通过 | 预期的有意图 `NUXT_B3011` Badge 覆盖警告 |
| `pnpm verify` | ✅ 通过 | 无私有数据或跨项目导入泄漏 |
| `pnpm test:sync` | ✅ 通过 | 13/13 测试 |
| `pnpm test:contract` | ✅ 通过 | 41 个契约行与必需覆盖引用 |
| `pnpm generate` | ✅ 通过 | 51 条预渲染路由；一条已知链接检查器警告 |
| `pnpm test:consumer` | ✅ 通过 | 打包、导出、独立安装、typecheck、三种生成变体、客户端配置边界断言与 features-off 运行时 404 服务检查 |
| `pnpm test:compatibility` | ✅ 通过 | 52 个断言组；24 条 SSR、12 条浏览器、11 条水合路由，以及真实浏览器反镜像导航用例（`127.0.0.1` → `localhost`） |
| `pnpm test:migration` | ✅ 通过 | 10/10 测试 |
| `pnpm peers check` | ✅ 通过 | 无 peer 依赖问题 |
| `pnpm sync:check` | ✅ 通过 | 上游基线最新 |
| `pnpm release:check --allow-untagged` | ✅ 通过 | package/tag/CHANGELOG 契约、exports/files、pack 与 151 文件 tarball 边界；确切 tag 强制校验在发布工作流中执行 |
| `pnpm pack` | ✅ 通过 | `artifacts/clarity-theme-0.1.0.tgz`，151 个文件，SHA-256 `790639b8a0a4ae644840244c844c9978635d2bf2779cd8e11847c6852527fa6c` |
| `npm publish ./artifacts/clarity-theme-0.1.0.tgz --dry-run` | ⛔ Registry 拒绝（预期） | Registry 报错：`0.1.0` 已被绕过流程发布（见第 9 节）；修正后的发布必须是 `0.1.1` |
| `pnpm test:registry-consumer` | ❌ 针对已发布 `0.1.0`（预期） | 安装真实 registry 包后，**在已发布包内部** typecheck 失败（`stats.get.ts` 的 `orWhere` void 返回、`link.vue` 的 `never[]` feeds 类型）——两者均已在当前树修复；必须对修正后的发布版本通过 |
| `git diff --check` | ✅ 通过 | 无空白错误 |

已知非致命警告：

- 有意的重名组件覆盖警告（`NUXT_B3011`）；
- playground/消费者友链数据中一条绝对站点 URL 链接检查器警告；
- 既有的 Vue slot/readonly、og:image、twitter:card 与外部资源警告类别；
- 隔离消费者安装期间 pnpm 报告两个已废弃传递依赖与一条 peer 摘要提示，而 `pnpm peers check` 通过；
- 部分客户端 chunk 超过 500 kB，且 Shiki 使用远程 esm.sh 导入。

### 过程中的失败（已纠正）

- 首次 `pnpm lint` 在 Markdown 导入顺序/不完整代码块、夹具导入顺序/包键顺序与 `node:test` 导入策略上失败。文档与夹具已纠正；最终 lint 通过。
- 首次 `pnpm test:migration` 在编号标题期望、Windows 动态导入路径与不完整夹具计划上失败。已纠正。
- 第二次迁移运行暴露了在 Nuxt 之外调用 Content 工厂时的构建期 Zod 解析依赖。该测试现在静态验证公共工厂契约，而真实消费者/兼容性套件在 Nuxt 中行使该工厂。最终迁移测试通过。

没有测试被报告为当前失败。

## 9. 发布门槛

### 包发布

- [x] package metadata
- [x] publishConfig
- [x] tarball boundary
- [x] release-check
- [x] Git tag/version validation
- [x] publish workflow
- [x] OIDC permissions
- [x] npm trusted publisher documentation
- [ ] actual npm publish
- [ ] npm install from registry
- [ ] final exact-commit verification

### 人工门禁

- [x] 所有 ROADMAP P0 项已解决；P1/P2 推迟项已记录在发布说明中。
- [!] **检测到绕过流程的发布**：`clarity-theme@0.1.0` 已于 2026-09-22T07:28:22Z 被发布到 npm，发布者 `creampack <creampack@iicemeta.com>`，gitHead `5a03778`（P0 修复前代码树，未经过发布工作流，无 provenance）。registry 消费者测试在该已发布包内部 typecheck 失败（见第 8 节）。
- [!] 需要维护者决策：确认发布者与意图；将修正后的门禁发布计划为 **`0.1.1`**（npm 禁止重新发布 `0.1.0`）；可选执行 `npm deprecate clarity-theme@0.1.0`；**绝不自动 unpublish**。
- [!] Commit 已审查的工作树、提升到选定的发布版本、打 tag，并在该确切 tag 上重跑完整有序套件（发布工作流会自动执行）。
- [x] 发布 tag、更新日志、provenance、产物校验和与回滚流程已在[发布指南](./PUBLISHING.zh-CN.md)定义。
- [x] npm 包名已核实：`clarity-theme` 在 registry 上存在一个（绕过流程的）可用 `0.1.0`；维护者包含 `creampack <creampack@iicemeta.com>`。
- [ ] 获得 MIT 版权声明的维护者/法律确认。
- [ ] 配置 npm Trusted Publisher（见[发布指南 §6](./PUBLISHING.zh-CN.md#6-trusted-publisher一次性人工配置)）。
- [ ] 通过发布修正后版本的 GitHub Release 触发发布工作流。
- [ ] 评审最终 tag、包 tarball 校验和、provenance、发布说明与回滚计划。
- [ ] 发布后：运行 `pnpm test:registry-consumer` 并用 `npm view` 验证已发布版本。

## 结论

**收尾文档、迁移指引、Skill、夹具、CI 接线与本地验证：完成。**

**首次公开 npm 发布：被绕过流程的 `0.1.0` 发布阻塞。** 当前树已解决全部正确性阻塞项，发布管线已实现并文档化；但 registry 已存在一个由修复前代码树构建、未经门禁的 `0.1.0`。修正后的发布必须以 `0.1.1` 走文档化工作流；`0.1.0` 保持发布状态（可 deprecate，绝不自动 unpublish）。「工作流已创建」不等于「发布已完成」——在 registry 存在经门禁的版本之前，不要勾选第 9 节的发布项。
