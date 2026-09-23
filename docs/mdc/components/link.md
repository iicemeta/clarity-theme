# Link (ProseA)

**English** | [简体中文](./link.zh-CN.md)

## Purpose

Ordinary Markdown links get themed rendering automatically: external links show a domain icon and a domain tooltip. No MDC required.

## Basic Syntax

```md
See the [Nuxt docs](https://nuxt.com/docs) or a [section](#supported-values).
```

## Props

`ProseA` accepts `href` (required) and `icon` (string or `false`); authors normally never pass them — the MDC prose mapping supplies them from the Markdown AST.

## Slots

- `default` — the link text

## Supported Values

External URLs get automatic domain icons (source: `getDomainIcon`); internal site paths such as `/posts/my-post` render without one. Autolinks (`<https://…>`) work too.

## Examples

```md
[a](#section){icon="tabler:color-swatch"} — inline-props syntax passes the icon; plain Markdown cannot.
```

## Nesting

Inline; link text may contain inline Markdown.

## When to Use

Always — this is the default link rendering. Write plain Markdown links.

## When Not to Use

Do not replace links with cards unless the target deserves visual prominence (see [link-card](./link-card.md)).

## Common Mistakes

- Hand-writing `:prose-a` — the component is reached through Markdown syntax.
- Expecting icon control from plain Markdown; `icon` (string, or `false` to disable) needs inline-props syntax.

## Support Status

`supported` — verified by compatibility cases `A-markdown` (internal, external, autolink).

## Source

`src/components/content/ProseA.vue`; domain icon utilities in `src/utils`.
