# Architecture

**English** | [简体中文](./ARCHITECTURE.zh-CN.md)

This document describes the current implementation. It is subordinate to source code and tests.

## 1. Theme / Consumer Boundary

```text
clarity-theme (Nuxt Layer package)
├── nuxt.config.ts         Layer capabilities and module integration
└── src/                   Theme runtime source (Layer srcDir)
    ├── modules/           clarity-config consumer config discovery/injection
    ├── assets/ components/ composables/ layouts/ pages/ plugins/ stores/ types/ utils/
    ├── config/            Public config/content/schema API
    ├── img/               Pure image helper export
    ├── remark-plugins/    Content pipeline plugins
    ├── server/            Atom/OPML/stats routes
    ├── shared/            Shared types and utilities
    └── public/            Generic feed style and font assets

consumer blog
├── nuxt.config.ts         extends clarity-theme; deployment/site rules
├── clarity.config.ts      site and feature contract
├── content.config.ts      Theme content factory call
├── content/               articles and pages
├── feeds.ts               optional friend data
└── app/app.config.ts      optional UI override
```

The Theme supplies generic behavior. The consumer supplies all site-specific data and remains responsible for secrets, deployment, redirects, and patches.

## 2. Directory Ownership

| Directory | Responsibility | In package? | Environment | Upstream sync relationship |
| --- | --- | --- | --- | --- |
| `src/assets/` … `src/utils/` | UI, pages, layouts, components, composables, stores, plugins, styles, types, utilities | Yes | Theme runtime | Upstream `app/**` maps here via the sync `pathMap`; several files are adapted and `app/types/**`, `app/stores/**`, and `app/utils/**` are not explicitly classified |
| `src/config/` | Public config/content/schema API and TS/MJS dual tracks | Yes | Build/Consumer API | Theme-derived contract layer; root transform files informed this replacement |
| `src/img/` | Public pure image helper export | Yes | Consumer API | Theme-owned package export wrapping `src/utils/img.ts` types |
| `src/modules/` | `clarity-config` build bridge and anti-mirror client | Yes | Nuxt build | Upstream `modules/**` is `include`, but the upstream anti-mirror module was replaced by the Theme config module |
| `src/remark-plugins/` | Markdown AST transforms | Yes | Content build | Upstream-derived `.ts` plus Theme `.mjs`/`.d.mts` runtime tracks under `include` |
| `src/server/` | Atom, OPML, and stats Nitro handlers | Yes | SSR/static generation | Upstream-derived and adapted; `server/**` is `include` |
| `src/shared/` | Content row types and cross-boundary utilities | Yes | Theme runtime/server | Upstream-derived plus Theme additions; `shared/**` is `include` |
| `src/public/` | Generic Atom XSL/CSS and bundled font | Yes | Static assets | `public/assets/**` and `public/fonts/**` are `include` |
| `skills/` | Agent workflow skill (`migrate-blog-v3-to-clarity`) | No | Agent workflow | Theme-owned; excluded from package |
| `playground/` | Minimal workspace consumer and compatibility fixtures | No | Development | Theme-owned; excluded from package |
| `scripts/` | Verification, consumer/compatibility harnesses, sync tool | No | Development/test | Theme-owned; upstream `scripts/**` is excluded |
| `tests/` | Sync regression suite | No | Test | Theme-owned; not explicitly classified for future upstream paths |
| `docs/` | User and maintenance documentation | No | Development | Theme-owned; not explicitly classified for future upstream paths |

Root package/Layer metadata, workspace configuration, quality configs, CI, license, and the sync manifest have individual package or manifest treatments described in [UPSTREAM](./UPSTREAM.md).

## 3. Layer Model

### Package/Layer root

`clarity-theme` resolves to `nuxt.config.ts`. That config:

- Registers Content, SEO, image, icon, color mode, Pinia, VueUse, Bikariya, LLMs, and the local source-layout/clarity-config modules.
- Uses package-absolute paths for Layer CSS, component directories, icons, modules, and SCSS variables.
- Configures Markdown remark/rehype plugins through `file://` URLs to their `.mjs` runtime implementations.
- Sets runtime build metadata, prerender platform behavior, Vite optimization, image densities/formats, link checker behavior, and disabled OG image generation.

### Build-time module

`src/modules/clarity-source-layout` runs first. It applies `src/`,
`src/modules/`, `src/public/`, `src/server/`, `src/shared/`, and the derived
application directories to the Clarity layer metadata without leaking those
values through c12 into the consumer root config.

`src/modules/clarity-config` runs before `nuxt-llms`. It discovers and validates consumer files, injects aliases and appConfig, derives SEO/head/route rules, and registers Theme Pinia stores and the Shiki fallback.

### Runtime application

`src/` (the Layer `srcDir`) contains the layout, pages, global/content/partial/post/widget/popover components, composables, stores, plugins, styles, and types. Nuxt auto-imports apply within the extended application.

### Server

`src/server/` contains three Nitro routes:

- `GET /atom.xml`
- `GET /subscriptions.opml`
- `GET /api/stats`

They query the Content collection and read site/feed/stats configuration plus feature route flags through Nitro's private runtime config (`useClarityServerConfig()`); disabled features return 404 at runtime.

### Development/test-only surfaces

`playground/`, `scripts/`, `tests/`, `docs/`, and `.github/` are not packaged. They validate the Layer but do not become consumer runtime dependencies.

## 4. Configuration Flow

1. Consumer calls `defineClarityConfig()` in `clarity.config.ts`.
2. The Zod schema fills defaults and rejects unknown/invalid fields immediately.
3. `src/modules/clarity-config` discovers `clarity.config.ts` / `.mjs` / `.js`, loads it with jiti, and parses it a second time before depending on it.
4. The module maps parsed data:
   - `toPublicClarityConfig()` (client subset) plus derived header/footer defaults enter appConfig.
   - `toServerClarityConfig()` enters Nitro private runtime config for server handlers and feature route guards.
   - Site title/URL/language map to `nuxt.options.site`.
   - `article.robotsNotIndex` maps to robots disallow rules.
   - Site domain/title/description map to `nuxt-llms`.
   - Author/favicon/alternate/preconnect/scripts/title template map to head.
   - Theme/consumer/Nuxt/Vue package versions map to public runtime config.
   - Stats/Atom/OPML feature flags map to prerender route rules.
5. A `content:file:afterParse` hook applies frontmatter `permalink` and optional `/posts` prefix removal.
6. Anti-mirror, when configured with a blacklist, is serialized, minified, and injected as an inline head script.

Configuration is strict. `integrations.scripts` is omitted from appConfig and consumed during build; `feed.*`, full `stats.*`, feature route flags, build-only article fields, and `site.author.email` are served through the server-only runtime config and do not enter appConfig.

## 5. App Config Flow

The Theme's `src/app.config.ts` supplies only UI defaults under `clarity`:

- `component`
- `footer`
- `header`
- `link`
- `nav`
- `pagination`
- `themes`

Nuxt merges app config with consumer input above Theme defaults; module-injected site-derived defaults are lower priority. Object branches merge deeply, while arrays replace wholesale. The module warns when a consumer puts site-level keys in `app.config.ts`, because those keys can override values derived from `clarity.config.ts`.

Generated TypeScript templates augment both input and read sides of `CustomAppConfig`, so consumer overrides receive partial UI typing while Theme readers retain the resolved full shape.

## 6. Content Flow

Consumer `content.config.ts` normally contains:

```ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

The factory:

1. Reparses the config through `clarityConfigSchema`.
2. Builds article fields: title, description, dates, categories, tags, type, image, recommendation, references, draft, permalink, and reading time.
3. Uses configured article types for the enum, falling back to `tech` if the record is empty.
4. Defines a single `content` collection with source `**` and page type.
5. Extends the schema with sitemap URL/lastmod metadata.

Markdown processing is configured by the Layer:

- `remark-code-component` converts configured `mermaid` and `music-abc` fenced blocks to component props.
- `remark-math` plus `rehype-katex` render formulas.
- `remark-reading-time` populates reading metadata.
- `rehype-meta-slots` extracts `meta-*` elements into reusable slot trees.
- Shiki highlighting is intentionally disabled at Content build; Theme Prose components perform runtime highlighting.

## 7. Feed Flow

### Atom

`src/server/routes/atom.xml.get.ts` queries Content rows under `posts/%`, orders by updated date, limits according to `feed.limit`, builds absolute URLs from `site.url`, and emits Atom XML. `feed.enableStyle` controls the XSLT declaration.

### Friend data

The module aliases `#clarity/feeds` to the consumer's `feeds.ts` / `.mjs` / `.js`, or to the Theme's empty fallback. The friend page reads that module through the alias.

### OPML

`src/server/routes/subscriptions.opml.get.ts` combines the site's own feed entry with flattened friend entries that have a feed URL and emits OPML 2.0.

## 8. Server Route / Client Boundary

- Article/list/archive/page rendering occurs in Vue SSR/client code.
- Atom, OPML, and stats are Nitro handlers using `@nuxt/content/server`.
- Stats queries Content directly and is prerendered as JSON.
- Public runtime config exposes build environment and package versions.
- Real secrets must remain in consumer `runtimeConfig`; appConfig and `clarity.config.ts` are not secret stores.

Server handlers no longer read feed/stats configuration through appConfig, so those fields stay out of the client payload. `site.author.email` remains intentionally public metadata (HTML `author` meta plus feed output) until the separate visibility decision.

## 9. Injection Aliases

| Alias | Points to | Stability |
| --- | --- | --- |
| `#clarity/feeds` | Consumer feeds module or Theme empty fallback | Supported injection contract for Layer/server code |
| `#clarity/config` | Consumer clarity config module path | Internal build alias / potential server-safe config source; not a stable standalone public export |
| `~/shiki.config` | Consumer file when present; otherwise Theme `src/shiki.config.ts` | Supported fallback mechanism |

The aliases prevent Theme code from assuming consumer directory layout.

## 10. Component Override Mechanism

A consumer may place a component at the same Layer-relative path, such as `app/components/content/Badge.vue`. Consumer components take precedence over Layer components. This is verified by the playground and tarball consumer Badge override.

The current duplicate path intentionally emits Nuxt warning `NUXT_B3011`; it is warning noise rather than an override failure. Component names, internal props, and visual markup are not a stable public API unless documented as part of a feature contract. The stable contract is the override behavior and rendered feature output.

## 11. Package Exports and Runtime Dual Tracks

`package.json` exposes the Layer root plus four helper subpaths. Node-loaded configuration, schema, content, image, and remark plugin code uses `.mjs` runtime implementations because native TypeScript stripping cannot be relied upon for files inside `node_modules`. `.d.mts` files re-export TypeScript type sources.

This means several contracts intentionally have paired implementations:

- `src/config/schema.ts` and `src/config/schema.mjs`
- `src/config/define.ts` and `src/config/define.mjs`
- `src/config/content.ts` and `src/config/content.mjs`
- `src/img/index.ts` and `src/img/index.mjs`
- each remark plugin's `.ts` type source and `.mjs` runtime

They must remain behaviorally synchronized.

## 12. Build / Runtime / Consumer Relationship

- **Build time:** config parsing/validation, appConfig injection, aliases, route rules, SEO wiring, head scripts, Content schema generation, and static prerendering.
- **SSR runtime:** Vue pages/components, Content payload rendering, Nitro feed/stats handlers.
- **Client runtime:** hydration, Shiki/Mermaid/ABC rendering, search, color mode, modals/lightboxes, Twikoo mount, and interactive components.
- **Consumer install:** npm/Git package resolution brings the declared dependencies and Layer files; playground workspace behavior is not required in consumer projects.

Static generation currently prerenders the playground's Content pages, raw content/payload endpoints, feed/server outputs, favicon redirect output, sitemap support files, and fallback documents.

## 13. Upstream Sync Boundary

The current Layer is derived from an upstream blog but is not a git subtree or submodule. `sync-manifest.json` records a commit baseline and path categories. Only unmodified `include` paths can be fast-forwarded. Most current UI/server files have already been adapted and will produce conflicts if upstream changes them. Transform/manual files always require human review.

See [UPSTREAM](./UPSTREAM.md).
