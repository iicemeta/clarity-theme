# 表格（ProseTable）

[English](./table.md) | **简体中文**

## 用途

Markdown 表格自动渲染进带滚动开关的滚动容器——不需要组件语法。

## 基本语法

```md
| 选项 | 类型 | 默认值 |
| --- | --- | --- |
| `tabs` | string[] | — |
```

## Props

作者无需传 props；ProseTable 内部管理滚动状态。

## 插槽

无；由 Markdown 表格 AST 生成。

## 支持的取值

标准 Markdown 表格：对齐标记、单元格内的行内代码、粗体与链接。

## 示例

```md
| 对齐 | 可用 |
| :--- | --- |
| 左对齐 | 是 |
```

## 嵌套

表格与其他块一样可以放进容器。

## 何时使用

真正的表格数据——选项列表、状态矩阵、对比。

## 何时不要使用

正文即可表达键值对，或只有一行的表格。

## 常见错误

- 超宽表格且内容毫无精简——虽然能滚动，但请考虑重构。
- 用表格做布局。

## 支持状态

`supported` —— 兼容性用例 `A-markdown` 验证（thead/tbody、对齐 class）。

## 来源

`src/components/content/ProseTable.vue`。
