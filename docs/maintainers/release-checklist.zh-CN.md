# 发布清单

[English](./release-checklist.md) | **简体中文**

与版本无关的发布模板。把它复制进发布 PR/issue 并在那里打勾；**不要在本文件记录某次发布的证据（数量、时间戳、commit 哈希）**——那属于 [CHANGELOG](../../CHANGELOG.md) 或 GitHub Release。流程叙述见[发布](./publishing.zh-CN.md)。

## 发布前

- [ ] 工作树干净；确定发布分支/commit。
- [ ] 该发布类别没有未解决的路线图阻塞项。
- [ ] 已审查上游基线（`pnpm sync:check`）；漂移不存在或已显式处理。
- [ ] 已包含变更的所有 `REVIEW` 级决策都已解决。

## 包元数据

- [ ] `package.json` 的 `version` 已提升（创建器发布时也提升 `create-clarity-theme/package.json`）。
- [ ] `create-clarity-theme/templates/default/package.json` 的 Theme 依赖恰为本次发布版本的 `^<version>`（漂移由 `pnpm release:check` 强制拦截）。
- [ ] exports / files / engines / peerDependencies 契约未变，或已有意更新并带测试。

## CHANGELOG

- [ ] 顶部新增 `## <version> - YYYY-MM-DD` 条目（倒序）。
- [ ] 条目覆盖面向消费者的 Added / Changed / Fixed / Breaking Changes / Migration Notes。
- [ ] 创建器变更记录在 `create-clarity-theme/CHANGELOG.md`。
- [ ] `pnpm docs:check` 通过（changelog 之外无发布版本污染）。

## 测试

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm verify`
- [ ] `pnpm test:sync`
- [ ] `pnpm test:migration`
- [ ] `pnpm test:contract`
- [ ] `pnpm peers check`
- [ ] `pnpm generate`
- [ ] `pnpm test:consumer`
- [ ] `pnpm test:compatibility`
- [ ] 创建器发布额外：`pnpm test:create` · `pnpm test:create:e2e` · `pnpm test:create:tarball`

## 发布门禁

- [ ] 在发布 commit 上通过 `pnpm release:check --allow-untagged`（打 tag 前）。
- [ ] 检查 `pnpm pack --dry-run` 边界；不含 content/、开发资产、站点配置、密钥或上游私密站点数据（parity 保留的上游公开示例内容允许分发，由 creator 提醒用户自查）。

## Tag 与 GitHub Release

- [ ] Tag `v<version>`（创建器：`create-v<version>`）指向已验证 commit 并已 push。
- [ ] 在该 tag 上起草 GitHub Release，正文使用 changelog 条目。

## 发布（OIDC）

- [ ] 只通过发布 GitHub Release 触发发布工作流。
- [ ] 工作流 tag/版本校验通过。
- [ ] 完整有序套件在精确 tag 上重跑通过。
- [ ] 最终 tarball 打入 `artifacts/`，已审计、记录校验和并 dry-run。
- [ ] npm publish 通过 Trusted Publishing 以 `--provenance` 执行（无 NPM_TOKEN）。

## npm 验证

- [ ] `npm view <package>@<version> version dist.tarball dist.integrity` 符合预期。
- [ ] Theme：`pnpm test:registry-consumer` 对已发布 registry 版本通过。
- [ ] 创建器：干净环境中 `npx create-clarity-theme@<dist-tag> --help` 可用。
- [ ] Provenance 签名存在/已验证。

## Registry 消费者

- [ ] 干净的临时消费者安装已发布版本并成功 typecheck/generate。
- [ ] 文档记载的快速开始路径对 registry 产物（非本地 tarball）有效。

## 发布后审计

- [ ] Changelog/GitHub Release 一致；无需后续更正。
- [ ] 路线图已更新：完成的条目移除，新发现的工作加入对应阶段。
- [ ] 适用时验证使用新 Theme 范围的创建器模板。
- [ ] 任何发布事故记录在 changelog 条目（长篇背景进 history）。

## 热修复捷径

热修复请遵循[发布 §热修复](./publishing.zh-CN.md#9-热修复发布)：从 release tag 分支、最小修复 + 测试、提升 `<version>`、添加 changelog 条目、重跑有序套件，然后照常打 tag 并发布。不要因为改动小就跳过门禁。
