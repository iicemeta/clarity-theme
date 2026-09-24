# Folding


## Purpose

A native collapsible block for secondary content: long reference lists, digressions, spoiler sections.

## Basic Syntax

```md
::folding{title="Reference links"}
- [Docs](https://example.com/docs)
- [Spec](https://example.com/spec)
::
```

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `title` | string | Summary text; the `title` slot overrides it |

`open` is not a declared prop: it passes through as an attribute onto the root `<details>` element, so `::folding{open}` starts expanded. That fallthrough is source-verified behavior, not a component API.

## Slots

- `default` — collapsible body
- `title` — rich summary; falls back to the `title` prop

## Supported Values

Any Markdown in the body, including code fences and nested containers.

## Examples

```md
:::folding{open title="Full changelog"}
```md
… long block …
```
:::
```

## Nesting

Nests safely; increase the colon depth around code fences.

## When to Use

Content that is worth keeping but would bury the main thread — appendix material, long logs, optional deep-dives.

## When Not to Use

Content readers must read (they may never open it), one-line asides (use a sentence or Tip), or hiding bad structure.

## Common Mistakes

- Relying on `open` as if it were a documented prop.
- Empty `title` and no `title` slot — the summary renders blank.

## Support Status

`supported` — verified by compatibility case `C-mdc`.

## Source

`src/components/content/Folding.vue`; upstream usage in articles and the showcase.
