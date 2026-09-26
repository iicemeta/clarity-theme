# 数学

[English](./math.md) | **简体中文**

## 用途

通过 remark-math 与 rehype-katex 渲染 LaTeX 风格公式，服务端输出 KaTeX HTML。

## 基本语法

```md
行内：$E = mc^2$ 与 $\int_0^1 x^2 \,dx$。

$$
\frac{\partial u}{\partial t} = \alpha \nabla^2 u
$$
```

## 行为

- `$…$` 行内公式，`$$…$$` 块级公式；`$$` 内可使用 `\begin{aligned}` 环境。
- KaTeX 样式表由 Layer 从远程 CDN（`s4.zstatic.net`）注入——必须离线的站点应覆盖 head 链接。
- 解析错误会渲染出 `katex-error` 标记；兼容性套件断言有效输入不出现错误。

## 何时使用

纯文字无法表达的公式。

## 何时不要使用

正文中的简单算术（`2 × 3`），或代码——用行内代码。

## 常见错误

- 谈论金钱的正文里未转义的 `$`——用 `\$` 或改写。
- 同一公式混用行内/块级定界风格。

## 支持状态

`supported` —— 兼容性用例 `D-math` 与 `D-math-client` 验证（4 个公式、无错误）。

## 来源

`nuxt.config.ts` 中的 `remark-math` + `rehype-katex` 注册；样式表位于 Layer 的 `app.head`。
