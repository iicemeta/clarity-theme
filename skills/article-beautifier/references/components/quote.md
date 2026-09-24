# Quote


## Purpose

A large, styled quotation block with an icon line — for quotations that carry real weight in the article.

## Basic Syntax

```md
::quote
Sometimes, some words, matter a little.
::

::quote{icon="tabler:files"}
With a custom icon.
::
```

## Props

| Prop | Type / default | Notes |
| --- | --- | --- |
| `icon` | string, default `tabler:message-2` | Icon name for the icon line |

## Slots

- `default` — the quotation
- `icon` — rich icon content; overrides the `icon` prop

## Supported Values

Any icon name; body accepts Markdown.

## Examples

```md
:quote[A short inline quotation.]
```

## Nesting

Upstream nests `::blur` inside `:::quote` for spoiler quotes; keep one level.

## When to Use

One or two pivotal quotations per article.

## When Not to Use

Ordinary citations (Markdown `>` is lighter), or converting every paragraph into a quote.

## Common Mistakes

- Confusing with Markdown blockquotes; Quote is for display quotes.
- Stacking several quotes in a row.

## Support Status

`supported` — source-verified; not yet covered by a compatibility fixture (see audit gap 3).

## Source

`src/components/content/Quote.vue`; 66 occurrences in the upstream corpus.
