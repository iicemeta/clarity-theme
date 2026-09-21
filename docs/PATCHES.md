# 上游 Patch 审计（devdoc2.0 Phase C）

上游 `blog-v3` 通过 `pnpm patchedDependencies` 维护 4 个 patch。
Theme 包本身**不携带任何 patch**（package-manager 层面无法随 npm 分发），
判定结果：需要的 patch 由**消费项目**（如 `theme-based-blog-v3`）作为站点级 patch 持有。

判定框架：是否仍需要？→ 能否向上游提 PR？→ 是否值得 fork？→ 否则作为 consumer patch。

## 审计结论

| Patch | 内容 | 判定 | 状态 |
| --- | --- | --- | --- |
| `@nuxtjs/mdc` | ① 行内代码 `props.code` 传入原文 ② 移除 `detab`（保留 tab） | ① **已取代，删除**——`ProseCode.vue` 原生适配 MDC 插槽传值（有/无 patch 双兼容）② 仍需要，保留 consumer patch | ✅ 已精简 |
| `@nuxt/image` | `parseDensities` 中 `parseInt` → `parseFloat`，支持 `1.5x` 小数密度 | 仍需要（Theme `densities: [1, 1.5, 2]` 依赖小数密度）| 🟡 consumer patch |
| `ipx` | ICO 图片直接透传（sharp 无法处理 ICO） | 仍需要（favicon.ico 经 IPX 时不炸） | 🟡 consumer patch |
| `plain-shiki` | `::highlight()` 选择器前补空格（后代组合器） | 仍需要（否则代码高亮颜色失效） | 🟡 consumer patch |

## 潜在上游 PR 候选

以下修改是低风险修复，适合向上游提 PR，被合并后可从消费项目移除：

1. **`@nuxt/image`**：`Number.parseInt` → `Number.parseFloat`
   （`densities` 支持小数；对应 issue：密度点对点显示）
2. **`plain-shiki`**：`::highlight(name)` 选择器补后代空格
   （plain-shiki 高亮作用域 bug）
3. **`ipx`**：ICO 透传分支（新增 format 支持，非破坏性）

`@nuxtjs/mdc` 的 detab 行为变更（tab 不转空格）影响所有用户的默认输出，
是否被上游接受存疑，长期保留为 consumer patch。

## 精简版 mdc patch

`theme-based-blog-v3/patches/@nuxtjs__mdc.patch` 已从上游完整 patch 精简为
**仅 detab 一个 hunk**（行内代码 hunk 删除）。验证：`nuxt generate` 242 路由 0 错误，
inline code 插槽渲染与 tab 保留同时正常。
