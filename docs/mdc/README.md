# Markdown / MDC Reference

**English** | [简体中文](./README.zh-CN.md)

This section documents every article-facing Markdown and MDC capability of Clarity Theme: what it looks like, its exact syntax, its props and slots, and whether an ordinary consumer site can rely on it. It is written for two audiences at once — human authors and coding agents — and is the navigation layer for the [`article-beautifier`](../../skills/article-beautifier/SKILL.md) Skill.

Source of truth, in order: the Layer implementation in `src/`, the rendering pipeline in `nuxt.config.ts`, the compatibility fixtures in `playground/content/compatibility/`, then these documents. When a document disagrees with the source, the source wins; please fix the document.

## Status vocabulary

Every capability is classified with exactly one status. The classification is evidence-based, not "it exists upstream":

| Status | Meaning |
| --- | --- |
| `supported` | The Layer ships the implementation, registers it for MDC/Markdown, and an ordinary consumer site can use it by writing the documented syntax. No consumer-specific data, page, or patch is required. |
| `conditional` | Usable, but only under a documented condition: consumer data, frontmatter registration, a consumer-owned patch, or network access. |
| `upstream-only` | Present in upstream blog-v3 but not guaranteed by the Theme. Do not guide users to it. |
| `do-not-use` | Findable in source or upstream content, but it must not be recommended for article authoring. |

## Current audit summary

The full inventory, per-capability status, evidence, and gaps live in [audit](./audit.md). Headline numbers for the current audit round:

| Total capabilities | supported | conditional | upstream-only | do-not-use |
| ---: | ---: | ---: | ---: | ---: |
| 39 | 30 | 7 | 0 | 2 |

Zero `upstream-only` component gaps means every article component of the audited upstream baseline is carried by the Layer. The `conditional` entries are almost all consumer patches and data-driven friend-link components, not missing implementations — see [audit gaps](./audit.md#gaps) before assuming a feature is broken.

## Section map

| Document | Purpose |
| --- | --- |
| [Syntax](./syntax.md) | The MDC syntax forms themselves: inline components, containers, YAML props, slots, nesting, prose mapping |
| [Components](./components/_index.md) | One reference per MDC component (Alert, Badge, Tab, Pic, …) |
| [Plugins](./plugins/_index.md) | Fence-driven and remark/rehype-driven capabilities (math, Mermaid, ABC, meta slots, patches) |
| [Audit](./audit.md) | Complete inventory, classification evidence, gaps, and maintenance workflow |

## Reading order for agents

1. Read [`skills/article-beautifier/references/_index.md`](../../skills/article-beautifier/references/_index.md) — the machine-readable capability index.
2. Select only the reference files that match the article's semantics.
3. Open the matching page under `docs/mdc/components/` or `docs/mdc/plugins/`. When the Skill is installed standalone via `npx skills add`, use its bundled copies under `skills/article-beautifier/references/` instead — they are synced duplicates of these pages.
4. Never guess a prop, slot, or variant; if it is not documented there, do not use it.
