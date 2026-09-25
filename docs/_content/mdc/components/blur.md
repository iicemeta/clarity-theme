# Blur

**English** | [简体中文](./blur.zh-CN.md)

## Purpose

Spoiler or sensitive text that stays blurred until the reader hovers or touches it.

## Basic Syntax

```md
:blur[You know too much already.]
```

Container form for a longer passage:

```md
::blur
Multi-paragraph content stays blurred as one region.
::
```

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `text` | string | Slot fallback |

## Slots

- `default` — blurred content; falls back to `text`

## Supported Values

Plain strings; inline Markdown inside the slot works.

## Examples

```md
The password is :blur[hunter2] — do not commit it.
```

## Nesting

Inline form stays inline. Upstream nests `::blur` around a `:::quote`; keep nesting shallow.

## When to Use

Spoilers, quiz answers, or content a reader may want to skip.

## When Not to Use

Anything the reader must not miss — blurred safety warnings defeat themselves.

## Common Mistakes

- Blurring whole paragraphs of ordinary content.
- Assuming the text is hidden from the page source — it is only visually blurred.

## Support Status

`supported` — source-verified; not yet covered by a compatibility fixture (see audit gap 3).

## Source

`src/components/content/Blur.vue`; upstream usage in articles and the showcase.
