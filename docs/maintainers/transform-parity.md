# Transform Parity

**English** | [简体中文](./transform-parity.zh-CN.md)

`pnpm test:upstream-parity` only covers the sync-manifest `include` surface (upstream-derived sources under `src/`). `nuxt.config.ts`, `app/app.config.ts`, `content.config.ts`, `package.json`, and `pnpm-workspace.yaml` belong to the manifest `transform` category — upstream changes require manual redesign, and source parity stays green for them no matter what. The DOUYIN font incident (see the CHANGELOG and `docs/history/2026-09-24-repair-phase-1.md`) was exactly this blind spot: upstream added a static font link to `head.link`, the Theme missed it, and every parity gate still passed.

This document is the human-reviewed registry for that surface; `pnpm test:transform-parity` (`tests/transform-parity.test.mjs`) locks the mechanically checkable subset as a gate.

## Statuses

| Status | Meaning |
| --- | --- |
| IDENTICAL | Verbatim (or mechanical path-prefix only) match with upstream; upstream changes sync directly |
| TRANSFORM | The upstream item is redesigned and implemented elsewhere (mostly injected by the `clarity-config` module) |
| DROP | Deliberately not shipped with the Layer; reason recorded here |
| CLARITY-ONLY | Theme / Layer boundary item with no upstream counterpart |

## `nuxt.config.ts` registry

Baseline: manifest commit `f6ea97d` (upstream 3.7.2).

### `app.head`

| Upstream item | Clarity counterpart | Status | Reason |
| --- | --- | --- | --- |
| `meta: author` | injected by `clarity-config` from `site.author` | TRANSFORM | site data comes from clarity.config.ts |
| `meta: color-scheme` | same literal | IDENTICAL | |
| `meta: generator` | `Clarity Theme ${themeVersion}` | TRANSFORM | the Layer identifies itself, not the consumer package |
| `meta: mobile-web-app-capable` | same literal | IDENTICAL | |
| `link: icon (blogConfig.favicon)` | injected by `clarity-config` from `site.favicon` | TRANSFORM | |
| `link: alternate /atom.xml` | injected by `clarity-config` when `features.atom` | TRANSFORM | feature-flag gated |
| `link: preconnect (twikoo.preload)` | injected by `clarity-config` from `integrations.twikoo.preload ?? envId` | TRANSFORM | |
| `link: katex / inter-variable / inter / gstatic preconnect / googleapis / DOUYIN` | same literals | IDENTICAL | static assets must ship verbatim; gate-locked |
| `templateParams.separator` | same literal | IDENTICAL | |
| `titleTemplate` | set by `clarity-config` to `%s %separator ${site.title}` | TRANSFORM | |
| `script: blogConfig.scripts` | injected by `clarity-config` from `integrations.scripts` | TRANSFORM | |
| `rootAttrs id=blog-root` | same literal | IDENTICAL | |

### `modules`

| Upstream module | Clarity counterpart | Status | Reason |
| --- | --- | --- | --- |
| `@bikariya/image-viewer` / `@bikariya/modals` / `@bikariya/shiki` | registered as-is | IDENTICAL | |
| `@nuxt/a11y` | not registered (kept in devDeps) | DROP | alpha-stage module not forced onto consumers |
| `@nuxt/content` | registered as-is | IDENTICAL | |
| `@nuxt/hints` | not registered (kept in devDeps) | DROP | dev-time hints module; consumer opt-in experience |
| `@nuxt/icon` / `@nuxt/image` / `@nuxtjs/color-mode` / `@nuxtjs/seo` | registered as-is | IDENTICAL | |
| `@pinia/nuxt` / `@vueuse/nuxt` | registered as-is | IDENTICAL | |
| `nuxt-llms` | registered as-is (after clarity-config) | IDENTICAL | its setup reads site config injected by clarity-config |
| `unplugin-yaml/nuxt` | `vite.plugins: [Yaml()]` | TRANSFORM | avoids the module injecting unresolvable `compilerOptions.types` into consumers |
| (auto-loaded via upstream modules dir) `anti-mirror` | registered explicitly | CLARITY-ONLY | a Layer's `src/modules` is not auto-loaded |
| — | `clarity-source-layout` | CLARITY-ONLY | applies the `src/` layout to the Layer itself only |
| — | `clarity-config` | CLARITY-ONLY | site config bridge (clarity.config.ts → appConfig / head / SEO) |

### Remaining top-level keys

| Upstream item | Clarity counterpart | Status | Reason |
| --- | --- | --- | --- |
| `components` (Z prefix + dirs) | same structure with `toThemePath` prefixes | TRANSFORM | Layer sources live inside the package |
| `css` (6 scss entries) | same names and order, prefixed paths | TRANSFORM | gate-locked file names and order |
| `experimental` | same literal | IDENTICAL | |
| `nitro.prerender.autoSubfolderIndex` | same literal | IDENTICAL | |
| `routeRules` (redirects.json mapping + feature routes) | feature routes injected by `clarity-config`; redirects mapping belongs to the consumer nuxt.config | TRANSFORM | `redirects.json` is site-owned data (manifest exclude) |
| `runtimeConfig.public` | same literal | IDENTICAL | |
| `typescript` (nodeTsConfig include) | include switched to `../src/**`; additionally excludes `src/server` | TRANSFORM | `src/` layout and the Layer server boundary |
| `vite.css.additionalData` | same content with prefixed `_variable.scss` | TRANSFORM | |
| `vite.define` | absent | DROP | upstream only contains commented-out debug switches |
| `vite.optimizeDeps.include` | same list | IDENTICAL | gate-locked |
| `vite.server.allowedHosts` | same literal | IDENTICAL | |
| `vite.plugins` | `[Yaml()]` | CLARITY-ONLY | see the unplugin-yaml row in the modules table |
| `alias` | set by `clarity-config` (`#clarity/*`, `~~/blog.config`, `~/feeds`, `~~/package.json`, …) | CLARITY-ONLY | dependency injection so upstream-synced files resolve unmodified |
| `colorMode` | same literal | IDENTICAL | |
| `content` (markdown pipeline) | plugin paths point at `src/remark-plugins/*.mjs`, rest identical | TRANSFORM | @nuxt/content loads plugins natively via Node |
| `dxup.namedLayoutSlots` | same literal | IDENTICAL | |
| `hooks: ready` | banner prints the Theme name/version | TRANSFORM | |
| `hooks: content:file:afterParse` | moved into `clarity-config` | TRANSFORM | permalink / hidePostPrefix depend on site config |
| `icon` (zi collection) | prefixed `dir`; clientBundle identical | TRANSFORM | |
| `image` | same literal | IDENTICAL | |
| `linkChecker` | same literal | IDENTICAL | |
| `llms` | domain/title/description injected by `clarity-config` | TRANSFORM | |
| `ogImage.enabled: false` | same literal | IDENTICAL | |
| `robots` (disallow) | injected by `clarity-config` from `article.robotsNotIndex` | TRANSFORM | |
| `site` | injected by `clarity-config` | TRANSFORM | |

### `patches/` (manifest `manual` category)

| Patch | Status | Reason |
| --- | --- | --- |
| `@nuxt__image` / `@nuxtjs__mdc` / `ipx` / `plain-shiki` | IDENTICAL | one-to-one with upstream patchedDependencies |
| `@vue__shared` (file exists upstream but unregistered) | DROP | upstream leftover, never registered |
| `temporal-spec` | CLARITY-ONLY | upstream uses legacy Temporal type names without typecheck; the Theme adds type aliases |

## Remaining transform files (summary)

- `app/app.config.ts` → upstream expands site data here; Clarity's `src/app.config.ts` is a placeholder (parity manifest `boundary`), real injection happens in `clarity-config` (UI defaults + clarity.config.ts + 0.1.x `clarity` key overrides).
- `content.config.ts` → upstream defines collections inline; Clarity ships the `createClarityContentConfig()` factory (`clarity-theme/content`) called from the consumer's `content.config.ts`.
- `package.json` → upstream is an application package; Clarity is a publishable Layer package (exports / files / peerDeps).
- `pnpm-workspace.yaml` → upstream catalogs organized for a monorepo; Clarity keeps the single-package subset and registers its patches.

## Gate and maintenance

- `pnpm test:transform-parity`: mechanically compares `head.link` (literal entries ship verbatim; TRANSFORM/CLARITY-ONLY registration), `css` (same names, same order), `modules` (DROP/CLARITY-ONLY registration), and `vite.optimizeDeps.include` (same list). When an upstream baseline change breaks an assertion, update this registry first, then the registered sets inside the test.
- A new upstream `head.link` / `modules` / `css` entry → either sync it into the Layer or record its DROP/TRANSFORM reason here. Silent omission is not an option.
