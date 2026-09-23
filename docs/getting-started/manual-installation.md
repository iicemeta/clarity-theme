# Manual Installation

**English** | [简体中文](./manual-installation.zh-CN.md)

Use this path when you add Clarity to an existing Nuxt project rather than migrating a blog-v3 site (see [migration from blog-v3](./migration-from-blog-v3.md) for that workflow) or scaffolding with the [creator CLI](./new-project.md).

## 1. Install the package

```bash
pnpm add clarity-theme
```

Clarity is part of your application runtime — the Nuxt build and static generation load the Layer directly — so install it as a regular dependency rather than a development dependency.

For unreleased commits, local debugging, or reviewing a specific change before it is published, install from GitHub instead:

```bash
pnpm add github:iicemeta/clarity-theme#<commit>
```

This path is intended for development only. Released sites should consume the published npm version so installs are reproducible and covered by the release verification matrix.

## 2. Extend the Layer

```ts
// nuxt.config.ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
})
```

Keep your own `routeRules`, redirects, `runtimeConfig`, custom modules, plugins, and deployment settings in this file. The Layer already provides its modules, Markdown pipeline, styles, color mode, SEO defaults, and feature route rules; duplicating them produces unstable merges.

## 3. Define site configuration

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

`site.title`, `site.description`, `site.url`, and `site.author.name` are required. Article, feed, stats, integration, feature, and changelog groups are optional and receive documented defaults — see [configuration](../guides/configuration.md).

If your config lives elsewhere, point the module at it:

```ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
	clarityConfig: { configFile: 'config/clarity.config.ts' },
})
```

## 4. Create the Content schema

```ts
// content.config.ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

Place articles under `content/posts/` and other Content pages under `content/`. See [content](../guides/content.md) for the article schema and permalink behavior.

## 5. Optionally provide friend data

```ts
// feeds.ts
import type { FeedGroup } from 'clarity-theme/config'

const feeds: FeedGroup[] = []

export default feeds
```

Without this file, the friend page and OPML output use empty data and the build logs a warning.

## 6. Develop and deploy

```bash
pnpm dev
pnpm generate
```

Configuration responsibilities at a glance:

| File | Responsibility |
| --- | --- |
| `clarity.config.ts` | Site identity, article semantics, feeds, stats, integrations, feature flags, changelog |
| `app/app.config.ts` | Optional reactive UI overrides only |
| `content.config.ts` | Nuxt Content collection/schema |
| `feeds.ts` | Optional friend data |
| consumer `runtimeConfig` | Environment-specific values and the only valid place for secrets |

Never place tokens or private deployment credentials in `clarity.config.ts` or `app/app.config.ts`; both can affect generated client output.