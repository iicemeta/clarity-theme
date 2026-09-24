# Roadmap

**English** | [简体中文](./roadmap.zh-CN.md)

Open work, ordered. Completed work is not tracked here — it is recorded in the [CHANGELOG](../../CHANGELOG.md) and the historical audits under [history](../history). This page is subordinate to source code, package manifests, tests, CI, and `sync-manifest.json`; implementation may choose better files or techniques as long as the intended boundary and behavior remain the same.

## Now

1. **Creator package first publication** — complete the one-time npm Trusted Publisher setup for `publish-create.yml`, publish the reviewed `create-v<version>` GitHub Release, and verify the registry artifact with `npm view create-clarity-theme` and the public command (see [publishing §creator](./publishing.md#12-publishing-create-clarity-theme)).
2. **TypeScript / MJS parity gate** — public runtime `.mjs` files and TS sources are paired manually today. Add a deterministic parity check (paired export names, schema defaults/strictness, representative helper outputs) before considering code generation.

## Next

1. **Configurable external asset origins** — KaTeX/Inter default to `s4.zstatic.net` and JetBrains Mono/Noto Serif SC to Google `.cn` endpoints as fixed Layer head links. Add one documented asset-origin configuration group with explicit defaults, replacement, and a way to disable Theme-provided remote links.
3. **Reduce the `plain-shiki` consumer patch** — evaluate a Theme-side public selector option, then pursue the upstream dependency fix; do not fork the dependency.
4. **`@nuxt/image` fractional densities** — pursue the upstream `parseInt → parseFloat` parsing fix and add a Theme regression case when supported.

## Later

1. Incremental interaction, accessibility, responsive, and service-failure testing (archive controls, code collapse/copy, widget combinations, preview entry, drawers/masks, Twikoo remote init, ABC audio, search keyboard behavior).
2. Reduce accepted warning classes (`NUXT_B3011`, link-checker/resource noise, Vue slot/readonly, og:image, `twitter:card`, remote Shiki) without hiding useful diagnostics.
3. Restricted/offline Shiki build support (bundling or an explicit local engine option).
4. Decide whether a `site.author.email` visibility/output option is justified by a concrete anti-spam/privacy requirement.
5. Generalize purity checking beyond the explicit upstream-identifier allow/block list, without weakening current guarantees.
6. Split large verification harnesses only when a concrete change makes them hard to maintain; coverage and failure clarity must not decrease.

## Deferred

1. **Differential consumer redesign** — the out-of-repo `theme-based-blog-v3` environment is historical manual evidence, not a CI gate; do not import it into this repository (it would mix upstream articles/private site data into the Theme package).
2. **Node 26 CI coverage** — the open engine range has no stable matrix representative; revisit when a fixed `^26.x` range exists.
3. **Broad visual regression / new platform work** — not planned until interaction coverage matures.

## Frozen contracts

Do not redesign these while pursuing the items above:

- The five package export entries and the package-export vs Layer-runtime distinction.
- The consumer file model: `clarity.config.ts`, `content.config.ts`, optional `feeds.ts`, optional UI-only `app/app.config.ts`.
- The `clarity.config.ts` input shape and strict unknown-field rejection.
- The Content collection factory and article schema boundary.
- Same-path component override behavior (including the accepted `NUXT_B3011` warning).
- Consumer ownership of site content, deployment rules, secrets, redirects, and package-manager patches.
- Transactional upstream-sync semantics: unknown paths block apply; adapted include paths conflict rather than overwrite.

## Do not do now

- Do not implement a random permalink generator (belongs to consumer build scaffolding).
- Do not import the full differential blog or its content into this repository.
- Do not adopt, fork, or redistribute consumer dependency patches.
- Do not auto-generate all `.mjs` files before adding a minimal parity gate.
- Do not refactor the complete UI or test harness while boundary work is open.
- Do not advance the upstream baseline past an unreviewed delta.
