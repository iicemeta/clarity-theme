# 行内代码（ProseCode）

[English](./inline-code.md) | **简体中文**

## 用途

反引号代码在给定语言时会获得运行时 Shiki 高亮，并可附复制按钮。

## 基本语法

``md
先运行 `pnpm install`。对比 `const x = 1`{lang="ts"} 与普通代码。
``

## Props

ProseCode 声明了 `language`、`code` 与 `copy`。作者只需通过行内属性传 `{lang="…"}`（以及可选的 `copy`）；`code` 由管线提供——Theme 组件对上游 MDC 行内代码补丁（原文作为 `code` prop）与无补丁（从插槽提取文本）双模式兼容，因此补丁是可选的。

## 插槽

- `default` —— 代码文本

## 支持的取值

`lang` 接受任意 Shiki 语言 id。

## 示例

``md
`.env`{lang="sh"} 与 `clarity.config.ts` 都能正确显示。
``

## 嵌套

仅行内。

## 何时使用

短标识符、参数、文件名；当高亮确实有帮助时加 `{lang}`。

## 何时不要使用

多行内容（用围栏），或给正文里的每个片段都加 `lang`。

## 常见错误

- 期待 `{lang}` 作用于长多行文本。
- 以为消费者补丁是必需的——并非如此，Theme 的双模式 ProseCode 会读取插槽文本。

## 支持状态

`supported` —— 兼容性用例 `B-code` 验证（普通行内代码、带点文件名、`{lang="ts"}`、`{lang="sh"}`）。

## 来源

`src/components/content/ProseCode.vue`；补丁边界见[补丁](../plugins/patches.zh-CN.md)。
