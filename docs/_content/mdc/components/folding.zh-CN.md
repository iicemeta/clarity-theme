# Folding

[English](./folding.md) | **简体中文**

## 用途

原生可折叠块，用于次级内容：长参考列表、题外话、剧透章节。

## 基本语法

```md
::folding{title="参考链接"}
- [文档](https://example.com/docs)
- [规范](https://example.com/spec)
::
```

## Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `title` | string | 摘要文本；`title` 插槽优先 |

`open` 不是已声明 prop：它作为属性透传到根 `<details>` 元素，因此 `::folding{open}` 默认展开。该透传是经源码验证的行为，不是组件 API。

## 插槽

- `default` —— 可折叠正文
- `title` —— 富文本摘要；回退到 `title` prop

## 支持的取值

正文中可使用任意 Markdown，包括代码围栏与嵌套容器。

## 示例

```md
:::folding{open title="完整变更日志"}
```md
…… 长块 ……
```
:::
```

## 嵌套

可安全嵌套；包住代码围栏时递增冒号深度。

## 何时使用

值得保留但会淹没主线的内容——附录材料、长日志、可选深入内容。

## 何时不要使用

读者必须阅读的内容（他们可能永远不展开）、一行题外话（用一句话或 Tip），或用来遮盖糟糕的结构。

## 常见错误

- 把 `open` 当作已文档化的 prop 依赖。
- `title` 为空且没有 `title` 插槽——摘要渲染为空白。

## 支持状态

`supported` —— 兼容性用例 `C-mdc` 验证。

## 来源

`src/components/content/Folding.vue`；上游文章与展示页中的用法。
