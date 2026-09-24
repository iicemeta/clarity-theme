# Key


## Purpose

A keyboard key rendered as `<kbd>`, with modifier composition and optional platform adaptation.

## Basic Syntax

```md
Press :key{code="K"} to search. Use :key{cmd code="K"} on any platform.
```

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `text` | string | Overrides the composed display text |
| `code` | string | A `KeyboardEvent.key` value, e.g. `Escape`, `ArrowUp`, ` ` (space) |
| `icon` | boolean | Symbol mode; defaults to on for macOS |
| `ctrl` / `shift` / `alt` / `meta` / `win` | boolean | Modifier flags |
| `cmd` | boolean | Smart adapter: Ctrl on Windows/Linux, Cmd (⌘) on macOS |
| `prevent` | boolean | Prevents the default action when the key press matches |

The component also emits a `press` event and tracks live modifier state; those are useful in app code, not from MDC.

## Slots

- `default` — overrides the displayed key text

## Supported Values

Display and symbol maps (source: `Key.vue`) cover `Space`, arrows, `Control`, `Delete`, `Escape`, `Meta`, `Alt`, `Backspace`, `Enter`, `Shift`, `Tab`, `Win`.

## Examples

```md
:key{code="A" ctrl shift} · :key{alt shift} · :key{code="Escape" ctrl alt icon}
```

## Nesting

Inline only.

## When to Use

Real keyboard shortcuts inside instructions.

## When Not to Use

Menu paths or UI buttons (write them as text or inline code), or decorative key spam.

## Common Mistakes

- Combining `cmd` with `ctrl` — `cmd` already resolves per platform.
- Using display names (`Esc`) instead of `code` values (`Escape`) and expecting the icon map.

## Support Status

`supported` — source-verified; not yet covered by a compatibility fixture (see audit gap 3).

## Source

`src/components/content/Key.vue`; upstream usage in the showcase.
