# Quote

[English](./quote.md) | **简体中文**

## 用途

带图标行的大号样式化引用块——用于在文章中真正有分量的引文。

## 基本语法

```md
::quote
有时候，有些话，有点意思。
::

::quote{icon="tabler:files"}
自定义图标。
::
```

## Props

| Prop | 类型 / 默认值 | 说明 |
| --- | --- | --- |
| `icon` | string，默认 `tabler:message-2` | 图标行的图标名 |

## 插槽

- `default` —— 引文内容
- `icon` —— 富文本图标内容；覆盖 `icon` prop

## 支持的取值

任意图标名；正文接受 Markdown。

## 示例

```md
:quote[一条简短的行内引用。]
```

## 嵌套

上游曾在 `:::quote` 内嵌套 `::blur` 实现剧透引文；保持一层。

## 何时使用

每篇文章一两处关键引文。

## 何时不要使用

普通引用（Markdown `>` 更轻），或把每个段落都变成引用。

## 常见错误

- 与 Markdown 引用块混淆；Quote 面向展示型引文。
- 连续堆叠多个引用。

## 支持状态

`supported` —— 源码验证；暂无兼容性基准覆盖（见审计缺口 3）。

## 来源

`src/components/content/Quote.vue`；上游语料中 66 次。
