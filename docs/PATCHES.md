# Patch Strategy

> Current source of truth: consumer `pnpm-workspace.yaml`, the actual patch files,
> and the historical detailed audit. This page summarizes the current boundary;
> it deliberately does not introduce a new patch design.

上游 `blog-v3` 通过 `pnpm patchedDependencies` 启用 4 个 patch。
Theme 包本身**不携带任何 patch**：pnpm patch 是安装工作区状态，不能随 npm package 自动传递；
而且是否需要 patch 取决于消费者内容和图片/部署选择。需要 patch 时，由消费项目注册并维护。

判定框架：是否仍需要？→ 能否用公开配置解决？→ 能否向上游提小 PR？→ 是否值得 fork？→ 否则作为 consumer patch。

## 审计结论

| Patch | 修改内容 | 当前判定 | 状态 |
| --- | --- | --- | --- |
| `@nuxtjs/mdc` | 移除 fenced code 的 `detab`，保留 tab | 迁移上游内容且需要 tab 原文保真时，consumer 需要 detab-only patch；行内代码 hunk 已由 Theme `ProseCode` 双模式兼容取代并删除 | ✅ 已精简为单 hunk |
| `@nuxt/image` | density 解析 `parseInt` → `parseFloat` | 当前上游内容存在字符串小数 density 时需要；全局数字 density 配置本身不依赖 patch | 🟡 consumer patch / upstream PR 候选 |
| `plain-shiki` | highlight selector 补后代组合器空格 | 短期 consumer patch；历史审计确认后续可评估在 Theme 侧传入公开 selector 配置后移除 | 🟡 短期 consumer patch |
| `ipx` | ICO 原样透传，绕过 Sharp | 仅当 ICO 真的进入 IPX 时需要；当前 Theme favicon 是重定向，外部 ICO 默认直链，不是默认依赖 | ⚪ 可选站点 recipe |

差异测试工作区还存在 `patches/@vue__shared.patch`，但它的 `pnpm-workspace.yaml`
没有注册该 patch，因此当前不生效。Theme 不迁移、不注册该文件。

## 已登记的外部跟进候选

历史审计登记过以下外部跟进方向。本任务没有提交 issue/PR，也没有设计新方案：

1. **`@nuxt/image`**：`Number.parseInt` → `Number.parseFloat`
   （`densities` 支持小数；对应 issue：密度点对点显示）
2. **`plain-shiki`**：`::highlight(name)` 选择器补后代空格
   （plain-shiki 高亮作用域 bug）
3. **`ipx`**：ICO / unsupported transform 语义需要先讨论，不能直接把现有
   “忽略变换”行为当作通用修复

`@nuxtjs/mdc` 的 detab 行为变更（tab 不转空格）影响所有用户的默认输出，
是否被上游接受存疑，长期保留为 consumer patch。

## 为什么 Theme 不持有 Patch

1. npm package 不能让 pnpm `patchedDependencies` 自动在消费者安装时生效。
2. `files` 发布边界不包含 `patches/`。
3. 即使分发 patch 文件，消费者仍必须复制并在自己的 package-manager 配置和 lockfile 中注册。
4. patch 需求与站点内容、图片管线和部署环境相关，不适合变成所有使用者的默认行为。

详细历史判定见 [patch-audit](./patch-audit.md)（Historical / no longer authoritative）。
