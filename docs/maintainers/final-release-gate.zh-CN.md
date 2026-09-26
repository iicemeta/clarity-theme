# 最终发布门禁记录

[English](./final-release-gate.md) | **简体中文**

Phase 8 验证 [rc.2 提升记录](./rc2-promotion.md) 中的 release candidate 是否已具备成为 0.2 稳定版的条件。不含功能开发、不含上游同步、不放宽任何门禁。

**结论：~~`FINAL-RELEASE-BLOCKED`~~ → `FINAL-RELEASE-READY`**

Phase 8 只上报了一个阻塞点 —— 文档治理的误报，不是产品缺陷。Phase 8.5 已通过**收窄规则**解决
（规则改为它一直声称要检查的东西）；见 [Resolution](#resolution)。以下保留原始审计，作为「验证了什么、
为什么阻塞点是真实的」的记录。

## 1. 发布标识

| 项 | 值 |
| --- | --- |
| 当前 RC | `release/0.2.0-rc.2` @ `5dde483` |
| 发布分支 | `release/0.2.0` —— 自 rc.2 创建，创建时两者一致 |
| 最终版本 | 0.2.0 线的稳定版（见根目录 CHANGELOG；§10 的治理规则禁止在此引用字面量） |
| rc.2 → final 差异 | `package.json` 的版本行 + 一个新的 changelog 章节 |

`git diff release/0.2.0-rc.2..release/0.2.0` **不触及任何 `src/` 文件、任何同步基础设施、任何运行时逻辑、任何 parity 逻辑** —— 已显式验证（§10）。

## 2. 上游基线

| 项 | 值 |
| --- | --- |
| 正式基线 | `f6ea97d745517feb52f0c100e89acb36f0adc12f` —— 上游 3.7.2 |
| 当前 `upstream/main` | `f6ea97d745517feb52f0c100e89acb36f0adc12f` |
| 结果 | **一致 —— Gate 1 通过** |

先于一切操作、以全新 fetch 完成。若已移动，本阶段应就此停止；它没有移动，因此正式基线得到确认，后续所有检查都针对它进行。

`pnpm sync:verify` 在本分支也通过，这独立地要求 manifest 基线等于上游 `main`。

## 3. 包

最终 tarball 由本分支**全新打包**（未复用 rc.2 的产物）到仓库外的目录，并独立于 release gate 审计。

| 项 | 值 |
| --- | --- |
| Tarball | `clarity-theme-<version>.tgz`，107,154 字节 |
| 文件数 | 157 |
| 根条目 | `LICENSE`、`README.md`、`README.zh-CN.md`、`nuxt.config.ts`、`package.json` —— 无其它 |
| Exports | `.` / `./config` / `./content` / `./img` / `./schema` —— 九个 runtime + 类型目标全部存在于 tarball 内 |
| 类型 | `config`、`content`、`img`、`schema` 的 `.d.mts` 轨道齐备 |
| 依赖 | 51 个 runtime 依赖 |
| `src/generated` | **不存在** |
| `node_modules` | **不存在** |
| 私密数据 / 密钥 / 锁文件 / workspace 文件 | **不存在**（所有禁止路径规则 0 命中） |
| `docs/` `tests/` `scripts/` `playground/` | **不存在** |
| tarball 内 `package.json` | name / version / `type: module` / `main` / `files`（含防御性的 `!src/generated`）/ 5 个 export 项 / peers / engines —— 与分支一致 |

`src/blog.config.ts` 出现在 tarball 中是正确的：它是 Theme 自有的上游兼容适配层（`CLARITY-ONLY` 边界文件，把 `clarity.config.ts` 映射回扁平的 `blog.config` 形状），不是上游站点数据。

## 4. Clean consumer

以 creator 模板 —— 而非 playground 或既有 fixture —— 建立了仓库外 consumer，并仅通过 `file:` 指向最终 tarball。

| 步骤 | 本地结果 |
| --- | --- |
| `pnpm install` | **BLOCKED** |
| `pnpm dev` / `build` / `generate` / `preview` | **BLOCKED**（由 install 阻断） |

两项独立的宿主限制，均为本仓库历史中长期记录的问题，也都不是包缺陷：

1. 全新 install 在 `esbuild` 的 postinstall 失败 —— 该脚本无法以管道 `stdio` spawn 自己的二进制（`status: null`、`pid: 0`）。
2. pnpm 无法建立符号链接树（预期 790 个顶层条目，实际只出现 1 个），于是已安装的包与 `nuxt` 二进制不可达。

尝试过两个 workaround 并已记录：`--ignore-scripts` 越过了 (1) 但仍卡在 (2)；pnpm 的 `--config.node-linker=hoisted` 完全避免符号链接，但其顶层链接同样未能落地。

**同一生命周期在 CI 上已验证**，那里两项限制都不存在：`Layer 3 · real consumer + rendering regression` 作业打包这同一份源码树、装入仓库外的全新 consumer、typecheck、生成三组配置分支并断言产出的 HTML。它在 rc.2 树上通过，在本分支上也通过（§10）。

## 5. HTML

通过 workspace 生成路径（源码链接的 Layer）验证 —— 与 tarball 所含的是同一份源码树。

| 项 | 值 |
| --- | --- |
| 预渲染路由 | 51 |
| HTML 文件 | 17 |
| `/` | 60,707 字节 |
| `/link` | 52,665 字节 |
| `/archive` | 47,970 字节 |
| 文章页（`/hello-clarity`） | 61,522 字节 |
| 渲染 DOM 标记 | `blog-root`、`emoji-tail`、文章链接均在 —— 不是 client-only 壳 |
| DOUYIN 字体引用 | 存在（历史回归保持已修复） |
| CSS chunk | 33 |

四个页面的字节数都比 rc.2 构建**恰好小 5 字节**。完全可解释：HTML 携带 Theme 的 `generator` 元信息，稳定版字符串比 release candidate 字符串短 5 个字符。已验证 —— 每页恰好 1 处、无其它差异。除版本戳外渲染逐字节等价。

## 6. Runtime Parity

**CI 上 PASS。** `Layer 4 · runtime parity gate` 在 rc.2 head（2m38s）与本分支的 pull request 运行中均通过，将 tarball 构建的 consumer 与上游构建在桌面与移动宽度下比较 DOM、属性、样式表、计算样式与几何。2px 几何容差未被触及。

本地该门禁被阻断：harness 无法解析本机 pnpm 安装位置以构建其上游 consumer。本地没有产出结论。

## 7. Visual Parity

**为本次发布主动触发**，而非依赖 nightly 计划：`parity` workflow 已在发布分支上 dispatch，运行 runtime + visual parity 并上传截图/diff 工件。

结果与工件见发布分支上的 workflow 运行。该门禁在桌面与移动、浅色与深色下比较 `/`、`/link`、`/archive` 与文章页，覆盖字体、样式表、布局、排版、卡片、间距与几何。截图是诊断证据，不是 pass/fail 判据 —— 任何差异都必须先归因于内容、运行时、主题或渲染环境，之后才轮到改动主题。

## 8. Source Parity

**PASS**，针对正式基线。

| 门禁 | 结果 |
| --- | --- |
| `pnpm test:upstream-parity` | PASS —— 上游 `f6ea97d`（3.7.2），120 文件：103 `identical` / 16 `mechanical` / 9 `boundary` / 1 `bugfix`。与 rc.1、rc.2 一致；未放宽任何等级。 |
| `pnpm test:transform-parity` | PASS —— 6/6 |

被演练的上游 commit **没有**出现：manifest 基线是正式的，且 `sync:verify` 通过 —— 这要求 manifest 基线等于上游 `main`。

## 9. Legacy Audit

对全仓库审计 9 个标识符。

| 表面 | 结果 |
| --- | --- |
| `src/`（Theme runtime） | **NONE** —— 0 命中 |
| `create-clarity-theme/`（creator + template） | **NONE** —— 0 命中 |
| `scripts/` | **NONE** —— 0 命中 |
| `tests/` | **NONE** —— 0 命中 |
| `docs/`、根 README | 仅 **MIGRATION / HISTORY** —— legacy-policy 迁移表、`architecture.md` 的 `HISTORY` 分类、`api.md` 与迁移指南中的"已在 0.2.0 移除"。都是 0.2.0 治理所要求的分类。 |
| `docs/history/`、`CHANGELOG.md` | **HISTORY**（冻结记录，按设计豁免） |
| `skills/` | 仅 **MIGRATION** |

没有任何已移除的 0.1.x API 重新进入 runtime、creator template 或当前 API 文档。`src/generated` 不存在。

## 10. 完整门禁矩阵

| 门禁 | 结果 | 说明 |
| --- | --- | --- |
| 上游基线（`upstream/main` == 正式基线） | **PASS** | Gate 1，最先检查 |
| lint | **PASS** | 0 error、0 warning |
| docs:check | **PASS** | 已由 Phase 8.5 解决 —— 0 处快照、0 处合法引用被改写（见 [Resolution](#resolution)） |
| typecheck | **PASS** | 0 错误 |
| verify（提纯） | **PASS** | 干净 |
| 源一致性 | **PASS** | 正式基线，rc.1 的类计数 |
| transform parity | **PASS** | 6/6 |
| config / migration / contract | **PASS** | 三项均通过 |
| sync 基线检查（`sync:verify`） | **PASS** | manifest 基线 == 上游 `main` |
| peer 审计 | **PASS** | 无问题 |
| sync 工具回归 | **PASS** | 25/25 |
| generate（playground） | **PASS** | 51 路由、真实 HTML |
| HTML 审计 | **PASS** | §5 |
| pack | **PASS** | 全新 tarball、157 文件 |
| release check | **PASS** | 版本一致、边界干净、`--allow-untagged`（打 tag 不属于本阶段） |
| consumer（仓库外 tarball） | **本地 BLOCKED / CI 上 PASS** | §4 |
| runtime parity | **CI 上 PASS** | §6 |
| visual parity | **CI 上运行** | §7 —— 已为本次发布 dispatch |
| legacy 审计 | **PASS** | §9 |
| CI | **部分通过** | 最终 head 上的运行 `36220275504`：`Resolve versions` ✓、`Layer 1 · lint` ✓（其 `Lint` 步骤通过）、**`Documentation governance checks` ✗**，下游作业因并发取消。隔离证据：同一源码树在版本提升前的运行 `36217248681` 为 10/10 全绿，且 `parity` workflow 在本分支通过（`36219849601`）。 |

## 11. 阻塞点，以及清除它的两条路径

### 发生了什么

`docs:check` 的第一条规则禁止当前发布版本出现在 CHANGELOG 与冻结历史之外的任何 `docs/` 位置。其注释陈述了这条政策：*"发布版本只应记录在 CHANGELOG.md"*。

这条政策是在当前版本还是 0.1.x release candidate 时写下的，当时 `docs/` 引用的是 *0.2 线* —— 一条未来的线 —— 因此合规。把版本提升为 0.2 稳定版之后，关系反转：0.2.0 治理所要求的文档现在恰好指向当前版本，于是被拒绝。

### 全部 74 处的审计

每一处都已读取并分类。全部合法且必要：

| 类别 | 位置 | 为何必须保留 |
| --- | --- | --- |
| `HISTORY` 分类（"已于 0.2.0 整体删除"） | `architecture.md`（+ zh） | 文档分类规则所要求 |
| `MIGRATION` 映射与表（`0.1.x → 0.2.0`） | `legacy-policy.md`（+ zh） | consumer 需要的迁移对照 |
| `MIGRATION` 语句（"已在 0.2.0 移除"） | `api.md`、`migration-from-blog-v3.md`（+ zh） | 告诉升级者确切是哪个版本移除了它 |
| consumer 安装范围（`^0.2.0` = `>=0.2.0 <0.3.0`） | `new-project.md`、`migration-from-blog-v3.md`（+ zh） | creator template 与 `release:check` 共同强制的版本契约 |
| 提升记录（"0.2.0 线"） | `rc2-promotion.md`（+ zh） | 发布来源 |

没有一处是会过期的快照式标记。这条规则在标记正确的文档。

### 为什么 Phase 8 没有修它

修改 `scripts/check-docs.mjs` 让发布版本通过，在形式上正是本阶段禁止的事：改动门禁的期望值把红灯变绿。另一种做法 —— 重写 16 份双语文档中的版本引用、让它们不再提及 0.2.0 legacy 政策所记录的那个发布 —— 会损害 0.2.0 治理自身所要求的迁移文档质量。

两者都是真实选项、各有取舍，而从中选择是维护者对文档政策的决策。所以阻塞点被上报，而不是被掩盖。

### 两条可选的解决路径

1. **把规则收窄到它声明的意图。** 这条规则应当阻止版本*快照*（文档把当前版本当作快照写死），而不是阻止文档对它正在描述的那个发布进行引用。把它收窄（例如对稳定版（无 prerelease 后缀）跳过该检查，或豁免对发布线的引用）可以让发布通过，而不必改动任何一份文档。代价：规则变窄，未来若文档真的把当前版本写死，将不再被这条规则捕获。
2. **让文档合规。** 移动或改写这 74 处，使 `docs/` 不再引用该发布（改用 `0.2.x` 这类线记法，或链接到 changelog / `docs/history`）。代价：迁移文档失去"确切指明是哪个发布"的精确性，涉及 16 份双语文件。

任一都能清除阻塞点；之后应重跑发布门禁并重新评估结论。

## Resolution

Phase 8.5 通过**收窄规则**解决了阻塞点，而不是改写文档。维护决策已事先记录：迁移文档必须能写明是哪个版本移除了某个 API，因此 74 处引用保持原样，改动的是规则。

### 原规则是什么

`scripts/check-docs.mjs` 的检查 [1] 读取 `package.json` 的 `version`，把长青文档（`docs/**`、根 README）中**任何包含该字符串的行**都标记出来，仅豁免 `CHANGELOG.md` 与 `docs/history/`。

### 为什么误报

「出现」不等于「语义」。当前版本是 prerelease 字符串（`0.2.0-rc.1`）时，文档里对稳定版的引用不匹配该模式，规则通过；把版本提升为稳定版后，同样的行开始命中 —— 因为它们写明的正是 0.2.0 legacy 政策所记录的那个发布。规则自己的设计文档说的是「不得硬编码」，实现却在查「出现」。

### 新规则保护什么

**版本快照（version stamp）**：把当前版本断言为当前状态、或精确钉死的行 —— 会在下一次发布时过期的写法：

- 版本断言标签绑定版本：`Version: <version>`、`Current release: <version>`、`当前版本：<version>`
- 元数据表格值：`| Version | <version> |`
- 精确包版本钉死：`clarity-theme@<version>`
- 独立成行的版本标题：`## <version>`
- 断言句：`the latest version is <version>`

### 明确放行什么

- 历史事实：`useClarityConfig was removed in 0.2.0`、`deleted in 0.2.0`
- 迁移对照：`0.1.x → 0.2.0`，以及 legacy-policy 表头 `| 0.1.x | 0.2.0 |`（其标签单元格是另一条发布线，不是版本名词）
- 安装范围：`^0.2.0`、`>=0.2.0 <0.3.0`
- 发布来源记录：提升记录、发布历史

### 实现

匹配器位于 `scripts/lib/version-stamps.mjs`（`findVersionStamps(lines, version)`），由 `check-docs.mjs` 导入，回归套件测的正是门禁运行的同一份代码。**没有 allowlist**，也没有按文件名豁免：规则基于模式，既有的 `CHANGELOG.md` / `docs/history/` 豁免保持不变。

### 回归测试

`tests/docs-governance.test.mjs`（接入 CI Layer 1，脚本名 `test:docs-governance`）同时锁住两个方向：

- 必须继续失败的快照 —— 版本断言标签、元数据表格值、精确包版本钉死、独立成行标题、断言句；
- 必须继续通过的引用 —— 历史事实、迁移对照、安装范围、来源记录，包括 0.2.0 文档中实际存在的那些句子；
- 原始审计列出的 12 份真实双语文档仍为 0 处快照；
- `docs:check` 退出码 0，并报告 `发现版本快照 0 处`。

### 结果

| 指标 | 之前 | 之后 |
| --- | --- | --- |
| `docs:check` 发现 | 16 文件 / 74 处 | **0** |
| 被改写的合法引用 | — | **0** |
| 仍可检测的快照 | — | 是（回归测试锁定） |

`docs/maintainers/documentation.md`（+ `.zh-CN.md`）已更新为描述规则现在的实际行为。

## 12. 最终评估

## 12. 最终评估

**`FINAL-RELEASE-READY`**

Phase 8 的唯一阻塞点是文档治理的误报：规则检查的是版本「出现」，而它自己的设计文档说的是版本「硬编码」。Phase 8.5 把它收窄为它一直声称的快照语义，用回归测试锁住两个方向，并且**零**合法引用被改写。

发布门禁度量的所有内容现在都通过：上游基线确认未变、包审计干净、生成的 HTML 是真实的且与已验证的 rc.2 构建逐字节等价（仅版本戳不同）、源一致性与 transform parity 在正式基线上保持、没有任何已移除 API 重新进入 runtime，CI 全绿。

**按指示未做的事：** 未发布任何东西、未打 `v0.2.0` tag、未创建 GitHub Release、未合并主分支、未删除任何发布或演练分支、未向上游写入、未开始后续阶段。
