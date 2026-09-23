# Tab

[English](./tab.md) | **简体中文**

## 用途

选项卡面板：同一内容的并列形式（示例、前后对比、语言变体），一次显示一个。

## 基本语法

```mdc
::tab{:tabs='["Vue", "Markdown"]'}
#tab1
Vue 内容。
#tab2
Markdown 内容。
::
```

## Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `tabs` | string[]，必填 | 选项卡标签，按顺序 |
| `center` | boolean | 选项卡栏居中 |
| `active` | string \| number | 初始激活选项卡的 1 起始下标（或其字符串） |

## 插槽

- `#tab1`、`#tab2`、…… `#tabN` —— 与 `tabs` 一一对应

## 支持的取值

长标签数组用 YAML 最方便：

```mdc
::tab
---
tabs:
  - 第一
  - 第二
  - 第三
center: true
active: 2
---
#tab1
……
::
```

## 示例

```mdc
:::tab{:tabs='["旧", "新"]' center}
#tab1
旧实现。
#tab2
新实现。
:::
```

## 嵌套

接受代码围栏与嵌套容器（递增冒号深度）。已知问题：除非消费者注册 detab 补丁，MDC parser 会吞掉 Tab 插槽块内的代码缩进（`Tab.vue` 源码注释）；那里请使用空格。

## 何时使用

读者确实会挑选的并列变体。

## 何时不要使用

顺序步骤、隐藏内容（用 Folding），或各只有一行内容的两个选项卡。

## 常见错误

- `tabs` 数量与 `#tabN` 插槽不匹配。
- `active` 用 0 起始——它是 1 起始。

## 支持状态

`supported` —— 源码验证；暂无兼容性基准覆盖（见审计缺口 3）。

## 来源

`src/components/content/Tab.vue`；上游语料中 35 次。
