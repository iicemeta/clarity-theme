# Project Status

**English** | [简体中文](./PROJECT-STATUS.zh-CN.md)

> Snapshot date: 2026-09-22, Asia/Taipei. This document describes the current repository. Historical phase narratives and old one-off audit results are kept in [history](./history/2026-09-layer-extraction.md) or marked as historical audit records.

## Documentation Source of Truth

When documents disagree, precedence is:

1. Current source code and package manifests
2. `package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml`
3. Automated tests and compatibility contracts
4. GitHub Actions workflows
5. `sync-manifest.json`
6. README and other documentation

Code, tests, CI, and the sync manifest override prose. A statement in this file is not a substitute for those sources.

## 1. Snapshot

| Item | Current fact |
| --- | --- |
| Repository branch | `master` |
| HEAD at Phase 20 start | `433d042ed3b626a048e84000ba2039102df61f28` (`docs: establish current reality-sync baseline`) |
| Working tree | Clean and synchronized with `origin/master` before documentation changes |
| Package | `clarity-theme` v0.1.2, MIT |
| Distribution state | npm release pipeline ready (OIDC publish workflow, release gate, changelog); the gated `0.1.1` is published (2026-09-22T09:45:26Z) and the current gated release is **`0.1.2` from tag `v0.1.2`** (the `src/` layout migration). **A defective `clarity-theme@0.1.0` was published out-of-band at 2026-09-22T07:28:22Z** by `creampack <creampack@iicemeta.com>` from pre-P0 gitHead `5a03778`, without the gate or provenance; the registry consumer test fails typecheck inside it |
| Upstream baseline | `blog-v3` 3.7.2, `main` @ `f6ea97d745517feb52f0c100e89acb36f0adc12f` |
| Upstream drift | None: a Phase 20 direct remote-head check returned the manifest baseline commit |
| Local runtime used for verification | Node.js 24.15.0, pnpm 12.4.1, Nuxt 4.5.2, Vue 3.5.43 |
| Current local verification | The full ordered suite passed at code commit `e601eb5`; Phase 20 reran only purity verification and the compatibility contract, and did not rerun build/consumer/browser suites |

The differential consumer outside this Git repository is a historical/manual environment, not part of CI. Its persisted output predates the current Theme HEAD and must not be treated as a current release gate.

## 2. Package / Runtime

| Field | Value |
| --- | --- |
| Name | `clarity-theme` |
| Version | `0.1.2` |
| License | MIT |
| Homepage / repository | `https://github.com/iicemeta/clarity-theme` |
| Node engine | `^22.19 \|\| ^24.11 \|\| >=26` |
| Package manager | `pnpm@12.4.1` |
| Nuxt peer | `^4.5.2` |
| Vue peer | `^3.5.42` |
| Nuxt installed in development workspace | 4.5.2 |
| Vue installed in development workspace | 3.5.43 |
| Published package payload | `src/` (all Theme runtime source), root Layer/config metadata, license, and README |
| Excluded from package payload | `docs/`, `playground/`, `scripts/`, `tests/`, `skills/`, `.github/`, workspace and lock files, sync manifest |

The `pnpm pack` audit reports 151 files (unchanged by the `src/` layout migration), including 30 release-required files (the previous 28 plus `src/config/server.ts` and `src/server/utils/clarity.ts`) and the Chinese README (`README.zh-CN.md`). The package exposes five export entries, declares `publishConfig.access=public`, and has no patch directory. `CHANGELOG.md`, `scripts/release-check.mjs`, `scripts/test-registry-consumer.mjs`, and `.github/workflows/publish.yml` complete the publication pipeline.

## 3. Upstream Baseline

- Upstream project: `blog-v3` on GitHub; the exact Git URL is stored in `sync-manifest.json`.
- Baseline commit: `f6ea97d745517feb52f0c100e89acb36f0adc12f`.
- Upstream version recorded by the manifest: 3.7.2.
- Recorded upstream framework versions: Nuxt 4.5.2, Content dependency range `^3.16.0`.
- Recorded sync time: 2026-09-21 16:40 +08:00.
- Current remote `main` equals that commit.

See [UPSTREAM](./UPSTREAM.md) for manifest categories, commands, conflict behavior, and known classification gaps.

## 4. Project Positioning

Clarity Theme is a reusable Nuxt 4 Layer extracted from the upstream blog implementation. It owns generic blog UI, routing, Markdown/MDC rendering, Content schema generation, SEO/feed/server outputs, and the configuration bridge.

**Theme responsibilities**

- Nuxt Layer configuration and dependency integration
- Generic pages, layouts, components, styles, stores, and composables
- Markdown, MDC, code highlighting, math, Mermaid, ABC music, and image rendering pipeline
- `clarity.config.ts` schema, defaults, validation, and build-time injection
- Content collection factory and article metadata schema
- Atom, OPML, statistics, robots, sitemap, and LLMs output routes/configuration
- UI defaults and the consumer override mechanism

**Consumer responsibilities**

- Site identity and public site metadata in `clarity.config.ts`
- Articles and other content under `content/`
- `content.config.ts` using `createClarityContentConfig()`
- Optional `feeds.ts` friend data
- UI and same-path component overrides
- Runtime secrets, deployment configuration, redirects, analytics IDs, and site-level package patches

**Theme non-responsibilities**

- Storing any concrete blog content or upstream author data
- Providing a comment backend, analytics backend, image service, database, or CMS
- Carrying package-manager patches or consumer deployment rules
- Automatically merging upstream changes without human review

## 5. Current Architecture

The package is a single Nuxt Layer entry backed by a build-time configuration module:

```text
consumer clarity.config.ts
  -> defineClarityConfig() validation/defaults
  -> src/modules/clarity-config build-time load and second validation
  -> appConfig / SEO / head / route rules / aliases
  -> Layer pages, components, server routes, and Content pipeline

consumer app/app.config.ts
  -> deep UI override, merged above Theme defaults and module-injected defaults

consumer content/ + content.config.ts + optional feeds.ts
  -> Content collection, article routes, friend page, Atom/OPML outputs
```

The complete boundary, configuration flow, content flow, server flow, aliases, and override mechanism are documented in [ARCHITECTURE](./ARCHITECTURE.md).

## 6. Public API

Explicit package exports:

| Export | Purpose |
| --- | --- |
| `clarity-theme` | Nuxt Layer root (`nuxt.config.ts`) |
| `clarity-theme/config` | `defineClarityConfig()` and configuration/schema types |
| `clarity-theme/content` | `createClarityContentConfig()` and `ArticleSchema` |
| `clarity-theme/img` | Pure image/avatar/favicon URL helpers |
| `clarity-theme/schema` | Zod schemas and schema-derived types |

The Layer also supports the `useClarity*` runtime auto-imports and same-path component overrides. These are Layer usage contracts, not independent ESM subpaths. The complete boundary is in [API](./API.md).

## 7. Configuration Surface

| Surface | Owner | Required? | Consumed at | Notes |
| --- | --- | --- | --- | --- |
| `clarity.config.ts` | Consumer | Yes; only `site` is required at top level | Definition time, module setup, Content build, appConfig, SEO, server routes | Strict Zod schema; unknown fields fail |
| `app/app.config.ts` | Consumer | No | Runtime appConfig | Only UI groups; deep object merge, arrays replace wholesale |
| `content.config.ts` | Consumer | Yes for Content | Content build | Calls the Theme factory with parsed site config |
| `feeds.ts` | Consumer | No | Friend page and OPML | Falls back to empty data with warning |
| `runtimeConfig` | Consumer | As needed | Nuxt runtime | Only valid place for real secrets |
| Nitro private runtime config (`runtimeConfig.clarity`) | Theme | Injected at build | Server routes only | Full site/feed/stats values plus feature route flags; read through the internal `useClarityServerConfig()` and never serialized to the client |
| `clarityConfig.configFile` module option | Consumer | No | Module setup | Overrides automatic config-file discovery |

Field-level required/default/client visibility rules are maintained in [configuration](./CONFIGURATION.md).

## 8. Features

Legend: ✅ Implemented, 🧪 Verified by current automated tests unless explicitly marked historical, ⚠️ Known limitation, 📌 Future work.

| Capability | Status | Current facts |
| --- | --- | --- |
| Nuxt Layer entry | ✅ 🧪 | Workspace playground and independent tarball consumer generate successfully |
| Public config/schema/content/img exports | ✅ 🧪 | Pure Node smoke, typecheck, and consumer generation cover all five entries |
| Markdown | ✅ 🧪 | Headings, emphasis, links, lists, tasks, quotes, tables, footnotes, and inline code covered by SSR/browser/consumer assertions |
| MDC components | ✅ 🧪 | Alert, Tip, Copy, CardList, Folding, Badge, and consumer Badge override covered; other implemented components are not exhaustively asserted |
| Code and Shiki | ✅ 🧪 ⚠️ | Inline/fenced code, language, filename, meta, diff, tabs, highlighting, collapse defaults, and custom themes verified; plain-highlight behavior and exact colors depend on the patch environment, and Shiki imports remote esm.sh resources |
| Math | ✅ 🧪 | Inline/block/aligned KaTeX SSR and browser rendering verified |
| Mermaid | ✅ 🧪 | Two diagram types render SVG in a real browser; error fallback absence checked |
| ABC music | ✅ 🧪 ⚠️ | Score SVG/paths verified; audio controls/sound fonts are not asserted |
| Images | ✅ 🧪 ⚠️ | Markdown image and `Pic` figure/zoom markup verified; fractional `densities="1.5x"` behavior needs the consumer `@nuxt/image` patch |
| Client search | ✅ 🧪 ⚠️ | MiniSearch modal, result text/link, and article navigation verified; keyboard navigation and ranking are not covered |
| Article list | ✅ 🧪 | Sorting, category filtering, pagination, cover/metadata rendering covered at the current contract depth |
| Archive | ✅ 🧪 ⚠️ | Year grouping and hydration verified; spacing/column controls and all interactive controls are not covered |
| Pagination | ✅ 🧪 | Page 2 query, list switching, and hydration verified |
| TOC | ✅ 🧪 ⚠️ | SSR structure and depth-4 pipeline verified; scroll synchronization is not asserted |
| SEO | ✅ 🧪 ⚠️ | WebSite/article metadata, canonical, og site/name/description verified; empty og:image and missing image dimensions produce non-fatal warnings |
| Robots | ✅ 🧪 | Sitemap declaration and configured disallow rules verified |
| Sitemap | ✅ 🧪 | Base site, ordinary article, and permalink URLs verified |
| LLMs | ✅ 🧪 | Site title/description output verified |
| Atom | ✅ 🧪 | Default and `enableStyle=false`, limits, entries, permalinks, and XSLT branch verified |
| OPML | ✅ 🧪 | Own feed and friend feed output verified |
| Stats | ✅ 🧪 | Count, words, category, and annual JSON assertions pass; multi-pattern `includePaths` union covered |
| 404/error route | ✅ 🧪 ⚠️ | Missing/permalink-source routes return 404 in SSR tests; the complete custom error UI is not asserted |
| Permalink | ✅ 🧪 | Frontmatter `permalink` overrides source path and hides the source route |
| UI app-config override | ✅ 🧪 | Consumer `header.emojiTail` and playground pagination settings verified |
| Component override | ✅ 🧪 ⚠️ | Same-path Badge override verified, with expected Nuxt duplicate-name warning |
| Anti-mirror | ✅ 🧪 | Encoded blacklist/site script injection, disabled branch, and a real-browser navigation case from a mirror-like hostname to the canonical host verified |
| Twikoo | ✅ 🧪 ⚠️ | Enabled container/preload and disabled text/no-container branches verified; remote Twikoo initialization/UI is not tested |
| Head scripts/integrations | ✅ ⚠️ | Build-time injection implemented; current automated fixtures use an empty script list, and the full historical differential site is not a current CI gate |
| Widgets | ✅ ⚠️ | Stats/tech/log widgets render in covered page shells; widget registry combinations and changelog content are not systematically asserted |
| Preview page | ✅ ⚠️ | Route exists and generates; no preview article fixture currently exercises the hidden list |
| Responsive layout | ✅ ⚠️ | Implemented upstream UI; no viewport/drawer test automation |

## 9. Testing

| Command / check | What it actually verifies | Current result |
| --- | --- | --- |
| `pnpm lint` | ESLint across repository sources plus Stylelint for Theme/Playground Vue and SCSS | ✅ Pass |
| `pnpm typecheck` | Playground `nuxt typecheck`, including Layer type generation and consumer-style app config types | ✅ Pass, with expected `NUXT_B3011` Badge warning |
| `pnpm verify` | Static purity: forbidden upstream author/site identifiers, site files, and cross-project imports | ✅ Pass |
| `pnpm test:sync` | 13 temporary-Git tests for sync fast-forward, conflicts, deletes, new files, transform/manual exclusion, unknown blocking, verify failure, and rollback | ✅ 13/13 |
| `pnpm test:migration` | Static Migration Skill contract plus fake blog-v3 fixture checks for discovery, schema mapping, UI boundary, Twikoo/feed/stats, redirects, patches, custom overrides, and protected assets | ✅ 10/10 |
| `pnpm test:contract` | 41 contract rows and required feature/coverage references stay synchronized with generated `docs/COMPATIBILITY.md` | ✅ Pass |
| `pnpm peers check` | Workspace peer dependency audit | ✅ No issues |
| `pnpm generate` | Playground static generation through workspace Layer link | ✅ Pass; Nitro prerenders 51 routes; one expected link-checker warning |
| `pnpm test:consumer` | Pack, tarball boundary/leak audit, export/type declaration graph, independent install, pure Node smoke, typecheck, three generate variants, client-config boundary assertions, and a features-off runtime 404 server check | ✅ Pass |
| `pnpm test:compatibility` | Contract, production build log scan, 24 SSR cases, 12 real-browser cases, 11 dev hydration routes, and the anti-mirror real-navigation dev case | ✅ Pass; 52 assertion groups |
| `pnpm sync:check` | Remote upstream head versus manifest baseline | ✅ Up to date |
| `pnpm release:check` | package.json/tag/CHANGELOG contract, exports/files integrity, pack success, and tarball boundary audit | ✅ Pass locally with `--allow-untagged`; exact-tag enforcement runs in `publish.yml` |
| `pnpm test:registry-consumer` | Release-only: install the published version from the npm registry (no local tarball), exports smoke, typecheck, generate, and output assertions | ❌ Not yet run against `0.1.2`: run it after publication; the out-of-band `0.1.0` fails typecheck inside the published package, and the gated `0.1.2` must pass |
| `pnpm test:release` | Verify + real consumer + compatibility | Script exists; current local run executed its component commands with the broader CI set above |

Current consumer variant facts:

- Tarball: 151 files; 30 required files; five export entries.
- Runtime contract derived from the current script: 100 assertion invocations plus 15 pure-Node smoke checks.
- `default`: 42 prerendered routes.
- `branches` (`enableStyle=false`, `hidePostPrefix=false`, Twikoo, anti-mirror, multi-pattern stats): 42 prerendered routes.
- `features-off` (Atom/OPML/stats off): 39 prerendered routes plus runtime 404 assertions through `nuxt build` and a real server.

Compatibility warnings are non-fatal and are listed under Known Limitations.

## 10. CI

### `ci.yml`

- Triggers: push/PR to `main` or `master`, plus manual dispatch.
- Concurrency cancels older runs for the same reference.
- Permissions: `contents: read`.
- Versions derive from package metadata, not hand-written workflow values.
- Node matrix is resolved from fixed engine branches: 22.19 and 24.11. The open `>=26` branch is not represented because no stable fixed branch is declared.
- pnpm is installed by `pnpm/action-setup` reading `packageManager`.

Stages are strictly ordered:

1. **Layer 1 lint** on the Node matrix.
2. **Layer 1 typecheck + verify + sync regression + migration fixture + compatibility contract + peers** on the Node matrix.
3. **Layer 2 playground generate** on primary Node 24.11.
4. **Layer 3 real consumer test + compatibility regression** on primary Node 24.11.

### `sync.yml`

- Scheduled every Monday at 03:00 UTC, plus manual dispatch.
- Permissions: `contents: read`, `issues: write`.
- Runs `pnpm sync:check --fail-on-update` without installing dependencies.
- On drift, creates/reuses one `sync` Issue with `sync:diff` details and fails with a clear message.
- Never applies, commits, or pushes changes.

### `publish.yml`

- Triggers only on `release: published` (human-confirmed GitHub Release); no push-to-branch publishing.
- Permissions: `contents: read`, `id-token: write`; no `NPM_TOKEN` is stored.
- Checks out the release tag, verifies tag = `v${package.json version}`, resolves Node/pnpm from package metadata.
- Reruns the complete ordered suite serially, then `pnpm release:check`.
- Packs `artifacts/clarity-theme-<version>.tgz`, audits it, records the SHA-256 checksum, dry-runs `npm publish`, and publishes that exact tarball with `--provenance` over OIDC.

## 11. Upstream Sync

The sync manifest divides paths into `include`, `exclude`, `transform`, and `manual`; unclassified changes block apply. `apply` only fast-forwards unmodified include files, detects adapted-file conflicts, runs purity verification transactionally, and advances the baseline only after success. Transform/manual files are reported but never overwritten.

Important boundary fact: several upstream-derived paths (`app/stores/**`, `app/types/**`, `app/utils/**`) are not explicitly classified; two type files have already been adapted by Theme. Future upstream changes there will be treated as unknown and block apply. This is recorded as a manifest/documentation gap, not changed in this documentation-only task.

Details: [UPSTREAM](./UPSTREAM.md).

## 12. Patch Strategy

Clarity Theme itself carries no patches. Package-manager patches are workspace/install-root state and do not transit with an npm package; they are also site-specific compatibility decisions.

Current nuanced conclusions:

- Migrating the upstream blog content currently needs the detab-only `@nuxtjs/mdc` consumer patch; the old inline-code hunk was removed because Theme supports both slot and `code` prop input.
- Current upstream-content image props need the `@nuxt/image` fractional-density consumer patch.
- `plain-shiki` is a short-term consumer patch; the prior audit identified a possible Theme-side selector configuration as future work.
- `ipx` ICO passthrough is optional and only needed when an ICO is actually routed through IPX; it is not a default Theme requirement.
- An additional `@vue/shared` patch file exists in the upstream/differential working copies but is not registered and does not activate.

Details: [PATCHES](./PATCHES.md).

## 13. Verified Capabilities

Current automated evidence verifies:

- Package boundary and absence of known upstream private data
- All five package exports in Node and TypeScript
- Real independent consumer installation from a tarball
- Three configuration variants and their generated routes/files
- Core Markdown/MDC/code/math/diagram/music/image rendering
- Production SSR, real-browser rendering, and dev hydration
- Search, theme toggle, pagination, archive, TOC, SEO, robots, sitemap, LLMs, Atom, OPML, stats, permalink, 404, anti-mirror injection, Twikoo branches, UI override, and component override at the stated contract depth
- Upstream sync tool regression and current baseline freshness

The full generated feature matrix is [COMPATIBILITY](./COMPATIBILITY.md).

## 14. Known Limitations

1. **Server/client configuration boundary is now enforced but the email visibility option is undecided.** Feed/stats/feature flags/build-only article fields and `site.author.email` are excluded from client appConfig and served through Nitro private runtime config. `site.author.email` remains intentionally public metadata (HTML `author` meta plus Atom/OPML output) pending the separate visibility decision.
2. **Feature-off semantics are uniform.** Disabled Atom/OPML/stats routes are absent from static output and return 404 from dev/SSR runtime, verified against a real built server.
3. **Anti-mirror navigation is verified.** The script derives the canonical host from `site.url`, and a real-browser case navigates from a mirror-like hostname back to the canonical host.
4. **Multi-pattern stats are verified as a union.** `@nuxt/content` 3.16 joins conditions inside one `orWhere` group with `OR`; the earlier conjunctive-behavior claim was stale. A two-pattern consumer regression locks the behavior.
5. **Regional CDN defaults are fixed.** KaTeX, Inter, and Google font links point to China-oriented mirror domains without a consumer override.
6. **Automated Theme tests run unpatched.** This is the correct default environment, but tab preservation, fractional image density, and exact plain-Shiki scope therefore differ from the patched real blog environment.
7. **Differential consumer is not current or automated.** It is outside Git, points at an older local tarball, and its persisted output predates current HEAD.
8. **Remote service behavior is not fully tested.** Twikoo initialization, ABC audio, search keyboard behavior, and image service failures are not asserted.
9. **Several UI interactions lack tests.** Archive controls, code collapse/copy interactions, widget combinations, preview entry, responsive drawers/masks, and custom error UI are not systematically covered. This does not by itself mean those features are unimplemented.
10. **Random permalink generation is out of scope by design.** The no-op `article.useRandomPermalink` field was removed before `0.1.0`; generation belongs to consumer build scaffolding, and `permalink` frontmatter remains the supported custom-route mechanism.
11. **Same-path component override emits `NUXT_B3011`.** Functionality is verified, but the warning remains.
12. **Compatibility has non-fatal warning classes.** Vue slot/readonly warnings, empty/undersized og:image, deprecated `twitter:card`, and external-resource warnings occur in dev/browser logs.
13. **Shiki depends on remote esm.sh imports.** Restricted/offline builds may be affected.
14. **Node 26+ is allowed but not CI-tested.** The engine's open range has no stable matrix representative.

## 15. Technical Debt

The debt register is now maintained in [ROADMAP](./ROADMAP.md). Current headline items are:

- **P0:** all resolved in this working tree (server/client configuration split, feature route guards, anti-mirror navigation verification/correction, and no-op permalink contract removal).
- **P1:** multi-pattern stats verified and regression-tested; release workflow implemented (actual publish pending). Deferred: configurable asset origins, sync-manifest classification, TS/MJS parity checking, and `plain-shiki` patch reduction.
- **P2:** incremental interaction/accessibility/responsive/service-failure coverage, warning reduction, offline Shiki support, author-email visibility, purity generalization, and harness maintainability.

The former repeated bullet list duplicated these items across limitations and future work; use the roadmap IDs rather than creating parallel trackers.

## 16. Documentation Gaps

Resolved by this document set:

- There was no single current status, architecture, API, or upstream workflow entry point.
- README mixed current facts with completed phase TODOs and one-off historical results.
- Patch summary described `ipx` as generally required although the detailed audit found it optional.

Still open:

- `docs/COMPATIBILITY.md` is generated and intentionally contract-focused; it does not explain visual quality or uncovered interactions.
- Historical audit files remain in their original paths because `verify-theme.mjs` has a path-specific allowlist; they are now marked non-authoritative rather than moved when movement would break verification.
- The exact upstream Git URL is intentionally referenced through `sync-manifest.json` in non-README docs to avoid reintroducing upstream identity strings outside the current purity allowlist.
- Field-level configuration documentation does not enumerate every internal component prop because those props are not stable public API.
- Runtime validation errors still point some readers to the historical config audit rather than the current field-level configuration document; correct this when the config boundary work touches those files.

## 17. Future Work

Future implementation is ordered by [ROADMAP](./ROADMAP.md):

1. **Milestone 1 — Core boundary and correctness hardening:** ✅ complete.
2. **Milestone 2 — Compatibility and quality refinement:** asset origins, sync classification, dual-track parity, and `plain-shiki` strategy.
3. **Milestone 3 — Release-candidate hardening:** ✅ complete (pipeline implemented; exact-tag run happens in the publish workflow).
4. **Milestone 4 — Release and maintenance:** first npm release (manual gates pending) and incremental post-release coverage.

The old phase-based TODO lists are no longer the active planning track.

## 18. Non-goals / Not Planned

- Clarity Theme will not bundle articles, author configuration, redirects, deployment configuration, analytics IDs, private tokens, or friend data.
- It will not operate Twikoo, analytics, image proxy, search index, or comment services as a backend.
- It will not carry consumer package-manager patches.
- It will not automatically merge upstream changes.
- It does not currently plan a CMS, database layer, general-purpose i18n framework, or visual regression system.

## 19. Current Milestone

**v0.1.2 release — `src/` layout migration.**

The gated `0.1.1` release is published (2026-09-22T09:45:26Z through the OIDC workflow). Since then the runtime source moved to the standardized `src/` layout with the public exports unchanged; `0.1.2` publishes that tree. What remains before `0.1.2` is on npm: publish the `v0.1.2` GitHub Release and run the post-publish registry verification. Deferred P1/P2 work stays ordered in [ROADMAP](./ROADMAP.md).
