# Copy

[English](./copy.md) | **简体中文**

## 用途

单行可复制命令——读者可以先编辑再复制，并可撤销——附带可选的 shell 提示符与语法高亮。

## 基本语法

```md
:copy{code="pnpm add clarity-theme"}
```

## Props

| Prop | 类型 / 默认值 | 说明 |
| --- | --- | --- |
| `code` | string | 命令文本 |
| `prompt` | string \| boolean，默认 `'$'` | 提示符前缀。裸写 `prompt` 或空字符串会隐藏它 |
| `lang` | string | 高亮语言；默认由 `prompt` 推断 |

语言推断（来源：`promptLanguageMap`）：以 `#` 或 `$` 开头的 prompt → `sh`，`CMD` → `bat`，`PS` → `powershell`，否则 `text`。

## 插槽

无；内容来自 `code` prop。

## 支持的取值

单行命令。YAML 中跨行的 `prompt` 仍按一行渲染——多行输出请使用围栏代码块。

## 示例

```md
:copy{prompt="#" code="reflector --country China --sort rate"}
:copy{prompt code="https://example.com/install.sh"}
```

## 嵌套

仅行内。

## 何时使用

读者需要粘贴的安装/运行命令、一行配置、本身相当于命令的 URL。

## 何时不要使用

多行脚本、文件内容或输出很重要的命令——用围栏代码块；本组件只服务命令本身。

## 常见错误

- 忘记转义花括号 props 内的引号。
- 以为编辑文本会改变存储内容——撤销按钮会恢复 `code`。

## 支持状态

`supported` —— 兼容性用例 `C-mdc` 验证。

## 来源

`src/components/content/Copy.vue`；上游语料中使用最多的自定义组件（186 次）。
