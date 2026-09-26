# Tip

**English** | [简体中文](./tip.zh-CN.md)

## Purpose

A dotted-underline inline tooltip: hover (or focus) reveals a short explanation without leaving the paragraph.

## Basic Syntax

```md
The term :tip[APF]{tip="Advanced Page Flow"} appears later.
```

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `text` | string | Slot fallback |
| `tip` | string | Tooltip content |
| `icon` | string \| boolean | Icon name; bare `icon` shows the default icon |
| `copy` | boolean | Click copies the slot text; tooltip becomes “点击复制” |
| `tipOptions` | `TippyOptions` | Escape hatch for tooltip behavior |

## Slots

- `default` — the visible term; falls back to `text`

## Supported Values

Short tooltip strings; `icon=false` hides the icon.

## Examples

```md
:tip[no icon]{icon tip="works too"} · :tip[npm command]{copy text="pnpm i"}
```

## Nesting

Inline only.

## When to Use

Jargon that needs a one-line gloss; small copyable tokens.

## When Not to Use

Definitions that deserve a sentence (write one), or tooltips carrying safety-critical information (touch users may miss them).

## Common Mistakes

- Long multi-sentence tooltip content.
- Both `icon` as a string and expecting the copy icon — the icon prop wins when set.

## Support Status

`supported` — verified by compatibility case `C-mdc`.

## Source

`src/components/content/Tip.vue`; 21 occurrences in the upstream corpus.
