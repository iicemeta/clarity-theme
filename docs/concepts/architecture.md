# Architecture

**English** | [简体中文](./architecture.zh-CN.md)

This document describes the current implementation. It is subordinate to source code and tests. One-time audits and phase narratives live in [docs/history](../history/) — historical records, not current specification.

## 0. The Pipeline at a Glance

```text
Upstream blog-v3 (source of truth, pinned by sync-manifest.json)
        ↓  sync / mechanical adaptation
src/  (Layer runtime source; the include surface is frozen)
        ↓  applies Layer layout without leaking it
clarity-source-layout (Nuxt module)
        ↓  discovers consumer config, injects aliases/appConfig/head/SEO
clarity-config (Nuxt module)
        ↓  extends: ['clarity-theme']
consumer blog (clarity.config.ts, content/, feeds.ts, app.config, deployment)
```

The consumer sees one thing: a Layer. Everything between `sync-manifest.json` and the consumer contract exists so that upstream-derived files run unmodified inside that Layer.

## 1. Source Classification

Every file under `src/` belongs to exactly one class. The authoritative registries are `sync-manifest.json` (include/transform/manual), `tests/upstream-parity.manifest.json` (per-file class for the include surface), and `docs/maintainers/transform-parity.md` (the `nuxt.config.ts` transform registry):

| Class | Meaning | Examples |
| --- | --- | --- |
| **SOURCE** | Upstream file, byte-identical after EOL normalization (`identical`) or mechanical import-path adaptation (`mechanical`). Never edited by hand; drift fails `pnpm test:upstream-parity`. | most of `src/components/`, `src/pages/`, `src/composables/`, `src/assets/` |
| **TRANSFORM** | Upstream file that requires human redesign for the Layer form; upstream-side changes must be re-applied by hand and re-registered. | `nuxt.config.ts`, `src/config/*` (replaces upstream `blog.config.ts`/`app.config.ts`), `src/modules/clarity-config`, remark plugin `.mjs` runtimes |
| **CLARITY-ONLY** | File with no upstream counterpart — Layer boundary infrastructure. | `src/modules/clarity-source-layout`, `src/config/ui.ts`, `src/config/public.ts`, `src/img/`, `patches/temporal-spec.patch` |
| **LEGACY** | 0.1.x compatibility surface kept for old consumers, deprecated, scheduled for removal in 0.2.0. See [legacy policy](../maintainers/legacy-policy.md). | `useClarityConfig()` / `useClaritySite()` / `useClarityArticle()` / `useClaritySiteFeedEntry()` (`src/shared/utils/clarity.ts`), the `clarity` app-config key, `article.useRandomPermalink` warn-and-ignore handling |

## 2. Theme / Consumer Boundary

```text
clarity-theme (Nuxt Layer package)
├── nuxt.config.ts         Layer capabilities and module integration (TRANSFORM)
└── src/                   Layer srcDir — SOURCE / TRANSFORM / CLARITY-ONLY / LEGACY mix
    ├── modules/           clarity-source-layout, clarity-config, anti-mirror
    ├── config/            Public config/content/schema API (TS + MJS dual tracks)
    ├── assets/ components/ composables/ layouts/ pages/ plugins/ stores/ types/ utils/
    ├── img/               Pure image helper export
    ├── remark-plugins/    Content pipeline plugins
    ├── server/            Atom/OPML/stats Nitro routes
    ├── shared/            Cross-boundary utilities (incl. LEGACY composables)
    └── public/            Generic feed style and font assets

consumer blog
├── nuxt.config.ts         extends clarity-theme; owns routeRules/redirects/deployment
├── clarity.config.ts      site and feature contract (defineClarityConfig)
├── content.config.ts      createClarityContentConfig(clarityConfig)
├── content/               articles and pages
├── feeds.ts               optional friend data
├── tsconfig.json          root project references (standard Nuxt file; required)
└── app/app.config.ts      optional UI override (upstream-shaped flat keys)
```

The Theme supplies generic behavior. The consumer supplies all site-specific data and remains responsible for secrets, deployment, redirects, and patches.

## 3. Layer Model

### Package/Layer root

`clarity-theme` resolves to `nuxt.config.ts`. That config:

- Registers Content, SEO, image, icon, color mode, Pinia, VueUse, Bikariya, LLMs, and the two local modules below.
- Uses package-absolute paths for Layer CSS, component directories, icons, modules, and SCSS variables.
- Configures Markdown remark/rehype plugins through `file://` URLs to their `.mjs` runtime implementations.
- Sets runtime build metadata, prerender platform behavior (`autoSubfolderIndex` off on CF Pages/GH Actions/Netlify), Vite optimization, image densities/formats, and disabled OG image generation.

### `clarity-source-layout` (runs first)

Applies `src/`, `src/modules/`, `src/public/`, `src/server/`, `src/shared/`, and derived application directories to the Clarity layer metadata **without leaking those values through c12 into the consumer root config**.

### `clarity-config` (runs before `nuxt-llms` and `anti-mirror`)

The consumer-config bridge. In `setup` it:

1. Discovers `clarity.config.ts` / `.mjs` / `.js` and `feeds.ts`, validates the config through the Zod schema (legacy keys warned and ignored — see §6), and parses it a second time before depending on it.
2. Injects aliases (§5) so upstream import specifiers resolve inside the Layer.
3. Maps parsed data into appConfig (flat upstream shape), Nitro private runtimeConfig, `nuxt.options.site`, robots rules, `nuxt-llms`, head meta/link/scripts, and feature-flag route rules.
4. Writes **build-time generated modules** to `<buildDir>/clarity/` (§4) and re-writes them on `build:before` (Nuxt wipes the buildDir after modules run).
5. Registers a Vite `resolveId` contract that redirects the consumer's absolute `<rootDir>/package.json` / `pnpm-workspace.yaml` ids to the generated modules (§5).
6. Registers a `content:file:afterParse` hook (frontmatter `permalink`, optional `/posts` prefix removal).

### Runtime application

`src/` (the Layer `srcDir`) contains the layout, pages, components, composables, stores, plugins, styles, and types. Nuxt auto-imports apply within the extended application. All upstream-derived components read the **flat upstream-shaped app config** through `useAppConfig()` — never the LEGACY `clarity` key.

### Server

`src/server/` contains three Nitro routes — `GET /atom.xml`, `GET /subscriptions.opml`, `GET /api/stats`. They read site/feed/stats configuration plus feature flags through Nitro's private runtime config (`useClarityServerConfig()`); disabled features return 404 at runtime.

## 4. Build-Time Generated Modules

Upstream files read consumer data through `~~/package.json`, `~~/pnpm-workspace.yaml`, and `~~/blog.config`. JSON/YAML cannot be imported by Nitro's prerenderer, and writing generated data inside the installed package would pollute the pnpm store (a hardlink target shared across consumers). Therefore `clarity-config` **generates normalized ES modules** at `<buildDir>/clarity/`:

| Module | Content | Consumers |
| --- | --- | --- |
| `package-json.mjs` | consumer `name` / `version` / `packageManager`, always with a `version` export | `BlogTech.vue` (client bundle) |
| `pnpm-workspace.mjs` | consumer catalogs or Theme fallback | `BlogTech.vue` (client bundle) |
| `blog.config.mjs` | upstream-shaped config derived from `clarity.config.ts` | `anti-mirror` (build-time head script); `~~/blog.config` alias consumers use the `src/blog.config.ts` adapter instead |

Write timing is **idempotent and double**: once in module `setup` (for prepare/dev and jiti-loaded Layer modules), once on `build:before` (after Nuxt cleans the buildDir). The prerenderer inlines these modules (`prerender:config` → `externals.inline`), and TS path mappings point `~~/package.json` / `~~/pnpm-workspace.yaml` type references at declaration templates. A missing consumer `version` degrades to empty display plus a build warning — it never fails the build.

## 5. Injection Aliases and the Prerender Contract

| Alias / id | Resolves to | Notes |
| --- | --- | --- |
| `#clarity/feeds` | Consumer feeds module or Theme empty fallback | friend page + OPML |
| `#clarity/config` | Consumer clarity config module path | internal build alias |
| `~/shiki.config` | Consumer file when present; otherwise Theme fallback | |
| `~~/blog.config` | `src/blog.config.ts` adapter (upstream flat shape derived from `clarity.config.ts`) | App/Nitro context; jiti-loaded Layer modules read the generated `blog.config.mjs` |
| `~~/shared` | Theme `src/shared` when the consumer has no `shared/` | |
| `~/feeds` | Theme feeds fallback when the consumer has no `feeds.ts` | |
| `~~/package.json` / `~~/pnpm-workspace.yaml` | Generated modules at `<buildDir>/clarity/` | exact-specifier aliases |
| *(Vite resolveId contract)* | absolute `<rootDir>/package.json` / `pnpm-workspace.yaml` → generated modules | **why:** in production (bundled) builds the rolldown native alias plugin lets the shorter `~~` → rootDir prefix alias win over the exact aliases, rewriting the import to the consumer's real JSON (a missing `version` key then broke client builds). The redirect contract makes client / nitro / prerender behave identically regardless of alias match order. |

These aliases prevent Theme code from assuming consumer directory layout; upstream files keep their original import specifiers.

## 6. Legacy Surface (0.1.x)

The following exist only for consumers written against the 0.1.0 API. They are **deprecated**, not part of the recommended path, and scheduled for removal in 0.2.0 — see [legacy policy](../maintainers/legacy-policy.md):

- `useClarityConfig()`, `useClaritySite()`, `useClarityArticle()`, `useClaritySiteFeedEntry()` (read the injected `clarity` app-config key).
- The `clarity` key in consumer `app/app.config.ts`.
- `article.useRandomPermalink` in `clarity.config.ts` (accepted with a deprecation warning, ignored; unknown keys outside the legacy registry remain fatal).

The current reading path for components and consumers is the flat upstream-shaped app config via `useAppConfig()`.

## 7. Component Override, Package Exports, Dual Tracks

- Consumers override components by same Layer-relative path (e.g. `app/components/content/Badge.vue`); consumer components take precedence. The duplicate-path `NUXT_B3011` warning is expected noise, not an override failure.
- Package exports: the Layer root plus `./config`, `./content`, `./schema`, `./img`. Node-loaded code ships `.mjs` runtimes beside `.ts` type sources (`schema`, `define`, `content`, `img`, remark plugins); both tracks must stay behaviorally synchronized.

## 8. Prerender / Client / Nitro

- **Prerender:** `nuxt generate` prerenders all page routes plus feed/server outputs, payload endpoints, sitemap support files, and fallback documents; the crawler discovers article routes from `/`. Generated modules are inlined into the prerenderer build (§4). `nitro.prerender.autoSubfolderIndex` is disabled on CF Pages / GH Actions / Netlify (flat `page.html` instead of `page/index.html`).
- **Nitro runtime:** Atom/OPML/stats handlers query Content directly; feature-disabled routes 404 at runtime.
- **Client runtime:** hydration, Shiki/Mermaid/ABC rendering, search, color mode, modals/lightboxes, Twikoo mount. Real secrets stay in consumer `runtimeConfig`; appConfig and `clarity.config.ts` are not secret stores.

## 9. Development/Test-Only Surfaces

`playground/` (workspace consumer), `scripts/` (verification, consumer/compatibility/file-generate/runtime-parity harnesses, sync tool), `tests/` (source parity gate, config regression, transform parity gate, runtime/visual parity harness), `docs/`, `.github/`, and `skills/` are not packaged. `docs/history/` is a frozen record of past audits and repair phases. The Markdown/MDC authoring corpus at `docs/_content/mdc/` is content-creation material for the `article-beautifier` skill, not Theme documentation.

See [Upstream sync](../maintainers/upstream-sync.md), [Transform parity](../maintainers/transform-parity.md), and [Testing](../maintainers/testing.md).
