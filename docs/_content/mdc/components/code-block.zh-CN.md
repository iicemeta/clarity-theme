# 代码块（ProsePre）

[English](./code-block.md) | **简体中文**

## 用途

所有围栏代码块都经 ProsePre 渲染：运行时 Shiki 高亮、文件名/语言标签、复制与换行按钮，以及长块自动折叠。

## 基本语法

````md
```ts
const answer = 42
```
````
（这里的外层围栏是文档展示用的——文章里写内层那个即可。）

## Props

ProsePre 接收解析后的围栏元数据；作者把它们写进围栏信息串而不是 props：

| 形式 | 示例 | 效果 |
| --- | --- | --- |
| 语言 | ` ```ts ` | Shiki 语言（默认 `text`） |
| `[文件名]` | ` ```ts [app.vue] ` | 带文件类型图标的标签 |
| `{行号}` | ` ```ts {2,4} ` | 行高亮（解析进 `highlights` prop） |
| `wrap` | ` ```ts wrap ` | 初始开启自动换行 |
| `expand` | ` ```ts expand ` | 无论多长都不折叠 |
| `icon=` | ` ```ts icon=tabler:star ` | 覆盖标签图标 |
| `indent=` | ` ```ts indent=2 ` | 本块 tab 宽度 |

折叠阈值来自 app config 键 `clarity.component.codeblock`（`triggerRows`、`collapsedRows`、`indent`、`tabSize`、`enableIndentGuide`）。

## 插槽

无；代码文本就是块内容。

## 支持的取值

任意 Shiki 语言 id。`md`/`mdc`/`json`/`yaml` 默认缩进为 2（来源：`ProsePre.vue` 的 `getIndent`）。

## 示例

````md
```ts [clarity.config.ts] {2} icon=tabler:star indent=2 wrap
import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({})
```
````

## 嵌套

代码围栏可以嵌进容器（`Tab`、`Folding`）；递增外层冒号深度。没有消费者 detab 补丁时，`Tab` 插槽块内 tab 缩进的代码会丢失缩进——那里优先使用空格。

## 何时使用

所有代码。优先用 meta 标志，而不是用正文解释格式。

## 何时不要使用

读者要复制的单条命令——[Copy](./copy.zh-CN.md) 更合适。

## 常见错误

- 把 `wrap`/`expand` 写进 YAML props——它们属于围栏信息串。
- 没有消费者补丁却期待 tab 保留（见[补丁](../plugins/patches.zh-CN.md)）。

## 支持状态

`supported` —— 兼容性用例 `B-code` 验证（文件名、meta 标志、图标、缩进、行高亮、折叠、diff）。

## 来源

`src/components/content/ProsePre.vue`；围栏解析由 MDC `parseThematicBlock` 完成；运行时高亮经 `@bikariya/shiki`。
