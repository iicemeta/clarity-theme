# Poetry

[English](./poetry.md) | **简体中文**

## 用途

居中诗行块，可选标题、作者与落款——用于引用诗歌或歌词。

## 基本语法

```md
::poetry
---
title: 诗的标题
author: 一名作者
footer: 可选的落款
---
诗的第一行，
诗的第二行。
::
```

## Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `title` | string | 居中标题 |
| `author` | string | 居中署名行 |
| `footer` | string | 居中收尾行 |

## 插槽

- `default` —— 诗行正文

## 支持的取值

普通文本行；每行保持足够短以避免折行。

## 示例

```md
::poetry{title="无题" author="佚名"}
床前明月光，
疑是地上霜。
::
```

## 嵌套

独立块；内部不要嵌套组件。

## 何时使用

引用真实的诗歌、歌词或题记。

## 何时不要使用

普通引用块或提示——用 Markdown 引用或 Alert。

## 常见错误

- 期待诗行正文中出现 Markdown 块结构。
- 用它来居中任意文本。

## 支持状态

`supported` —— 源码验证；暂无兼容性基准覆盖（见审计缺口 3）。

## 来源

`src/components/content/Poetry.vue`；上游文章与展示页中的用法。
