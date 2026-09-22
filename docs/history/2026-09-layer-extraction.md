# History: Layer Extraction and Early Validation

**English** | [简体中文](./2026-09-layer-extraction.zh-CN.md)

> Historical record — no longer authoritative for current status. Current facts live in [PROJECT-STATUS](../PROJECT-STATUS.md).

## Context

Clarity Theme began as an extraction of the generic parts of the upstream `blog-v3` Nuxt site. Earlier planning documents referred to this work as `devdoc`, `devdoc2.0`, and numbered Phase 0–6 / A–F stages. Those labels described migration work packages and one-time audits; they are not a current status system.

## Historical Sequence

- **Baseline freeze:** upstream 3.7.2 at `f6ea97d7`.
- **Purification:** removed articles, author/site configuration, friend data, redirects, deployment settings, and upstream private assets.
- **Config API:** introduced `clarity.config.ts`, Zod schemas, TS/MJS runtime tracks, and `modules/clarity-config`.
- **Layer localization:** converted CSS, icons, components, modules, remark plugins, server imports, and package paths to Layer-safe resolution.
- **Playground and generation:** added the workspace playground and static-generation validation.
- **Rendering compatibility:** added Markdown/MDC/code/math/Mermaid/music/image benchmark pages and later automated SSR/browser/hydration checks.
- **Real consumer:** added tarball packaging, independent install, export/type checks, and configuration-branch generation.
- **Config hardening:** strict schemas, friendly errors, public-config narrowing, type augmentation, dependency declarations, and anti-mirror purification.
- **Patch audit:** moved required package patches to the site consumer and removed the old inline-code MDC hunk.
- **CI:** added layered lint/typecheck/verify/sync/contract/peers, generate, consumer, and compatibility jobs.
- **Upstream sync:** added the four-category manifest, check/diff/apply/verify modes, transactional apply, regression tests, and weekly drift Issues.

## Historical Differential Site

An out-of-repo differential consumer placed the upstream blog's full data over the Theme through a local tarball. A one-time result recorded:

- 242 prerendered routes with zero reported errors
- Atom limited to 50 entries
- Stats output of 90 Content rows / 132,995 words
- OPML with 137 subscriptions
- Full consumer redirect configuration
- Patched MDC environment and consumer UI overrides

That run was a useful migration milestone but was not placed under version control or CI. By 2026-09-22 it still referenced an older local `clarity-theme-0.1.0-4.tgz`; its persisted output predates current HEAD. It must not be used as a current release gate.

## Disposition

The phase TODO lists that formerly occupied README are complete and have been removed from the user entry point. Detailed one-time audits remain in historical files outside this directory and are marked non-authoritative.
