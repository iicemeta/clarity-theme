# Table (ProseTable)

**English** | [简体中文](./table.zh-CN.md)

## Purpose

Markdown tables automatically render inside a scroll container with a scroll toggle — no component syntax needed.

## Basic Syntax

```md
| Option | Type | Default |
| --- | --- | --- |
| `tabs` | string[] | — |
```

## Props

None for authors; ProseTable manages scroll state internally.

## Slots

None; generated from the Markdown table AST.

## Supported Values

Standard Markdown tables: alignment markers, inline code, bold, links inside cells.

## Examples

```md
| Align | Works |
| :--- | --- |
| left | yes |
```

## Nesting

Tables sit inside containers like any block.

## When to Use

Genuinely tabular data — option lists, status matrices, comparisons.

## When Not to Use

Key-value pairs that fit prose, or single-row tables.

## Common Mistakes

- Very wide tables with no abbreviated content — they scroll, but consider restructuring.
- Using tables for layout.

## Support Status

`supported` — verified by compatibility case `A-markdown` (thead/tbody, alignment classes).

## Source

`src/components/content/ProseTable.vue`.
