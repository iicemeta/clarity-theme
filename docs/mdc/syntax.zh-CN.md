# MDC 语法

[English](./syntax.md) | **简体中文**

MDC 是 Nuxt Content 支持的 Markdown 组件语法。本页文档化 Clarity 文章实际使用的语法形式，示例形态取自上游语料与 Layer 管线。逐组件的 props 与 slots 见[组件](./components/_index.zh-CN.md)；围栏驱动的能力见[插件](./plugins/_index.zh-CN.md)。

## 行内组件

冒号前缀的标签在段落内部行内渲染组件。方括号部分成为默认插槽，花括号部分承载 props：

```md
一句话中的脚注式提示 :tip[悬停看我]{tip="解释这个术语"}。
按 :key{code="K"} 打开搜索。
```

布尔 props 可以裸写（`{icon}`、`{round}`）；值 props 使用引号（`{type="warning"}`）。行内组件必须保持在同一行。

## 容器组件

双冒号标签开启一个块级组件，单独的 `::` 关闭它：

```md
::alert{type="warning" title="先备份"}
删除卷的操作不可逆。
::
```

容器可以包含多个块——段落、列表、代码围栏、嵌套组件。当容器内部还要嵌套容器时，上游文章对最外层使用三冒号形式 `` :::component ``：

```md
:::quote
::blur
剧透段落。
::
:::
```

冒号数量只需要在嵌套同类容器时递增；`::`/`:::`/`::::` 是深度标记，不是不同的语法。

## YAML props

较长或结构化的 props 直接写在开启标签后的 `---` 分隔 YAML 块中：

```md
::link-card
---
title: Nuxt Content
icon: https://content.nuxt.com/favicon.ico
link: https://content.nuxt.com/docs/files/markdown
---
::
```

YAML props 与花括号 props 表达能力等价；一两个简单 props 用花括号，数组、含特殊字符的 URL或大量 props 用 YAML。YAML 中可能被解析为数字的字符串要加引号（例如抖音视频 id）。

## 插槽

命名插槽是容器内以 `#` 为前缀的行：

```md
::pic{src="/img/photo.jpg"}
#caption
可选的富文本图注，支持 **Markdown**。
::
```

实际使用的插槽名：`#title`（Alert、Folding）、`#caption`（Pic）、`#icon`（Quote、LinkCard）、`#tab1`…`#tabN`（Tab）、`#default`。未命名的块就是默认插槽。

## 嵌套

容器可以组合：`Tab` 可以容纳代码围栏与嵌套的 `Folding`；`Chat` 与 `Timeline` 把标题行（`{name}`、`{.}`、`{:}`）读取为结构标记。两个经源码验证的注意事项：

- 除非消费者注册了免除 detab 的 `@nuxtjs/mdc` 补丁，`Tab` 插槽块内的代码缩进会被 MDC parser 吞掉（见[补丁](./plugins/patches.zh-CN.md)）。
- 深层嵌套同名容器需要递增冒号深度。

## Markdown prose 映射

标准 Markdown 节点会被映射到 Theme 的 prose 组件，因此普通 Markdown 本身就获得主题化渲染：

| Markdown | Prose 组件 | Reference |
| --- | --- | --- |
| `[label](https://example.com)` | `ProseA`（自动域名图标、域名提示） | [链接](./components/link.zh-CN.md) |
| `` `code` `` 与 `` `code`{lang="ts"} `` | `ProseCode`（运行时 Shiki） | [行内代码](./components/inline-code.zh-CN.md) |
| 围栏代码 | `ProsePre`（文件名、meta、折叠、复制） | [代码块](./components/code-block.zh-CN.md) |
| 表格 | `ProseTable`（滚动开关） | [表格](./components/table.zh-CN.md) |
| 图片 | Nuxt Image 管线与 figure 标记 | [图片](./components/pic.zh-CN.md) |

标题（h1–h4 进入 TOC）、列表、任务列表、脚注、引用块与行内强调由标准管线处理，并由 `A-markdown` 兼容性基准验证。

## 原始 HTML 与其他元素

原始 HTML 仍然可用，MDC 容器形式 `:::div` 可以把 Markdown 包进携带 class 的元素。请谨慎使用——优先选择语义化组件；原始包装是逃生舱，不是结构手段。按名称内嵌任意 Vue 组件（例如上游内容中的站头演示）被归类为 `do-not-use`；见[审计](./audit.zh-CN.md)。
