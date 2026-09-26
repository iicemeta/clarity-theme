# 第二个 Release Candidate 提升记录

[English](./rc2-promotion.md) | **简体中文**

上游更新演练在 Clarity 自身的同步基础设施里发现了若干缺陷。本页记录其中哪些被提升进 0.2.0 线的第二个 release candidate、哪些留在演练分支，以及原因。

全程遵循的规则：**只有 Clarity 自有、且与所演练的上游内容无关的改动才允许提升。** 已审查的上游基线不得移动。

## 1. 基线

| 项 | 值 |
| --- | --- |
| rc.1 commit | `085edce` |
| rc.2 head | rc.2 发布分支 —— rc.1 加上 §3 的提升提交 |
| 提升的提交 | `461d812`、`010b5ef`、`1b34fcc`、`b765502`、`80c06fb` |
| 版本 | 0.2.0 线的第二个 release candidate |
| **上游基线（未变）** | `f6ea97d745517feb52f0c100e89acb36f0adc12f` —— 上游 3.7.2 |
| 演练目标（未提升） | 上游开发分支 `8d5b4aaa6f1a2ca8076d42a17d54ab426059fc08` —— 上游 3.8.0 |

关于文档治理规则：当前版本字符串不得出现在 `CHANGELOG` 与冻结历史之外的 `docs/` 中，因此本记录以"发布线 + 分支"的方式表述，而不直接引用字面版本号。确切版本以根目录 CHANGELOG 为准，确切 head 以 rc.2 分支上的 `git log` 为准。

## 2. 演练发现

演练记录在 `rehearsal/upstream-update` 分支（`docs/maintainers/upstream-update-rehearsal.md`）。共发现 8 个缺陷，其中 6 个属 Clarity 自有并已提升，2 个与所演练的上游内容绑定、留在原地。

| # | 缺陷 | 分类 |
| --- | --- | --- |
| 1 | 已声明的机械变换无法被应用：同步工具完全不知道 parity manifest，于是每个机械改写文件都被判为"本地已适配"，整次事务性 apply 中止。任何现实的上游更新都无法同步。 | **提升** |
| 2 | 上游新增文件被原样写入，于是新增的、引用消费项目别名的文件会带着坏导入落地。 | **提升** |
| 3 | boundary / bugfix 文件被当成"未分类"，以误导性的"请更新 manifest"消息阻塞 apply。 | **提升** |
| 4 | 三个上游根文件没有分类，阻塞每次 apply（`README.md`、`pnpm-lock.yaml`、`MIGRATION.md`）。 | **提升** |
| 5 | 被上游重构作废的声明会留下无法解释的冲突，且没有记录人工决策的途径。 | **提升** |
| 6 | 无法针对 manifest 分支以外的上游 ref 运行，这让演练在一开始就不可能。 | **提升** |
| 7 | `commitManifest` 给 `*.json` 追加末尾换行，每次同步都违反仓库 lint 规则。 | **提升** |
| 8 | sync 测试 harness 用默认 `stdio` spawn 子进程，导致 Windows 宿主上 18 个测试全部报 `status: null`，套件静默不可验证。 | **提升** |

第 7、8 项是 Clarity 自有工具与测试的纯正确性/可移植性修复。第 8 项与 Phase 5 在 `scripts/` 里修过的那类遗漏同源：实现被硬化了，spawn 它的 harness 没有。

## 3. 已提升

进入本 release candidate 的是三个文件，加上发布元数据。

| 文件 | 改动 | 测试 | 为何属于通用 |
| --- | --- | --- | --- |
| `scripts/sync-upstream.mjs` | 期望本地状态改为 `<基线 + 已声明替换>`；声明的变换对新文件同样执行；过期声明大声失败；`boundary`/`bugfix` 单列阻塞桶；`--ref <branch>`；`--accept <path>`；manifest 不再带末尾换行 | `tests/sync-upstream.test.mjs` | 工具以通用方式读取 parity manifest，其中没有任何一处引用所演练的上游内容；在当前基线上行为完全一致。 |
| `tests/sync-upstream.test.mjs` | 子进程固定 `stdio`；一处裸 `execFileSync` 改走硬化 helper；新增 7 个回归用例（18 → 25） | 自身 | 测试 harness 可移植性 + 对提升行为本身的覆盖。 |
| `sync-manifest.json` | `README.md`、`pnpm-lock.yaml` 声明为 `exclude`；`MIGRATION.md` 声明为 `manual` | 同上 | 纯同步面分类条目，不含任何上游内容；且在当前基线上是惰性的 —— `MIGRATION.md` 在那里根本不存在。 |
| `package.json` | 版本 → rc.2 | — | 发布元数据。 |
| `CHANGELOG.md` | rc.2 条目，描述被提升的基础设施 | — | 发布元数据。 |
| `docs/maintainers/project-status.md`（+ `.zh-CN.md`） | 同步工具能力与剩余的"仍需人工复核"限制 | — | 文档。 |
| `docs/maintainers/rc2-promotion.md`（+ `.zh-CN.md`） | 本记录 | — | 文档。 |

提升相对于上游是"零内容"的证据：

- `scripts/sync-upstream.mjs` 与 `tests/sync-upstream.test.mjs` 与演练分支**逐字节一致**。
- `sync-manifest.json` 与演练分支的差异**仅在** `upstream.commit`、`upstream.version`、`upstream.syncedAt` —— 即被有意不提升的基线元数据。

## 4. 留在演练分支

以下内容只存在于 `rehearsal/upstream-update`，**不在**本 release candidate 中。

| 区域 | 文件 | 为何保留 |
| --- | --- | --- |
| 上游源码树 | `src/` 下 96 个文件（components、composables、pages、plugins、styles、stores、utils、shared） | 上游内容。Theme 尚未跟踪 3.8.0。 |
| 样式入口重命名 | `assets/css/*.scss` → `.css`，新增 `animation.css`，删除 `_variable.scss` | 上游 3.8.0 内容。 |
| Transform 适配 | `nuxt.config.ts`、`eslint.config.mjs`、`package.json`（`postcss-nesting`）、`pnpm-lock.yaml`、`stylelint.config.mjs` | 3.8.0 专属 transform 复核；只有对着 3.8.0 源码与 3.8.0 基线才成立。 |
| Parity 声明 | `tests/upstream-parity.manifest.json` | 跟踪 3.8.0 的 composable 拆分。提升它会在当前基线破坏源一致性：`useArticle.ts` 在那里仍引用 `~/types/article`。 |
| 演练记录 | `docs/maintainers/upstream-update-rehearsal.md`（+ `.zh-CN.md`）及其索引条目 | 描述 3.8.0 delta。与它所记录的演练放在一起，避免让本 release candidate 暗示已覆盖 3.8.0。 |
| 3.8.0 transform 注册表 | `docs/maintainers/transform-parity.md`（+ `.zh-CN.md`）、`docs/guides/customization.md`（+ `.zh-CN.md`） | 注册表行、`postcss-nesting` 行、`vite.css.additionalData` 的 DROP、`_variable.scss` 指引都是 3.8.0 专属，在当前基线上是错的。 |

### 已延后、未提升

在一个 3.8.0 专属文件里发现过一处通用修复，**未**提升，因为它不属于同步基础设施，而规则 12 要求拿不准的改动留在原地：

- `docs/maintainers/transform-parity.md`（+ `.zh-CN.md`）：描述 `clarity-config` 的那一行仍把已删除的 0.1.x app-config 键列为注入来源之一。这是 0.2.0 legacy 移除留下的过期句子，不是同步问题，应在文档整理中修正，而不是夹带在同步提升里。

同样有意排除在范围外的：演练中延后的依赖清理（Stylelint 工具链、闲置的 `@nuxt/a11y` devDependency）与 `sass-embedded` 的保留决策。三者都是 3.8.0 transform 复核的后果，随它一起留在演练分支。

## 5. 验证

| 门禁 | 结果 | 说明 |
| --- | --- | --- |
| lint | **PASS** | 0 error、0 warning |
| docs | **PASS** | `docs:check`：120 个配对文档、629 条链接、8 个 changelog 章节、无版本污染 |
| typecheck | **PASS** | 0 个 TypeScript 错误 |
| verify | **PASS** | 提纯审计干净 |
| 源一致性 | **PASS** | 对正式基线 `f6ea97d`：120 文件、103 `identical` / 16 `mechanical` / 9 `boundary` / 1 `bugfix` —— **与 rc.1 完全相同，未放宽任何等级** |
| transform parity | **PASS** | 6/6 |
| sync 工具回归 | **PASS** | 25/25（演练前为 18） |
| sync 基线检查 | **PASS** | `sync:verify` 报告基线等于上游 `main` —— 证明演练基线未被带入 |
| config / migration / contract | **PASS** | 三项均通过 |
| peer 审计 | **PASS** | 无问题 |
| consumer（仓库外 tarball） | **CI 上 PASS** | 本地被阻断（全新 `pnpm install` 在本机 `esbuild` postinstall 失败）；CI 作业 `Layer 3 · real consumer + rendering regression` 以 5m31s 通过 |
| generate（playground） | **PASS** | 51 条预渲染路由；`/`、`/archive`、`/link` 与文章页产出真实 HTML，且与 rc.1 的测量字节数一致 |
| runtime parity | **CI 上 PASS** | 本地被阻断（harness 无法解析本机 pnpm 安装位置）；CI 作业 `Layer 4 · runtime parity gate` 以 2m38s 通过 |
| visual parity | **NOT RUN** | 按设计是 nightly/dispatch 诊断，被排除在 PR 门禁外 |
| pack / release check | **PASS** | tarball 已审计 —— 157 文件、51 个 runtime 依赖、无越界、版本一致 |
| CI | **PASS** | rc.2 head 上的运行 `36216767950`：10 个作业全绿，含本地无法运行的那两个门禁 |

本地结果与 CI 结果**特意分开**报告：本机无法创建符号链接、无法用管道 `stdio` spawn 子进程、无法完成全新依赖安装，因此 consumer 与 runtime parity 在本地没有结论。两者由 CI 确认，而非假定通过。

## 6. 基线完整性

| 概念 | Commit | 位置 |
| --- | --- | --- |
| 正式发布基线 | `f6ea97d745517feb52f0c100e89acb36f0adc12f`（上游 3.7.2） | 本分支的 `sync-manifest.json` |
| 演练目标 | `8d5b4aaa6f1a2ca8076d42a17d54ab426059fc08`（上游 3.8.0） | 仅在 `rehearsal/upstream-update` 的 `sync-manifest.json` |

两者不可互换，也未被混淆。证据：

- 本分支上 `sync:verify` 通过，这要求 manifest 基线等于上游 `main`；它在演练分支上按设计失败。
- 源一致性从 manifest commit 解析上游内容，报告 `f6ea97d`（3.7.2）且类计数与 rc.1 相同。
- `sync-manifest.json` 与 rc.1 逐字节一致，只多了 §3 所述的三条分类列表新增。

## 7. 最终评估

**`RC2-READY`**

已提升：通用同步基础设施与它的回归测试，加上发布元数据与文档。未提升：任何上游内容、任何只对着所演练上游基线才成立的 transform 改动、以及被演练的基线本身。

本机可运行的所有门禁均通过，源一致性相对 rc.1 未变，正式基线可证明未被污染。本地无法运行的两个门禁已由 CI 确认（10 个作业全绿），而非假定通过。

**按指示未做的事：** 未发布任何东西、未创建正式 0.2.0 发布、未合并主分支、未合并演练分支、未删除演练分支、未向上游写入、未开始后续阶段。
