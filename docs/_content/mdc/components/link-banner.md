# LinkBanner

**English** | [简体中文](./link-banner.zh-CN.md)

## Purpose

A wide banner-style link card with a background image — for one or two links that deserve hero-level prominence.

## Basic Syntax

```md
::link-banner
---
banner: https://example.com/cover.jpg
title: Project Name
description: One line about it
link: https://example.com/
---
::
```

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `title` | string, required | Banner headline |
| `link` | string, required | Target URL |
| `banner` | string | Background image URL |
| `description` | string | Falls back to the link's domain |
| `mirror` | `ImgService` | Route the banner through an image mirror: `baidu` \| `fly` \| `weserv` \| `true` |

## Slots

None.

## Supported Values

`mirror` accepts the image service keys defined in `src/utils/img.ts`; `true` uses the default mirror.

## Examples

```md
::link-banner{banner="/img/cover.webp" title="Theme docs" link="/docs/"}
::
```

## Nesting

Standalone block.

## When to Use

A single flagship recommendation at the top or bottom of an article.

## When Not to Use

Multiple banners in one article, or ordinary citations — use plain links or LinkCard.

## Common Mistakes

- Omitting `title` or `link` (both required).
- Using `mirror` with a local path; mirroring is for remote images that may be slow or blocked.

## Support Status

`supported` — source-verified; not yet covered by a compatibility fixture (see audit gap 3).

## Source

`src/components/content/LinkBanner.vue`; upstream usage in articles and the showcase.
