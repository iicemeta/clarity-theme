# Reading Time

**English** | [简体中文](./reading-time.zh-CN.md)

## Purpose

`remark-reading-time` injects a computed `readingTime` into every content file's frontmatter; the article header, lists, and stats consume it.

## Basic Syntax

Nothing to write — and nothing you may write:

```yaml
---
title: An article
# readingTime: ← never set this manually
---
```

## Behavior

The plugin computes `{ text, minutes, time, words }` at parse time. The schema carries it through to pages and components (source: `src/config/content.ts`, `PostHeader`).

## When to Use

Always; it is automatic.

## When Not to Use

Never hand-edit `readingTime`; the injected value wins or the schema rejects the mismatch.

## Common Mistakes

- Copying `readingTime` between articles during refactors.

## Support Status

`supported` — exercised by every compatibility article case (e.g. `E-normal-article`).

## Source

`remark-reading-time` registration in `nuxt.config.ts`; schema in `src/config/content.ts`.
