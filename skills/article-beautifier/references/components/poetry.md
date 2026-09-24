# Poetry


## Purpose

A centered verse block with an optional title, author, and footer — for quoting poems or lyrics.

## Basic Syntax

```md
::poetry
---
title: The Title
author: A Poet
footer: Optional colophon
---
Line one of the verse,
line two of the verse.
::
```

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `title` | string | Centered heading |
| `author` | string | Centered attribution line |
| `footer` | string | Centered closing line |

## Slots

- `default` — the verse body

## Supported Values

Plain lines; keep each line short enough to avoid wrapping.

## Examples

```md
::poetry{title="无题" author="佚名"}
床前明月光，
疑是地上霜。
::
```

## Nesting

Standalone block; do not nest components inside.

## When to Use

Quoting an actual poem, lyric, or epigraph.

## When Not to Use

Ordinary blockquotes or callouts — use Markdown quotes or Alert.

## Common Mistakes

- Expecting Markdown block structure inside the verse body.
- Using it to center arbitrary text.

## Support Status

`supported` — source-verified; not yet covered by a compatibility fixture (see audit gap 3).

## Source

`src/components/content/Poetry.vue`; upstream usage in articles and the showcase.
