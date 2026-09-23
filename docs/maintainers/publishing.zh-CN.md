# 发布

[English](./publishing.md) | **简体中文**

Clarity Theme 的永久发布流程。这是 runbook，不是发布记录：使用 `<version>` / `<previous-version>` 占位符；实际发布事实只写入根目录 [CHANGELOG](../../CHANGELOG.md)，一次性事故写入 changelog 或[历史](../history)。运行时 Theme 与 `create-clarity-theme` 是独立版本化的 npm 包。

## 1. 发布前提

1. 所发布类型对应的[路线图](./roadmap.zh-CN.md)阻塞项已解决或显式推迟。
2. 工作树干净，且位于你要发布的 commit 上。
3. 完整有序验证套件在该确切 commit 上通过（见[发布清单](./release-checklist.zh-CN.md)）。

## 2. 版本管理

- `package.json` 是版本的唯一事实源。
- 项目遵循 [SemVer](https://semver.org/)。
- `create-clarity-theme/package.json` 独立版本化，无需与 Theme 一致。

## 3. Changelog

- 每个版本在根 `CHANGELOG.md` 增加一条 `## <version> - YYYY-MM-DD`，位于**所有**旧版本之上（倒序；`pnpm docs:check` 会校验）。
- 面向 Theme 消费者写作：能安装什么、行为变化什么、升级时检查什么。内部开发日志不要写入。
- 创建包的变更只进入 `create-clarity-theme/CHANGELOG.md`。
- `pnpm release:check` 要求 changelog 包含该包版本的条目。

## 4. 准备发布 commit

1. 提升 `package.json` 的 `version`（创建器发布时才提升 `create-clarity-theme/package.json`）。
2. 添加上述 changelog 条目。
3. 若生成的消费者应依赖新的 Theme 发布范围，更新 `create-clarity-theme/templates/default/package.json`。
4. 运行有序套件；打 tag 前本地可用 `pnpm release:check --allow-untagged`。
5. 提交发布元数据。

## 5. 打 tag 与 GitHub Release

- Git tag 使用 `v<version>`；创建器发布使用 `create-v<version>`。
- **npm 包版本 + Git tag + GitHub Release 必须使用同一版本。** 当 release tag 不等于 `v${package.json version}` 时，发布工作流拒绝运行。
- 在通过有序套件的精确 commit 上打 tag：

```bash
git tag v<version>
git push origin v<version>
```

- 在该 tag 上起草 GitHub Release，并把 changelog 条目作为 release body。发布 Release 是触发工作流的人工确认步骤；不要在分支 push 时发布。

## 6. Trusted Publishing（每个包/工作流一次性设置）

工作流使用 npm **Trusted Publishing（OIDC）**：GitHub secrets 中没有 `NPM_TOKEN`，也没有长期凭据。维护者在 npm 网站上一次性配置：

| 设置 | Theme | 创建器 |
| --- | --- | --- |
| User/Organization | `iicemeta` | `iicemeta` |
| 仓库 | `clarity-theme` | `clarity-theme` |
| 工作流文件名 | `publish.yml` | `publish-create.yml` |
| Registry | `npmjs.org` | `npmjs.org` |
| Environment | `npm`（可选，用于发布审批） | `npm` |

## 7. 发布工作流

[`publish.yml`](../../.github/workflows/publish.yml)（Theme）：

1. 只在 `v*` tag 的 `release: published` 时触发。
2. 检出 release tag（`fetch-depth: 0`）并校验 tag = `v${package.json version}`。
3. 从 `engines.node` 解析 Node、从 `packageManager` 解析 pnpm。
4. 串行运行完整有序套件：lint → typecheck → verify → test:sync → test:migration → test:contract → peers check → generate → test:consumer → test:compatibility → release:check。
5. 把最终 tarball 打进 `artifacts/`，审计内容，记录 SHA-256 校验和，并运行 `npm publish --dry-run`。
6. 用 `npm publish --access public --provenance` 发布同一个已审计的 tarball。

[`publish-create.yml`](../../.github/workflows/publish-create.yml) 是 `create-clarity-theme` 的独立等价物：忽略 Theme tag、校验 `create-v${creator version}`、运行创建器 CLI 与两套 E2E、打包/审计创建器 tarball，并以 OIDC provenance 发布。预发布版本自动使用 `beta` dist-tag。

权限最小化：`contents: read`、`id-token: write`。

## 8. Provenance 与 registry 验证

工作流成功后：

```bash
npm view clarity-theme@<version> version dist.tarball dist.integrity
pnpm test:registry-consumer
```

- Provenance 要求从 GitHub 工作流发布；本地 `npm publish` 不会生成。需要时用 `npm audit signatures` 验证签名。
- `test:registry-consumer` 创建临时消费者，从 **npm registry**（非本地 tarball）安装 `clarity-theme@<version>`，并运行导出冒烟、typecheck、静态生成与输出断言——补全 workspace → tarball → registry 消费链。
- 创建器用 `npm view create-clarity-theme@<version> version dist.tarball` 与 `npx create-clarity-theme@<dist-tag> --help` 验证。

## 9. 热修复发布

1. 从 release tag 分支（`git switch -c hotfix/<version> v<previous-version>`），或当 release 是当前 head 时在主分支修复。
2. 应用最小修复及其测试。
3. 把 `package.json` 提升到 `<version>` 并添加 changelog 条目。
4. 在精确的热修复 commit 上重跑有序验证套件。
5. 打 `v<version>` tag、push，并照常通过 GitHub Release 发布。

## 10. 预发布

- 使用 SemVer 预发布标识符：`<next-minor>-rc.1`、`<next-minor>-beta.1`。
- 正常打 tag（`v<prelease-version>`）并保持 tag/版本契约。
- 预发布发布到非 `latest` dist-tag（创建器工作流自动处理；Theme 工作流可加 `--tag next`）。
- 在 changelog 条目中说明预发布不受稳定性承诺覆盖。

## 11. 回滚 / unpublish 政策

**绝不自动 unpublish。** 已发布的 npm 版本视为不可变。

- 有缺陷的发布通过下一个 semver 合适的版本来修复。
- 回滚意味着：在 Git 上 revert 或修复，然后切一个 patch 版本；按需调整或关闭 GitHub Release。
- Unpublish 只是法律/被入侵下架的最后手段，永远是维护者的人工决策。

## 12. 发布 create-clarity-theme

创建包没有运行时依赖，独立发布：

1. 保持 `templates/default/package.json` 中的 `clarity-theme` 指向真实已发布的 registry 范围。
2. 只提升 `create-clarity-theme/package.json`，并在它自己的 `CHANGELOG.md` 添加条目。
3. 在精确发布 commit 上串行运行 `pnpm test:create`、`pnpm test:create:e2e` 与 `pnpm test:create:tarball`。
4. 确保已为 `publish-create.yml` 一次性配置 npm Trusted Publisher。
5. 在精确 commit 上打 `create-v<version>` tag、push，并从中发布 GitHub Release。
6. 验证 registry 产物与公共命令（§8）；只有在不再需要创建器变更时，才把已审查的 beta 提升为 `latest`。
