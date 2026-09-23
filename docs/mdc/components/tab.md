# Tab

**English** | [简体中文](./tab.zh-CN.md)

## Purpose

Tabbed panels: alternatives of the same content (examples, before/after, language variants) shown one at a time.

## Basic Syntax

```md
::tab{:tabs='["Vue", "Markdown"]'}
#tab1
Vue content.
#tab2
Markdown content.
::
```

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `tabs` | string[], required | Tab labels, in order |
| `center` | boolean | Center the tab bar |
| `active` | string \| number | 1-based index (or its string) of the initially active tab |

## Slots

- `#tab1`, `#tab2`, … `#tabN` — one slot per entry in `tabs`

## Supported Values

Long label arrays are easiest in YAML:

```md
::tab
---
tabs:
  - First
  - Second
  - Third
center: true
active: 2
---
#tab1
…
::
```

## Examples

```md
:::tab{:tabs='["Old", "New"]' center}
#tab1
Old implementation.
#tab2
New implementation.
:::
```

## Nesting

Accepts code fences and nested containers (increase colon depth). Known issue: the MDC parser swallows code indentation inside Tab slot blocks unless the consumer registers the detab patch (source comment in `Tab.vue`); use spaces there.

## When to Use

Genuinely parallel variants readers will pick between.

## When Not to Use

Sequential steps, hiding content (use Folding), or two tabs of one line each.

## Common Mistakes

- Mismatched `tabs` length and `#tabN` slots.
- 0-based `active` — it is 1-based.

## Support Status

`supported` — source-verified; not yet covered by a compatibility fixture (see audit gap 3).

## Source

`src/components/content/Tab.vue`; 35 occurrences in the upstream corpus.
