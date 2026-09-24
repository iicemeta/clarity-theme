# LinkCard


## Purpose

A compact card for one external resource: title, description, and icon. The workhorse for "recommended reading" entries.

## Basic Syntax

```md
::link-card
---
title: Nuxt Content
icon: https://content.nuxt.com/favicon.ico
link: https://content.nuxt.com/docs/files/markdown
---
::
```

Or with brace props for short values:

```md
::link-card{title="Nuxt" link="https://nuxt.com"}
::
```

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `title` | string, required | Card headline |
| `link` | string, required | Target URL |
| `description` | string | Falls back to the link's domain |
| `icon` | string | Icon image URL; the `#icon` slot overrides it |
| `mirror` | `ImgService` | Image mirror for the icon: `baidu` \| `fly` \| `weserv` \| `true` |

## Slots

- `icon` — rich icon content; overrides the `icon` prop

## Supported Values

A `class` attribute passes through to the card (upstream uses `class: gradient-card active` in YAML).

## Examples

```md
::link-card{title="Docs" icon="https://example.com/favicon.ico" link="https://example.com/docs" description="Reference"}
::
```

## Nesting

Standalone block; groups of cards belong in a [CardList](./card-list.md) or a plain list.

## When to Use

A short list of recommended resources, tools, or related posts that readers may click away to.

## When Not to Use

Every inline citation (use a plain link), internal navigation (use a list), or decorative filler.

## Common Mistakes

- Omitting `title`/`link`.
- Expecting the favicon to auto-resolve — unlike Badge, LinkCard shows an icon only when given one.

## Support Status

`supported` — source-verified; not yet covered by a compatibility fixture (see audit gap 3).

## Source

`src/components/content/LinkCard.vue`; upstream usage in articles and the showcase (52 occurrences).
