# CardList


## Purpose

Turns a plain Markdown list into a responsive grid of cards — for genuinely parallel, self-contained items.

## Basic Syntax

```md
::card-list
- **Fast**: builds in minutes
- **Typed**: end-to-end types
- **Layered**: override anything
::
```

## Props

None.

## Slots

- `default` — the list (or any content) to lay out as cards

## Supported Values

Works with `ul`/`ol`; ordered lists keep their order. Nested content inside each item renders inside the card.

## Examples

```md
::card-list
1. **Install** — add the Layer
2. **Configure** — write `clarity.config.ts`
3. **Write** — use Markdown and MDC
::
```

## Nesting

List items may contain inline Markdown. Avoid putting large code fences or other containers inside every card.

## When to Use

Feature overviews, recommended resources, option comparisons — a handful of parallel, independent items.

## When Not to Use

Sequential steps that readers must follow in order (use prose or a list), single items, or wrapping every list in the article.

## Common Mistakes

- Expecting card content from prose paragraphs — put a list inside.
- Using it for two items; a plain list reads better.

## Support Status

`supported` — verified by compatibility case `C-mdc`.

## Source

`src/components/content/CardList.vue`; upstream usage in articles and the showcase.
