# Clarity Theme

[![CI](https://github.com/iicemeta/clarity-theme/actions/workflows/ci.yml/badge.svg)](https://github.com/iicemeta/clarity-theme/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/clarity-theme)](https://www.npmjs.com/package/clarity-theme)
[![License: MIT](https://img.shields.io/npm/l/clarity-theme)](./LICENSE)

**English** | [简体中文](./README.zh-CN.md)

Clarity Theme is a reusable **Nuxt 4 Layer blog theme** extracted from [L33Z22L11/blog-v3](https://github.com/L33Z22L11/blog-v3). It provides the generic blog UI, page structure, Markdown/MDC rendering, SEO integration, and feed/server outputs; your project provides all site data and content.

## Why Clarity?

Clarity replaces the traditional sync-fork workflow. Instead of merging thousands of upstream lines into your blog repository, you consume the Theme as a Layer and keep only your own files:

- **One `extends` entry** installs the whole blog application skeleton.
- **Theme and consumer are separated**: articles, friend links, redirects, deployment settings, secrets, and dependency patches never enter the Theme package.
- **Validated configuration**: `clarity.config.ts` is schema-checked with defaults and strict unknown-field rejection.
- **Content factory**: the Nuxt Content collection and article schema are derived from your configuration.
- **Rich rendering**: Markdown, MDC components, Shiki code highlighting, KaTeX, Mermaid, ABC music scores, and rich images.
- **Complete outputs**: article list, archive, pagination, TOC, search, theme toggle, widgets, Atom, OPML, statistics, robots, sitemap, and LLMs.
- **Integrations stay yours**: Twikoo, head scripts, and anti-mirror are driven by consumer configuration.
- **Override without forking**: UI app-config overrides, same-path component overrides, custom Shiki themes, and consumer CSS.

## Core principles

- **Clarity is a Layer extraction of blog-v3**, not a reimplemented theme. Upstream UI, layout, and interaction are the source of truth by default and stay byte-identical except for explicit mechanical path rewrites recorded in `tests/upstream-parity.manifest.json`.
- **Upstream hard-coded behavior is preserved first.** Generalization, configuration coverage, and cleanup are future work, not this parity line.
- **Personal site data stays with the consumer**, following the boundary that upstream `init-project` resets.
- **Drift is a bug.** `pnpm test:upstream-parity` fails on any undeclared difference inside the sync surface.

## Choose your path

| Starting point | Documentation |
| --- | --- |
| New blog | [Create a project](./docs/getting-started/new-project.md) |
| Existing blog-v3 site | [Migrate from blog-v3](./docs/getting-started/migration-from-blog-v3.md) · Agent skill: `migrate-blog-v3-to-clarity` |
| Manual installation into an existing Nuxt app | [Manual installation](./docs/getting-started/manual-installation.md) |

For an Agent-assisted migration, ask your agent to use the `migrate-blog-v3-to-clarity` skill. The full skill lives in [`skills/migrate-blog-v3-to-clarity`](./skills/migrate-blog-v3-to-clarity/SKILL.md).

## Quick start

```bash
pnpm create clarity-theme@beta my-blog
cd my-blog
pnpm dev
```

The creator shows editable defaults for site identity and detects your system
timezone; generated projects include the `pnpm new-blog` authoring command.

The creator package is published separately as `create-clarity-theme`; the `@beta` dist-tag is used while its initial prerelease is the published channel. See [`create-clarity-theme/README.md`](./create-clarity-theme/README.md) for all options. The manual path is four files:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
})
```

```ts
// clarity.config.ts
import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: 'My Blog',
		description: 'Notes about technology and life',
		url: 'https://example.com/',
		author: { name: 'My Name', avatar: '/avatar.webp' },
	},
})
```

```ts
// content.config.ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

```bash
pnpm add clarity-theme
pnpm dev
```

Place articles under `content/posts/` and other Content pages under `content/`. See [Manual installation](./docs/getting-started/manual-installation.md) for the optional `feeds.ts` friend data and deployment notes.

## Requirements

| Runtime | Version |
| --- | --- |
| Node.js | `^22.19 \|\| ^24.11 \|\| >=26` |
| pnpm | 12.4.1 or a compatible package manager for your project |
| Nuxt peer | `^4.5.2` |
| Vue peer | `^3.5.42` |

Clarity is part of your application runtime (the Nuxt build and static generation load the Layer directly), so install it as a regular dependency rather than a development dependency.

## Documentation

All documents are also available in 简体中文 as sibling `*.zh-CN.md` files. Start from the [documentation index](./docs/README.md):

- **Getting started** — [new project](./docs/getting-started/new-project.md), [manual installation](./docs/getting-started/manual-installation.md), [migrating from blog-v3](./docs/getting-started/migration-from-blog-v3.md)
- **Guides** — [configuration](./docs/guides/configuration.md), [content](./docs/guides/content.md), [customization](./docs/guides/customization.md), [integrations](./docs/guides/integrations.md)
- **Reference** — [public API](./docs/reference/api.md), [routes and outputs](./docs/reference/routes-and-outputs.md), [compatibility matrix](./docs/reference/compatibility.md)
- **Concepts** — [architecture](./docs/concepts/architecture.md)
- **Maintainers** — [development](./docs/maintainers/development.md), [testing](./docs/maintainers/testing.md), [upstream sync](./docs/maintainers/upstream-sync.md), [patches](./docs/maintainers/patches.md), [publishing](./docs/maintainers/publishing.md), [release checklist](./docs/maintainers/release-checklist.md), [project status](./docs/maintainers/project-status.md), [roadmap](./docs/maintainers/roadmap.md), [documentation rules](./docs/maintainers/documentation.md)
- **Release history** — [CHANGELOG](./CHANGELOG.md); historical records live under [docs/history](./docs/history/)

## Development

```bash
pnpm install        # Theme + playground workspace
pnpm dev            # Playground dev server
pnpm generate       # Playground static generation
pnpm lint           # ESLint + Stylelint
pnpm typecheck
```

See [development](./docs/maintainers/development.md) and [testing](./docs/maintainers/testing.md) for the full verification matrix, upstream synchronization, and release workflow.

## License

Theme code is MIT. The upstream blog's articles are not included in this package.
