# Link（ProseA）

[English](./link.md) | **简体中文**

## 用途

普通 Markdown 链接自动获得主题化渲染：外链显示域名图标与域名提示。无需 MDC。

## 基本语法

```md
参见 [Nuxt 文档](https://nuxt.com/docs) 或某个[小节](#支持的取值)。
```

## Props

`ProseA` 接受 `href`（必填）与 `icon`（string 或 `false`）；作者通常无需传递——MDC prose 映射会从 Markdown AST 提供。

## 插槽

- `default` —— 链接文本

## 支持的取值

外部 URL 自动获得域名图标（来源：`getDomainIcon`）；`/posts/my-post` 这类站内路径不显示。自动链接（`<https://…>`）同样可用。

## 示例

```md
[a](#section){icon="tabler:color-swatch"} —— 行内 props 语法可以传图标；纯 Markdown 无法传递。
```

## 嵌套

行内；链接文本可包含行内 Markdown。

## 何时使用

随时——这就是默认链接渲染。请写普通 Markdown 链接。

## 何时不要使用

除非目标确实需要视觉突出（见 [link-card](./link-card.zh-CN.md)），否则不要用卡片替代链接。

## 常见错误

- 手写 `:prose-a` —— 组件通过 Markdown 语法到达。
- 期待纯 Markdown 控制图标；`icon`（字符串，或 `false` 关闭）需要行内 props 语法。

## 支持状态

`supported` —— 兼容性用例 `A-markdown` 验证（内链、外链、自动链接）。

## 来源

`src/components/content/ProseA.vue`；域名图标工具位于 `src/utils`。
