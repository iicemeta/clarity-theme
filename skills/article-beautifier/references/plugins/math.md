# Math


## Purpose

LaTeX-style math via remark-math and rehype-katex, rendered server-side to KaTeX HTML.

## Basic Syntax

```md
Inline: $E = mc^2$ and $\int_0^1 x^2 \,dx$.

$$
\frac{\partial u}{\partial t} = \alpha \nabla^2 u
$$
```

## Behavior

- `$…$` for inline math, `$$…$$` for display math; `\begin{aligned}` environments work inside `$$`.
- The KaTeX stylesheet is injected by the Layer from a remote CDN (`s4.zstatic.net`) — sites that must be offline should override the head link.
- Parse errors render with `katex-error` markers; the compatibility suite asserts none appear for valid input.

## When to Use

Formulas that plain prose cannot express.

## When Not to Use

Simple arithmetic in text (`2 × 3`), or code — use inline code.

## Common Mistakes

- Unescaped `$` in prose about money — use `\$` or rephrase.
- Splitting one formula across the inline/display delimiter styles.

## Support Status

`supported` — verified by compatibility cases `D-math` and `D-math-client` (4 formulas, no errors).

## Source

`remark-math` + `rehype-katex` registration in `nuxt.config.ts`; stylesheet in the Layer's `app.head`.
