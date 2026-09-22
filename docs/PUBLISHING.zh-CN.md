# 发布指南

[English](./PUBLISHING.md) | **简体中文**

本文档说明 Clarity Theme 的版本管理、验证与带 provenance 的 npm 发布流程，面向包维护者。

## 1. 发布前置条件

创建 Release 之前：

1. [ROADMAP](./ROADMAP.zh-CN.md) 中所有 P0 事项已解决；P1/P2 事项要么完成，要么在发布说明中明确推迟。
2. 完整有序验证套件在**确切的发布 commit** 上通过（见 [RELEASE-CHECKLIST](./RELEASE-CHECKLIST.zh-CN.md)）。
3. `pnpm release:check` 通过。在打了 tag 的发布 commit 上它会校验 tag/version 契约；打 tag 之前可以用 `pnpm release:check --allow-untagged` 验证。
4. 已确认 npm 包名状态（见下文第 6 节 —— `clarity-theme` 存在历史 unpublish 墓碑记录）。

## 2. 版本管理

- `package.json` 是版本的唯一事实来源。
- 项目从 `0.1.0` 起遵循 [SemVer](https://semver.org/)。
- 首个版本为 `0.1.0`。修复版本提升 patch（`0.1.1`）；1.0 之前的破坏性契约变更提升 minor（`0.2.0`），公开 API 宣告稳定后提升 major（`1.0.0`）。

## 3. 更新日志

- 每个版本在 [CHANGELOG.md](../CHANGELOG.md) 增加 `## <version> - YYYY-MM-DD` 条目。
- 面向 Theme 使用者撰写：能安装什么、行为变化是什么、升级时检查什么；不复制内部开发日志。
- `pnpm release:check` 要求 CHANGELOG 中存在当前版本的条目。

## 4. Tag 命名

- Git tag 使用 `v<版本号>`，例如 `v0.1.0`。
- **npm 包版本 + Git tag + GitHub Release 三者版本必须一致。** 发布工作流在 release tag 与 `v${package.json version}` 不一致时直接拒绝执行。
- 在通过有序验证套件的确切 commit 上打 tag：

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 5. GitHub Release

1. 在 tag（`v0.1.0`）上起草 GitHub Release，使用发布说明模板（[RELEASE-NOTES-0.1.0](./RELEASE-NOTES-0.1.0.md) 是首个版本的完整示例）。
2. 发布 Release 会触发 `publish.yml` 工作流：检出 tag、校验 tag/version 契约、完整重跑有序验证套件、打包 `artifacts/clarity-theme-<version>.tgz`、审计并试运行该 tarball，最后发布。
3. 不要在分支 push 时自动发布。GitHub Release 正是「人工确认发布版本」的环节。

## 6. Trusted Publisher（一次性人工配置）

工作流使用 npm **Trusted Publishing（OIDC）**，不保存 `NPM_TOKEN`，也不向 GitHub secrets 写入任何长期凭证。

维护者需要在 npm 网站一次性配置：

| 配置项 | 值 |
| --- | --- |
| User/Organization | `iicemeta` |
| Repository | `clarity-theme` |
| Workflow filename | `publish.yml` |
| Registry | `npmjs.org` |
| Environment | `npm`（可选，用于发布审批） |

### npm 包名与版本状态（2026-09-22 已核实）

2026-09-22 发布工作中核实的 registry 状态：

- 该名称曾于 2025-10-16 发布 `0.0.10` 并同日 unpublish。
- **`clarity-theme@0.1.0` 已于 2026-09-22T07:28:22Z 被绕过发布流程发布**，发布者 `creampack <creampack@iicemeta.com>`，gitHead `5a03778`（即 P0 修复前的代码树），未经过发布工作流，也没有 provenance 证明。
- 对该已发布 `0.1.0` 运行 `pnpm test:registry-consumer` 会在**已发布包内部 typecheck 失败**（`server/api/stats.get.ts` 的 `orWhere` void 返回，以及 `app/pages/link.vue` 的 `never[]` feed 类型）；两个缺陷均已在仓库修复。

下一次发布前，维护者必须决策：

1. 确认 `0.1.0` 的发布者与发布意图。
2. 决定下一版本号：npm 禁止重新发布 `0.1.0`，因此修复后的门禁发布必须是 **`0.1.1`**（提升 `package.json`、`CHANGELOG.md` 与发布说明，然后打 `v0.1.1` tag）。
3. 可选：`npm deprecate clarity-theme@0.1.0` 并指向 `0.1.1`。**不要 unpublish**——已发布版本视为不可变。
4. 工作流发布仍需先配置 Trusted Publisher。

## 7. npm provenance

- 工作流通过 OIDC 以 `--provenance` 发布，npm 会生成与仓库、工作流和 commit 绑定的签名 provenance 声明。
- 发布后验证：

```bash
npm view clarity-theme@0.1.0 dist.integrity
npm audit signatures --package-lock-only 2>/dev/null || true
```

- provenance 只能来自 GitHub 工作流发布；本地 `npm publish` 不会生成。

## 8. 发布工作流

[`publish.yml`](../.github/workflows/publish.yml)：

1. 仅在 `release: published`（人工确认）时触发。
2. 检出发布 tag（`fetch-depth: 0`）并校验 tag = `v${package.json version}`。
3. 从 `engines.node` 解析 Node，从 `packageManager` 解析 pnpm。
4. **严格串行**运行完整有序套件：lint → typecheck → verify → test:sync → test:migration → test:contract → peers check → generate → test:consumer → test:compatibility → release:check。
5. 将最终 tarball 打包进 `artifacts/`、审计内容、记录 SHA-256 校验和，并执行 `npm publish --dry-run`。
6. 用 `npm publish --access public --provenance` 发布**同一个**已审计的 tarball。

权限最小化：`contents: read`、`id-token: write`。

## 9. 发布验证

工作流成功后：

```bash
npm view clarity-theme@0.1.0 version dist.tarball
pnpm test:registry-consumer
```

`test:registry-consumer` 会创建临时消费者，**从 npm registry** 安装 `clarity-theme@<version>`（不使用本地 tarball），并运行 exports 冒烟、类型检查、静态生成与产物断言。由此形成三层消费链路：

```text
Workspace → Tarball（test:consumer）→ Registry（test:registry-consumer）
```

## 10. 回滚 / unpublish 策略

**绝不自动 unpublish。** 已发布的 npm 版本视为不可变。

- `0.1.0` 有缺陷 → 发布 `0.1.1` 修复。
- 破坏性错误 → 按语义化版本发布下一个版本。
- 回滚 = 在 Git 上修复/revert 后发布 patch 版本；必要时调整或关闭 GitHub Release。
- unpublish 仅作为法律/安全下架的最后手段，且永远是维护者的人工决策。

## 11. 热修复发布

1. 从发布 tag 分支（`git switch -c hotfix/0.1.1 v0.1.0`），或发布即当前 head 时直接在 `master` 修复。
2. 应用最小修复及其测试。
3. 将 `package.json` 提升到 `0.1.1`，补充 CHANGELOG 条目。
4. 在确切的热修复 commit 上重跑有序验证套件。
5. 打 `v0.1.1` tag、推送，并照常通过 GitHub Release 发布。

## 12. 预发布版本

- 使用 SemVer 预发布标识：`0.2.0-rc.1`、`0.2.0-beta.3`。
- 照常打 tag（`v0.2.0-rc.1`），保持 tag/version 契约。
- npm 会将预发布版本视为 `dist-tag=next` 候选；发布命令可为非 `latest` 通道追加 `--tag next`。
- 在发布说明中注明预发布版本不受稳定性承诺保护。
