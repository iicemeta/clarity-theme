# Clarity Theme

Clarity Theme is a reusable **Nuxt 4 Layer blog theme** extracted from [L33Z22L11/blog-v3](https://github.com/L33Z22L11/blog-v3). It provides the generic blog UI, page structure, Markdown/MDC rendering, SEO integration, and feed/server outputs; your project provides all site data and content.

## Features

- Nuxt 4 Layer installation through one `extends` entry
- Validated site configuration with defaults and strict unknown-field rejection
- Nuxt Content collection factory for article metadata and sitemap data
- Markdown, MDC components, Shiki code highlighting, KaTeX, Mermaid, ABC music scores, and rich images
- Article list, archive, pagination, TOC, search, theme toggle, widgets, preview, and 404 routing
- Atom, OPML, statistics, robots, sitemap, and LLMs outputs
- Twikoo, head scripts, and anti-mirror integrations driven by consumer configuration
- UI defaults, app config overrides, custom Shiki themes, and same-path component overrides
- Automated workspace, tarball-consumer, SSR, browser, hydration, purity, contract, peer, and upstream-sync checks

## Requirements

| Runtime | Version |
| --- | --- |
| Node.js | `^22.19 \|\| ^24.11 \|\| >=26` |
| pnpm | 12.4.1 or a compatible package manager for your project |
| Nuxt peer | `^4.5.2` |
| Vue peer | `^3.5.42` |

The package is not currently available from the npm registry. Install it as a Git dependency pinned to a commit until a first package release is published.

## Installation

```bash
pnpm add -D github:iicemeta/clarity-theme#<commit>
```

## Quick Start

### 1. Extend the Layer

```ts
// nuxt.config.ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
})
```

### 2. Define site configuration

```ts
// clarity.config.ts
import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: 'My Blog',
		description: 'Notes about technology and life',
		url: 'https://example.com/',
		author: {
			name: 'My Name',
			avatar: '/avatar.webp',
		},
	},
})
```

`site.title`, `site.description`, `site.url`, and `site.author.name` are required. Article, feed, stats, integration, feature, and changelog groups are optional and receive documented defaults.

### 3. Create the Content schema

```ts
// content.config.ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

Place articles under `content/posts/` and other Content pages under `content/`.

### 4. Optionally provide friend data

```ts
// feeds.ts
import type { FeedGroup } from 'clarity-theme/config'

export default [] satisfies FeedGroup[]
```

Without this file, the friend page and OPML output use empty data and the build logs a warning.

### 5. Generate or develop

```bash
pnpm dev
pnpm generate
```

## Basic Configuration

| File | Responsibility |
| --- | --- |
| `clarity.config.ts` | Site identity, article semantics, feeds, stats, integrations, feature flags, changelog |
| `app/app.config.ts` | Optional reactive UI overrides only |
| `content.config.ts` | Nuxt Content collection/schema |
| `feeds.ts` | Optional friend data |
| consumer `runtimeConfig` | Environment-specific values and the only valid place for secrets |

Example optional groups:

```ts
export default defineClarityConfig({
	site: {
		title: 'My Blog',
		description: 'A Nuxt blog',
		url: 'https://example.com/',
		author: { name: 'My Name' },
	},
	article: {
		defaultCategory: 'Uncategorized',
		categories: {
			Tech: { icon: 'tabler:code', color: '#7777ff' },
		},
		types: { tech: {}, story: {} },
	},
	feed: { limit: 50, enableStyle: true },
	features: {
		atom: true,
		opml: true,
		stats: true,
		antiMirror: false,
	},
})
```

Never place tokens or private deployment credentials in `clarity.config.ts` or `app/app.config.ts`; both can affect generated client output.

## Public API

| Entry | API |
| --- | --- |
| `clarity-theme` | Nuxt Layer root |
| `clarity-theme/config` | `defineClarityConfig()` and configuration/schema types |
| `clarity-theme/content` | `createClarityContentConfig()` and `ArticleSchema` |
| `clarity-theme/schema` | All `clarity*` Zod schemas and derived types |
| `clarity-theme/img` | Avatar/favicon/image URL helpers |

The Layer also exposes the `useClarityConfig()`, `useClaritySite()`, `useClarityArticle()`, and `useClaritySiteFeedEntry()` runtime auto-imports, plus the `#clarity/feeds` injection. They are Layer contracts rather than standalone package subpaths.

The exact export/type boundary is documented in [docs/API.md](./docs/API.md).

## Customization

### UI configuration

```ts
// app/app.config.ts
export default defineAppConfig({
	clarity: {
		header: { emojiTail: ['📝'] },
		pagination: { perPage: 10 },
		nav: [
			{
				title: '',
				items: [
					{ icon: 'tabler:files', text: 'Articles', url: '/' },
					{ icon: 'tabler:link', text: 'Friends', url: '/link' },
					{ icon: 'tabler:archive', text: 'Archive', url: '/archive' },
				],
			},
		],
	},
})
```

Objects merge deeply; arrays replace the Theme value entirely.

### Components

Create a Layer-relative component at the same path to replace it, for example:

```text
app/components/content/Badge.vue
```

Consumer components take precedence over Layer components. Nuxt currently emits a duplicate-name warning for this intentional override pattern.

### Shiki themes

Provide `app/shiki.config.ts` in the consumer project. The Theme fallback is used only when this file does not exist.

## Compatibility and Verification

Current verification covers:

- Playground static generation
- Independent `pnpm pack` consumer installation
- Five package exports in Node and TypeScript
- Three configuration branches
- Markdown/MDC/code/math/Mermaid/music/image rendering
- Production SSR, real browser rendering, and dev hydration
- Search, pagination, archive, TOC, SEO, robots, sitemap, LLMs, Atom, OPML, stats, permalink, 404, Twikoo branches, anti-mirror injection, UI override, and component override
- Theme purity, peer dependencies, sync tooling, and upstream drift

The generated release matrix lives in [docs/COMPATIBILITY.md](./docs/COMPATIBILITY.md). Current exact counts, known limitations, technical debt, and future work live in [docs/PROJECT-STATUS.md](./docs/PROJECT-STATUS.md).

Site-specific dependency patches are intentionally owned by consumers; see [docs/PATCHES.md](./docs/PATCHES.md).

## Documentation

| Document | Purpose |
| --- | --- |
| [Project status](./docs/PROJECT-STATUS.md) | Current snapshot, verified capabilities, limitations, debt, gaps, and milestone |
| [Architecture](./docs/ARCHITECTURE.md) | Theme/consumer boundary and build/runtime data flows |
| [API](./docs/API.md) | Public package/Layer API versus internal implementation |
| [Configuration](./docs/configuration.md) | Field-level config contract and visibility |
| [Compatibility](./docs/COMPATIBILITY.md) | Generated release compatibility matrix |
| [Upstream sync](./docs/UPSTREAM.md) | Baseline, manifest, commands, conflicts, and workflow |
| [Patches](./docs/PATCHES.md) | Consumer patch ownership and current conclusions |
| [Extraction history](./docs/history/2026-09-layer-extraction.md) | Historical phases and one-time differential validation |

## Development

```bash
pnpm install              # Theme + playground workspace
pnpm dev                  # Playground dev server
pnpm generate             # Playground static generation
pnpm lint
pnpm typecheck
pnpm verify               # Purity/static leak checks
pnpm peers check
pnpm test:sync
pnpm test:contract
pnpm test:consumer
pnpm test:compatibility
```

CI derives Node and pnpm versions from package metadata. It runs lint/typecheck/verify/sync/contract/peers on the fixed Node matrix, then playground generate, real consumer acceptance, and rendering compatibility on the primary Node version. A separate weekly workflow only detects and reports upstream drift.

See [Project status → CI](./docs/PROJECT-STATUS.md#10-ci) for the exact CI stages and permissions.

## Current Status

Clarity Theme is a **v0.1.0 pre-publish, release-candidate-quality Layer**. At the current snapshot, all repository-defined verification paths pass; upstream is unchanged; the package boundary is verified from a real tarball. Remaining limitations—especially server-config visibility, fixed CDN origins, unpatched test behavior, incomplete interaction coverage, and the manual differential site—are explicitly recorded rather than treated as completed work.

## License

Theme code is MIT. The upstream blog's articles are not included in this package.
