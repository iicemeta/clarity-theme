# Meta Slots

**English** | [简体中文](./meta-slots.zh-CN.md)

## Purpose

`rehype-meta-slots` lifts `meta-*` elements out of the article body into page slots — article-authored widgets and the license block, without polluting the reading flow.

## Basic Syntax

```md
---
title: An article
aside: [toc, meta-aside-github]
---

:::meta-aside-github{title="Project repository"}
::link-card
---
title: blog-v3
link: https://github.com/example/project
---
::
:::

::meta-copyright{title="No copyright reserved"}
This article is released into the public domain.
::
```

## Behavior

- The plugin (source: `src/remark-plugins/rehype-meta-slots.mjs`) removes any element whose tag starts with `meta-` from the body and stores it in `meta.slots[<name>]`.
- `meta-copyright` renders in the post footer's license area whenever present.
- `meta-aside-*` renders as an aside widget **only when** the frontmatter `aside` array lists it (e.g. `aside: [toc, meta-aside-github]`); otherwise the content is extracted and goes nowhere.

## When to Use

Article-specific aside cards (a repo card, a live status panel) and per-article license overrides.

## When Not to Use

Body content readers must see — meta slots are invisible in the article flow; regular content belongs in the body.

## Common Mistakes

- Writing `:::meta-aside-foo` without adding `meta-aside-foo` to frontmatter `aside`, then wondering where it went.
- Expecting arbitrary slot names; only `copyright` is consumed directly, `aside-*` names map to aside widgets.

## Support Status

`conditional` — works through the Layer, but requires the frontmatter `aside` registration for aside slots and is not covered by a compatibility fixture (see audit gap 3).

## Source

`src/remark-plugins/rehype-meta-slots.mjs`; consumption in `src/pages/[...slug].vue`, `src/composables/useWidgets.ts`, `src/components/post/PostFooter.vue`; upstream usage in `content/previews/example.md` and `content/posts/2024/blog-using-nuxt.md`.
