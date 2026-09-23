# Meta 插槽

[English](./meta-slots.md) | **简体中文**

## 用途

`rehype-meta-slots` 把 `meta-*` 元素从文章正文提取到页面插槽——由文章提供的组件与许可块，同时不污染阅读流。

## 基本语法

```md
---
title: 一篇文章
aside: [toc, meta-aside-github]
---

:::meta-aside-github{title="项目仓库"}
::link-card
---
title: blog-v3
link: https://github.com/L33Z22L11/blog-v3
---
::
:::

::meta-copyright{title="本文章不保留版权"}
本文放弃版权，进入公共领域。
::
```

## 行为

- 插件（来源：`src/remark-plugins/rehype-meta-slots.mjs`）把标签以 `meta-` 开头的元素移出正文，存入 `meta.slots[<name>]`。
- `meta-copyright` 只要存在，就渲染在文章页脚的许可区域。
- `meta-aside-*` **只有当** frontmatter `aside` 数组包含它时才渲染为侧栏组件（如 `aside: [toc, meta-aside-github]`）；否则内容被提取后无处可去。

## 何时使用

文章专属的侧栏卡片（仓库卡片、实时状态面板）与逐篇许可覆盖。

## 何时不要使用

读者必须看到的正文——meta 插槽在文章流中不可见；常规内容属于正文。

## 常见错误

- 写了 `:::meta-aside-foo` 却没把 `meta-aside-foo` 加进 frontmatter `aside`，然后疑惑内容去哪了。
- 期待任意插槽名；只有 `copyright` 被直接消费，`aside-*` 名映射到侧栏组件。

## 支持状态

`conditional` —— 经 Layer 可用，但侧栏插槽需要 frontmatter `aside` 注册，且暂无兼容性基准覆盖（见审计缺口 3）。

## 来源

`src/remark-plugins/rehype-meta-slots.mjs`；消费于 `src/pages/[...slug].vue`、`src/composables/useWidgets.ts`、`src/components/post/PostFooter.vue`；上游 `content/previews/example.md` 与 `content/posts/2024/blog-using-nuxt.md` 中的用法。
