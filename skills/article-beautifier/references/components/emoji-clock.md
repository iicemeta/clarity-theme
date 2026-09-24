# EmojiClock


## Purpose

A clock emoji that matches a time — either a fixed timestamp or the reader's current time.

## Basic Syntax

```md
:emoji-clock
:emoji-clock{rotate}
:emoji-clock{datetime="2024-11-09 23:39:30"}
```

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `datetime` | string | Fixed time; omit for the live clock, refreshed every 30 s |
| `rotate` | boolean | Minute-hand mode: emoji rotates in 5-minute steps |

## Slots

None.

## Supported Values

`datetime` is parsed with the site's `toZonedTemporal` helper into a zoned Temporal value.

## Examples

```md
The deploy window opens at :emoji-clock{datetime="2026-01-01 09:00:00"} sharp.
```

## Nesting

Inline only.

## When to Use

Timestamps in casual or diary-style articles; a small live "now" indicator.

## When Not to Use

Any place a precise, accessible time matters — use plain text; an emoji is not machine-readable time.

## Common Mistakes

- Relying on the live clock for scheduled-event times.
- Assuming a specific timezone without checking `datetime` semantics.

## Support Status

`supported` — source-verified; not yet covered by a compatibility fixture (see audit gap 3).

## Source

`src/components/content/EmojiClock.vue`; upstream usage in the showcase.
