# Badge


## Purpose

A compact inline chip that names a technology, site, or person, optionally linking out.

## Basic Syntax

```md
Built with :badge[Nuxt]{link="https://nuxt.com"} and :badge[GitHub]{link="https://github.com"}.
```

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `text` | string | Slot fallback when no bracket text is given |
| `link` | string | Turns the badge into a link; also drives auto image and tooltip |
| `img` | string | Explicit image URL; disables auto detection |
| `round` | boolean | Round style when there is no image |
| `square` | boolean | Square style when there is an image |

Auto image resolution (source: `Badge.vue`): explicit `img` → GitHub avatar derived from a GitHub `link` → favicon of an external `link` → no image. With an image the default is round unless `square`; without an image the default is square unless `round`. The tooltip shows the external domain or the decoded internal link.

## Slots

- `default` — badge text; falls back to `text`

## Supported Values

Any string props. `link` accepts internal paths or external URLs.

## Examples

```md
:badge[plain round]{round} :badge[with image]{img="https://example.com/a.png"}
```

## Nesting

Inline only; do not place blocks inside.

## When to Use

Technology names in prose, a small set of related sites, or attributions where a full link card is too heavy.

## When Not to Use

Long labels (use a link card), repeated decoration after every noun, or replacing normal links.

## Common Mistakes

- Expecting `round`/`square` to be independent of whether an image resolved.
- Omitting `link` and expecting an auto image — auto images derive from `link`.

## Support Status

`supported` — verified by compatibility case `C-mdc` (including consumer override of the component).

## Source

`src/components/content/Badge.vue`; upstream usage concentrated in showcase articles.
