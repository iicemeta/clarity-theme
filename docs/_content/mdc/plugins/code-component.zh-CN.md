# 代码组件映射

[English](./code-component.md) | **简体中文**

## 用途

`remark-code-component` 把特殊语言的围栏代码块转换为组件 props，作者只需写普通围栏即可获得富组件。

## 基本语法

```md
```mermaid
graph TD
    A --> B
```
```

## 映射

在 `nuxt.config.ts` 的 `content` 块配置（来源：`src/remark-plugins/remark-code-component.mjs`）：

| 围栏语言 | 组件 | Prop |
| --- | --- | --- |
| `mermaid` | `Mermaid` | `code` |
| `music-abc` | `MusicScore` | `abc` |

## 行为

插件遍历 `code` AST 节点，把匹配的围栏替换为标签为组件名的 `codeComponent` 节点，并把围栏文本移入配置的 prop。组件不会收到围栏的 meta 字符串。

## 何时使用

Mermaid/ABC 一律写成围栏——不要手写 `::mermaid` 或 `:music-score`；组件期望来自管线的 props。

## 常见错误

- 期待围栏 meta（`wrap`、`[filename]`）传给组件——不会。
- 修改 `node_modules` 里的插件来新增映射——映射属于 Layer 配置；修改它是 Theme 变更。

## 支持状态

`supported` —— 兼容性用例 `D-mermaid` 与 `D-music` 背后的机制。

## 来源

`src/remark-plugins/remark-code-component.mjs`；注册于 `nuxt.config.ts`。
