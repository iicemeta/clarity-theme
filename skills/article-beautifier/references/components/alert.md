# Alert


## Purpose

A typed callout block for semantics that genuinely deserve emphasis: warnings, errors, questions, and notes whose loss would hurt the reader.

## Basic Syntax

```md
::alert{type="warning" title="Back up first"}
Deleting the volume is irreversible.
::
```

## Props

| Prop | Type / default | Notes |
| --- | --- | --- |
| `type` | `tip` \| `info` \| `question` \| `warning` \| `error`, default `tip` | Picks icon, color, and default title |
| `title` | string, optional | Overrides the type's default title |
| `text` | string, optional | Body fallback when the default slot is empty |
| `card` | boolean | Force card style |
| `flat` | boolean | Force flat style |
| `icon` | string | Icon name, e.g. `tabler:files` |
| `color` | string | CSS color, e.g. `var(--c-accent)` or `#F80` |

`card` vs `flat` resolves through the app-config key `clarity.component.alert.defaultStyle`: with the default `card` style, alerts are cards unless `flat` is set; with `flat` default, `card` opts in.

## Slots

- `default` — the body; falls back to the `text` prop
- `title` — rich title; falls back to the `title` prop, then the type default (`提醒`/`信息`/`问题`/`警告`/`错误`)

## Supported Values

Type defaults (source: `typeMap` in `Alert.vue`): `tip` → `tabler:note` / green, `info` → `tabler:info-circle`, `question` → `tabler:help-circle` / blue, `warning` → `tabler:alert-triangle` / orange, `error` → `tabler:circle-x` / red.

## Examples

```md
::alert{type="error" title="Do not use in production"}
The API is experimental.
::
```

## Nesting

Body accepts Markdown and other inline components. Prefer not to nest containers inside alerts.

## When to Use

Genuine risk notes, destructive-action warnings, corrections that change the meaning of surrounding text, or a question the section answers.

## When Not to Use

Ordinary explanations, every subsection opener, or decoration. If an article grows a stack of alerts, restructure the prose instead.

## Common Mistakes

- Using `type="danger"` — not a valid value; it is `error`.
- Expecting `card`/`flat` to be independent of app config.
- Putting the body in `title`.

## Support Status

`supported` — verified by compatibility case `C-mdc`.

## Source

`src/components/content/Alert.vue`; upstream `app/components/content/Alert.vue`; real usage across the upstream corpus (61 container + 2 inline occurrences).
