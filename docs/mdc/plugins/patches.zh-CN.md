# 消费者补丁

[English](./patches.md) | **简体中文**

## 用途

上游 blog-v3 有四个会改变文章渲染的补丁。Theme 一个都不携带——pnpm patch 是消费者工作区状态，无法随 npm 包传递。当这些行为对你的内容重要时，在消费者侧注册补丁；否则以下面记录的无补丁行为为准。

## 能力矩阵

| 行为 | 无补丁（Theme 默认） | 有消费者补丁 | 补丁 |
| --- | --- | --- | --- |
| 围栏代码 tab 保留 | MDC 的 `detab` 把 tab 转为空格 | tab 字符原样到达 Shiki | `@nuxtjs/mdc`（仅 detab hunk） |
| 小数图片密度 | `"1.5x"` 这类字符串密度按整数解析 | `parseFloat` 保留小数 | `@nuxt/image` |
| Plain Shiki 高亮作用域 | `::highlight(name)` 选择器丢失后代 | 选择器包含后代组合器 | `plain-shiki` |
| ICO 透传 | ICO 进入 IPX 时 Sharp 失败 | ICO 原样透传 | `ipx` |

## 行内代码说明

上游 `@nuxtjs/mdc` 补丁还曾把行内代码文本作为 `code` prop 传入。Theme 的 `ProseCode` 实现了双模式支持（有 prop 用 prop，否则用插槽文本），因此该 hunk 不再需要——见[行内代码](../components/inline-code.zh-CN.md)。

## 何时使用

- tab 保留：依赖 tab 对齐内容的重代码文章（如原样展示 tab 缩进源码）。新写作优先用空格。
- 密度：向图片组件传入小数 `densities` 字符串的内容。
- 其余两个：仅在观察到特定渲染 bug 时使用。

## 何时不要使用

不要投机性注册补丁；每一个都是锁文件中被维护的依赖 fork。见维护者[补丁策略](../../maintainers/patches.zh-CN.md)。

## 常见错误

- 以为 Layer 能替你携带补丁——不能。
- 只复制补丁文件而不在 `pnpm-workspace.yaml` 的 `patchedDependencies` 注册（上游的 `@vue/shared` 文件存在但未注册，因此无效）。

## 支持状态

`conditional` —— 每个行为只在注册了对应补丁的消费者中可用。Theme 侧默认行为是 `supported` 且经基准验证。

## 来源

上游 `patches/` 与 `pnpm-workspace.yaml`；Theme 边界文档化于 `docs/maintainers/patches.md`；历史审计见 `docs/history/2026-09-patch-audit.md`。
