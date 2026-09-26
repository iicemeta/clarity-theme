# Project Status

**English** | [简体中文](./project-status.zh-CN.md)

Current architecture and verification facts for maintainers. This page describes the repository as it is, not a release snapshot: the latest published release and its evidence live in the root [CHANGELOG](../../CHANGELOG.md), and completed one-time work is recorded under [history](../history). When this page disagrees with source, tests, CI, or `sync-manifest.json`, those win.

## Current architecture

Clarity Theme is a reusable Nuxt 4 Layer rooted at `nuxt.config.ts`, with all runtime source under `src/` (see [architecture](../concepts/architecture.md)):

- A layer-only `clarity-source-layout` bootstrap module applies the `src/` layout to the Clarity layer only, so npm, Git-commit, and local-directory installs resolve identically without overriding consumer directories.
- A `clarity-config` module loads and validates `clarity.config.ts` (Zod-strict), injects the flat upstream-shaped app config (so upstream components read `useAppConfig()` exactly as blog-v3 does), generates build-time data modules for `~~/package.json` and `~~/pnpm-workspace.yaml`, wires SEO/robots/llms/route rules/head scripts, and applies permalink and `/posts`-prefix Content hooks.
- The upstream `modules/anti-mirror` module is registered explicitly (after `clarity-config`) and stays always-on with the upstream hard-coded blacklist; its `features.antiMirror` configuration is accepted but ignored (the module cannot be turned off), and it is scheduled for removal in a future breaking release.
- Five public package exports (`.` / `./config` / `./content` / `./schema` / `./img`) with paired `.mjs` runtime and `.d.mts` type tracks.
- Generic UI, pages, components, styles, composables, stores, Markdown/MDC/Shiki/KaTeX/Mermaid/ABC rendering, search, pagination, archive, TOC, Atom/OPML/stats outputs.
- An independent `create-clarity-theme` workspace package (own version, changelog, tests, and publish workflow) scaffolds new consumers.

## Current verification state

The verification pipeline is layered (see [testing](./testing.md)) and all layers are wired into CI:

- Static/contract: lint, typecheck, theme purity, upstream-sync tool regression (including rehearsal runs against a non-default ref, declared mechanical transforms, boundary blocking, and explicit `--accept`), migration skill regression, compatibility contract, peer audit, docs governance.
- Generation: playground static generation through the workspace-linked Layer.
- Real consumers: packed-tarball consumer with export/typecheck/configuration-branch assertions; production SSR + real-browser + dev-hydration compatibility; creator CLI/E2E/tarball suites.
- Release: `release:check` gate plus a registry-consumer test that installs the published npm version.

The generated feature-by-feature matrix is [compatibility](../reference/compatibility.md); it asserts presence/behavior of features, not visual quality.

## Package boundary

| Property | Value |
| --- | --- |
| npm package | `clarity-theme`, MIT, `publishConfig.access=public` |
| Published payload | `src/` (all Theme runtime source) + root Layer/config metadata, license, README |
| Excluded from payload | `docs/`, `playground/`, `scripts/`, `tests/`, `skills/`, `.github/`, workspace/lock files, sync manifest |
| Creator package | `create-clarity-theme` in `create-clarity-theme/` — independent npm metadata, bin, template, tests, and workflow |
| Runtime contract | Node `^22.19 \|\| ^24.11 \|\| >=26`, pnpm `12.4.1` (development), Nuxt peer `^4.5.2`, Vue peer `^3.5.42` |

The Theme package carries no patch directory and no site data: articles, friend links, redirects, deployment settings, secrets, and package-manager patches are consumer-owned (see [patch strategy](./patches.md)).

## Upstream baseline

The reviewed upstream baseline is recorded in [`sync-manifest.json`](../../sync-manifest.json) (repository, branch, commit, upstream version, framework versions, sync time). The weekly sync workflow only detects and reports drift; applying changes is always a human, transactional decision (see [upstream sync](./upstream-sync.md)).

The baseline tracks upstream's released branch. An unreleased upstream branch can be rehearsed without committing to it via `node scripts/sync-upstream.mjs <diff|apply> --ref <branch>`; a rehearsal against upstream's development branch was performed and the reviewed upstream content was deliberately left out of this release (see [rc.2 promotion](./rc2-promotion.md)). The baseline therefore remains upstream 3.7.2.

## Known limitations

1. Remote CSS/font origins (KaTeX, Inter, JetBrains Mono, Noto Serif SC) are built-in defaults; making them configurable is roadmap work.
2. `plain-shiki` scope rendering needs the documented consumer patch until the upstream dependency fixes its selector behavior.
3. Upstream-derived sync paths whose local form deviates from upstream beyond a declared mechanical replacement — and paths the parity manifest records as `boundary` / `bugfix` — still require a human decision during sync. The tool now detects and reports both classes precisely instead of aborting with an "unclassified" message, and `--accept` records the decision for a path that was reviewed and is wholly upstream-owned, but the review itself remains manual.
4. Same-path component overrides emit the intentional `NUXT_B3011` duplicate-name warning.
5. Compatibility tolerates some non-fatal warning classes (Vue slot/readonly, og:image/twitter:card deprecations, external-resource noise).
6. Shiki depends on remote esm.sh imports; restricted/offline builds may be affected.
7. Node 26+ is allowed by the engine range but has no stable CI matrix representative.
8. Remote service behavior (Twikoo initialization, ABC audio, search keyboard behavior, image-service failures) and several UI interactions lack systematic automation; this does not mean the features are unimplemented.
9. `site.author.email` remains intentionally public metadata (HTML author meta and feed output); a visibility option is deferred.
10. Paired TS/MJS runtime tracks are kept in sync manually; a parity gate is roadmap work.

## Non-goals

- Clarity will not bundle articles, author configuration, redirects, deployment configuration, analytics IDs, private tokens, or friend data.
- It will not operate Twikoo, analytics, image proxy, search index, or comment services as a backend.
- It will not carry consumer package-manager patches.
- It will not automatically merge upstream changes.
- No CMS, database layer, general-purpose i18n framework, or visual regression system is currently planned.

## Pointers

- Public API boundary: [API](../reference/api.md) · configuration surface: [configuration](../guides/configuration.md)
- Open work: [roadmap](./roadmap.md) · release process: [publishing](./publishing.md) · release template: [release checklist](./release-checklist.md)
- Documentation rules: [documentation](./documentation.md) · historical audits: [history](../history)
