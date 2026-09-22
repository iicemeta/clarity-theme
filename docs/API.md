# Public API

**English** | [简体中文](./API.zh-CN.md)

This document separates stable package/Layer contracts from internal implementation. Source code and consumer tests override prose when they disagree.

## API Stability Model

### Public package API

Entries explicitly declared by `package.json` `exports`. They are intended to follow semantic versioning.

### Public Layer contract

Behavior obtained by `extends: ['clarity-theme']`, documented config files, supported aliases, HTTP routes, and the documented component-override mechanism. These do not necessarily have an independent ESM subpath.

### Internal implementation

Components' private props, ordinary composables, utilities, module internals, generated templates, and source layout. These may change without a major version unless a documented feature contract depends on them.

## Package Exports

| Import | Conditions | Runtime/type target | Public exports |
| --- | --- | --- | --- |
| `clarity-theme` | default | `./nuxt.config.ts` | Nuxt Layer root configuration |
| `clarity-theme/config` | types / default | `config/index.d.mts` / `config/index.mjs` | `defineClarityConfig`, all Zod schemas listed below, and configuration types |
| `clarity-theme/content` | types / default | `config/content.d.mts` / `config/content.mjs` | `createClarityContentConfig`, `ArticleSchema` type |
| `clarity-theme/img` | types / default | `img/index.d.mts` / `img/index.mjs` | Image/avatar/favicon helpers and enums/constants |
| `clarity-theme/schema` | types / default | `config/schema.d.mts` / `config/schema.mjs` | All `clarity*` Zod schemas and schema-derived types |

The root export is a Nuxt Layer entry, not a general JavaScript utility module.

## `clarity-theme/config`

### Runtime function

```ts
function defineClarityConfig(config: ClarityConfigInput): ClarityConfig
```

It parses immediately, applies defaults, and throws a field-path-bearing error for invalid or unknown fields.

### Types

Through the TypeScript entry:

- `ClarityConfig`
- `ClarityConfigInput`
- `ClarityUiConfig`
- `ClarityUiConfigInput`
- `ClarityAppConfig`
- `ClarityPublicConfig`
- `ClarityPublicIntegrationsConfig`
- `FeedEntry`
- `FeedGroup`
- `Arch`
- `Nav`
- `NavItem`
- `NavGroup`
- All schema-derived types listed under `clarity-theme/schema`

The `.mjs` entry intentionally exports runtime values only; type-only names disappear at runtime as normal.

## `clarity-theme/schema`

### Runtime schemas

- `clarityConfigSchema`
- `claritySiteSchema`
- `clarityArticleSchema`
- `clarityFeedSchema`
- `clarityStatsSchema`
- `clarityIntegrationsSchema`
- `clarityFeaturesSchema`
- `clarityAntiMirrorSchema`
- `clarityAuthorSchema`
- `clarityChangelogEntrySchema`
- `clarityHeadScriptSchema`

### Types

- `ClarityConfig`
- `ClarityConfigInput`
- `ClaritySiteConfig`
- `ClarityArticleConfig`
- `ClarityFeedConfig`
- `ClarityStatsConfig`
- `ClarityIntegrationsConfig`
- `ClarityFeaturesConfig`
- `ClarityAntiMirrorConfig`
- `ClarityAuthor`
- `ClarityChangelogEntry`
- `ClarityHeadScript`

Schemas use strict objects except `article.types` values, which remain a layout-extension record.

## `clarity-theme/content`

```ts
function createClarityContentConfig(config: ClarityConfig): ReturnType<typeof defineContentConfig>
```

It reparses the supplied config and creates the `content` collection with article and sitemap schemas. Pure Node smoke can verify import/function shape only because full schema creation depends on the Nuxt Content module context; real generation is covered by consumer tests.

`ArticleSchema` describes:

- `title`, `description`
- `date`, `updated`, `published`
- `categories`, `tags`, `type`
- `image`, `recommend`
- `references`
- `draft`, `permalink`
- `readingTime`

Default values for categories/tags/type/draft come from the parsed config and Content schema.

## `clarity-theme/img`

### Functions

| Export | Purpose |
| --- | --- |
| `getWsrvGhAvatar(name, options?)` | GitHub avatar URL through wsrv |
| `getGithubAvatar(name, options?)` | GitHub avatar URL through the webp.se service |
| `getGithubIcon(name)` | Circular small GitHub icon URL |
| `getOicqAvatar(qq, size?)` | QQ avatar URL |
| `getOciqGroupAvatar(group, size?)` | QQ group avatar URL |
| `getFavicon(domain, options?)` | Google/static or webp.se favicon URL |
| `getImgUrl(src, service?)` | Prefix a source with a configured image proxy or return it unchanged |

### Constants and types

- `OicqAvatarSize`
- `QgroupAvatarSize`
- `ImgService`

These helpers build URLs and do not fetch, cache, transform, or proxy images themselves. They depend on third-party public services and have no fallback transport.

## Layer Runtime API

The following auto-imported helpers are supported because consumer components may read Theme configuration:

| Helper | Returns |
| --- | --- |
| `useClarityConfig()` | Resolved public site configuration plus UI configuration |
| `useClaritySite()` | Site section |
| `useClarityArticle()` | Article configuration section |
| `useClaritySiteFeedEntry()` | Feed entry derived from site configuration |

They require a Nuxt app context and are not standalone package subpath exports.

## Public HTTP Features

When enabled, the Layer exposes these static/server outputs:

| Route | Output |
| --- | --- |
| `GET /atom.xml` | Atom feed |
| `GET /subscriptions.opml` | OPML subscriptions |
| `GET /api/stats` | Article count, word count, annual/category/tag statistics |

Generated SEO outputs also include `/robots.txt`, `/sitemap.xml`, and `/llms.txt` through configured Nuxt modules. Feature flags remove prerender/head wiring; runtime route disabling is not yet guaranteed.

## Configuration Entry Points

### Consumer files

- `clarity.config.ts` — public site/feature contract
- `app/app.config.ts` — optional UI override
- `content.config.ts` — Content factory call
- `feeds.ts` — optional friend data

### Module option

```ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
	clarityConfig: {
		configFile: 'clarity.config.ts',
	},
})
```

`configFile` is relative to the consumer root and overrides automatic discovery.

### Supported injection

- `#clarity/feeds` resolves the consumer friend-data module.

### Internal alias

- `#clarity/config` currently resolves the consumer config module for build wiring. It is not a serialized parsed-config service and should not be treated as a stable public import.

## Internal Implementation

The following are intentionally not public ESM APIs:

- `modules/clarity-config` internals, including `toPublicClarityConfig`
- ordinary `app/composables/*` other than the clarity accessors above
- `app/stores/*`, internal utility functions, and generated type templates
- individual component props/styles unless covered by a documented rendering contract
- remark plugin instances; Nuxt Layer configuration loads them internally
- `shared/utils/*` helpers except where re-exported by a package entry or consumed through a documented feature

The package includes these source files for Nuxt Layer compilation; inclusion in the tarball does not make every symbol public API.
