# FeedCard


## Purpose

A friend-link card driven by structured `FeedEntry` data: avatar, author, site title, feed status, description, arch icons. Designed for the friend-links page, not general article layout.

## Basic Syntax

```md
::feed-card
---
author: Example
title: Example Blog
desc: A short description
link: https://friend.example.com/
feed: https://friend.example.com/atom.xml
icon: https://friend.example.com/favicon.svg
avatar: https://friend.example.com/avatar.webp
archs:
  - Nuxt
date: 2026-01-02
---
::
```

## Props

All fields of `FeedEntry` (source: `src/config/feed.ts`): `author`*, `sitenick`, `title`, `desc`, `link`*, `feed`, `icon`*, `avatar`*, `archs`, `date`*, `comment`, `error` (* required).

## Slots

None.

## Supported Values

`archs` uses the shared `Arch` icon names. `error` renders as the card description when a feed is broken.

## Examples

See above; the canonical consumer is the friend-links page, which spreads entries from consumer `feeds.ts`.

## Nesting

Standalone block; do not nest.

## When to Use

Only for friend-link / blogroll data that genuinely matches `FeedEntry`.

## When Not to Use

Recommended-resource cards, project cards, or any content you had to bend into `FeedEntry` fields — use `card-list`, `link-card`, or `link-banner`.

## Common Mistakes

- Omitting required fields and expecting graceful placeholder rendering.
- Maintaining friend data inside articles instead of the consumer's `feeds.ts`.

## Support Status

`conditional` — the component is shipped and registered, but it expects consumer-owned feed data and is consumed by the friend-links page (`src/pages/link.vue` upstream). Not an article-beautification capability; excluded from the Skill's recommendations.

## Source

`src/components/content/FeedCard.vue`; type `src/config/feed.ts`; page usage in upstream `app/pages/link.vue`.
