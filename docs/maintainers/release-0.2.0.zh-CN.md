# 发布记录 — 正式 0.2.0（Phase 9）

[English](./release-0.2.0.md) | **简体中文**

本次 npm 正式发布的来源记录文档。本文中的每一个版本引用都描述*这一次*发布，
而非仓库的当前状态。秘密信息（token、账号凭据）刻意不记录。

## 发布事实

| 条目 | 值 |
| --- | --- |
| 发布分支 | `release/0.2.0` |
| 标签 | `v0.2.0`（annotated，tag 对象 `5911f20`） |
| 标签指向提交 | `f941e9e26194c4c9193eb1aeefeac04e8e5d58a5` |
| 合入默认分支 | PR #7 已合并（merge commit `cb49c703c26c807a0bc4abb27b453e50a428af87`） |
| 上游基线 | `f6ea97d745517feb52f0c100e89acb36f0adc12f` —— 打标签前再次核对与 `upstream/main` 一致 |
| 包名 | `clarity-theme` |
| 发布的包版本 | `0.2.0` |
| GitHub Release | https://github.com/iicemeta/clarity-theme/releases/tag/v0.2.0（正文取自 CHANGELOG 的 0.2.0 章节） |

## 打标签前的 preflight（全部 PASS）

- 工作树干净；分支 `release/0.2.0` 与远端同步。
- `upstream/main` == `f6ea97d…`（自最终 release gate 以来未移动）。
- npm registry 检查：发布前 `0.2.0` 版本位为空。
- 发布路径判定：仓库的 `publish.yml` 负责 npm 发布（GitHub Release → OIDC
  Trusted Publishing）；全程未手动执行 `npm publish`。
- Tarball 审计：本地 `pnpm pack` 产出 `clarity-theme-0.2.0.tgz`
  （SHA-256 `39fd40de9242df96468189d60c31b70a34fc50422398205dfe4ee1368ad65435`，
  107,164 字节）。文件边界干净（无 `src/generated`、无 lockfile 与私有文件）；
  九个 exports 条目全部指向 tarball 内实际存在的文件。

## 发布流水线

`publish.yml` run [36228406132](https://github.com/iicemeta/clarity-theme/actions/runs/36228406132)，
由 GitHub Release 触发。所有步骤成功：完整有序验证（lint、typecheck、主题提纯、
sync 回归、migration 回归、兼容性契约、peer 审计、playground 静态生成、真实
tarball consumer、SSR/浏览器/hydration 兼容、release gate）、最终 pack、tarball
审计、发布 dry-run、以及 OIDC 正式发布。全程不涉及长期 npm token。

## 发布后的 registry 状态

- registry 上存在包版本 `0.2.0`；`dist-tags.latest` 指向它。
- registry tarball：`https://registry.npmjs.org/clarity-theme/-/clarity-theme-0.2.0.tgz`，
  `dist.integrity` 为
  `sha512-sycqr5/or8lvW91iL2y7viEEbGoZ2RRy/+UP5u90fgNAnwJrZwSeXNgiv6tk5bQF7ugQOnOUACH7osVlNS3/vg==`。
- 内容一致性核对：registry tarball 与本地打包的发布 tarball 分别解包后递归比较
  —— 文件清单一致（157 个文件），归一化行尾后内容逐字节一致。仅 `LICENSE` 与
  `README.zh-CN.md` 存在 CRLF/LF 字节差异，源于本地 Windows 打包与 CI Linux
  打包的平台差异。无内容漂移。

## 发布头提交上的 CI 证据

- CI run 36226174061（提交 `f941e9e`）：10/10 检查全绿，包括真实 consumer 任务
  （pack → 仓库外安装 → exports/typecheck/generate 断言）与 Windows `file:`
  安装生成任务。
- Parity 工作流（runtime + visual）在同一工作线上单独触发：run 36225501055，PASS。

## 全新 registry consumer

在仓库之外创建了独立 consumer（`final-npm-consumer/`，不含 workspace 或
`file:`/`link:` 引用），指向 registry 包：

- `pnpm add` 安装 registry 包 —— PASS（lockfile 记录 registry integrity，而非
  本地引用）。
- exports 冒烟（`.` / `./config` / `./content` / `./schema` / `./img`）——
  5/5 可解析 —— PASS。
- `nuxt typecheck` —— exit 0 —— PASS。（consumer 按文档化的 patch 策略携带
  creator 模板与仓库 consumer 验收模板一致要求的五个上游依赖补丁。）
- 在维护者本机（Windows）完整执行 `generate` / `build` / `dev` ——
  **被本地环境阻塞**，与包本身无关：WorkBuddy 智能体沙箱 hook 了 `fs.rm`
  （safe-delete shim），会中断 Nuxt 的构建目录清理，且其 `genie-trash` 助手
  在 `spawnSync` 上超时。同一阻塞在仓库内 playground 上复现，因此本地残留的
  `#modals` vite transform 告警既不能归咎也不能豁免主题本身；已在下方跟进项
  记录。与此 payload 完全对应的渲染证据存在于 CI（playground 生成、带页面级
  断言的 tarball consumer 生成、兼容性套件 —— run 36228406132 全绿）。

## 记录的跟进项（Phase 9 未采取行动）

- 本地独有的 `#modals` vite transform 解析失败值得在无沙箱的 Windows 机器上
  复查；CI（ubuntu consumer + Windows `file:` 生成）未复现。
- 仓库的 `test:registry-consumer` consumer 模板未携带 `test:consumer` 内嵌的
  五个上游依赖补丁；在对齐两个模板之前，其 typecheck 步骤会因同样的
  temporal-spec 类型问题失败。

## 最终状态

**PUBLISHED。** `0.2.0` payload 可验证为已审计的产物，registry 正常提供该包，
默认分支包含发布提交，标签指向该提交。
