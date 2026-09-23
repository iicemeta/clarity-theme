# Configuration

**English** | [简体中文](./configuration.zh-CN.md)

Source of truth: `src/config/schema.ts` / `src/config/schema.mjs`, `src/modules/clarity-config/index.ts`, and `src/config/app.ts`, validated by their tests. The API boundary is in [public API](../reference/api.md); current verification state is summarized in [project status](../maintainers/project-status.md).

This page documents the complete configuration surface the Theme exposes to consumers. Field markers:

- **Required** — the consumer must provide it; `defineClarityConfig()` fails validation without it.
- **Optional** — may be omitted.
- **Default** — the Theme value used when omitted.
- Visibility: **✅ Client-visible** (the value enters the client bundle — never store secrets/tokens there); **⚙️ Server-only** (consumed by Nitro at runtime and kept out of the client bundle); **🏗 Build-time** (consumed by the module at build time; never enters appConfig, but may appear in generated page HTML).

Configuration entry points:

| File | Responsibility | Validation |
| --- | --- | --- |
| `clarity.config.ts` | Site / content / feature configuration (`defineClarityConfig`) | Zod schema (`clarity-theme/schema`) |
| `app/app.config.ts` | UI overrides (`defineAppConfig({ clarity: ... })`) | TypeScript (`CustomAppConfig` merge) |
| `content.config.ts` | Calls the Theme factory to generate the Content collection | `createClarityContentConfig` reparses internally |
| `feeds.ts` | Friend data (`FeedGroup[]`) | TypeScript |
| `runtimeConfig` | Environment and secrets; secrets are only valid in the server-only section | Nuxt |

## Complete example

The example shows every top-level group. Field-level constraints follow; when migrating from blog-v3, use the mapping tables in [migration](../getting-started/migration-from-blog-v3.md).

```ts
import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: 'My Blog',
		subtitle: 'Notes and experiments',
		description: 'A Nuxt 4 blog about technology and life.',
		url: 'https://example.com/',
		language: 'zh-CN',
		timezone: 'Asia/Taipei',
		established: '2026-01-01',
		favicon: '/favicon.svg',
		author: {
			name: 'My Name',
			avatar: '/avatar.webp',
			email: 'me@example.com',
			homepage: 'https://example.com/',
		},
		copyright: {
			abbr: 'CC BY 4.0',
			name: 'Attribution 4.0 International',
			url: 'https://creativecommons.org/licenses/by/4.0/',
		},
	},
	article: {
		defaultCategory: 'Uncategorized',
		categories: {
			Uncategorized: { icon: 'tabler:circle-dashed' },
			Tech: { icon: 'tabler:code', color: '#7777ff' },
			Life: { icon: 'tabler:leaf', color: '#ff7777' },
		},
		types: { tech: {}, story: {} },
		order: { date: 'Created', updated: 'Updated' },
		hidePostPrefix: true,
		robotsNotIndex: ['/preview', '/previews/*'],
	},
	feed: { limit: 50, enableStyle: true },
	stats: { includePaths: ['posts/%'] },
	integrations: {
		scripts: [
			{ src: 'https://analytics.example.com/script.js', defer: true },
		],
		twikoo: {
			envId: 'https://twikoo.example.com/',
			preload: 'https://twikoo.example.com/',
		},
	},
	features: {
		atom: true,
		opml: true,
		stats: true,
		antiMirror: { blacklist: ['mirror.example.com'] },
	},
	changelog: [
		{ date: '2026-01-01', text: 'Moved to Clarity Theme.' },
	],
})
```

## `clarity.config.ts`

### `site`

| Field | Type | Constraint | Visibility |
| --- | --- | --- | --- |
| `title` | string | **Required**, non-empty | ✅ |
| `subtitle` | string | Optional | ✅ |
| `description` | string | **Required**, non-empty | ✅ |
| `url` | string | **Required**, valid URL and **must end with `/`** (used for `new URL()` relative resolution) | ✅ |
| `language` | string | Default `'zh-CN'` | ✅ |
| `timezone` | string | Default `'Asia/Shanghai'` | ✅ |
| `established` | string | Optional site founding date | ✅ |
| `favicon` | string | Default `'/favicon.svg'` | ✅ |
| `author.name` | string | **Required**, non-empty | ✅ |
| `author.avatar` | string | Optional | ✅ |
| `author.email` | string | Optional (public metadata in author meta / Atom / OPML output) | ⚙️ server-consumed only (kept out of appConfig; appears in HTML head and feed output as public metadata) |
| `author.homepage` | string | Optional | ✅ |
| `copyright` | `{ abbr?, name?, url? }` | Optional | ✅ |

### `article`

| Field | Type | Constraint / default | Visibility |
| --- | --- | --- | --- |
| `defaultCategory` | string | Default `'未分类'` | ✅ |
| `categories` | `Record<string, { icon?, color? }>` | Default `{}` | ✅ |
| `types` | `Record<string, object>` | Default `{ tech: {} }`; explicit empty objects are allowed, but the Content schema falls back to `tech`, so configure it explicitly | ✅ |
| `order` | `Record<string, string>` (sort field → display name) | Default `{ date: '创建日期', updated: '更新日期' }` | ✅ |
| `hidePostPrefix` | boolean | Default `true`; module build-time only | 🏗 build-time only (kept out of appConfig / client bundle) |
| `robotsNotIndex` | string[] | Default `[]`; module build-time only | 🏗 build-time only |

The first key of `article.types` is the default article layout; `pagination.sortOrder` must be a key of `article.order`.

### `feed`

| Field | Type | Constraint / default | Visibility |
| --- | --- | --- | --- |
| `limit` | number | Positive integer, default `50` | ⚙️ server-only (Atom generation; kept out of the client bundle) |
| `enableStyle` | boolean | Default `true` (XSLT stylesheet) | ⚙️ server-only |

### `stats`

| Field | Type | Constraint / default | Visibility |
| --- | --- | --- | --- |
| `includePaths` | string[] | Default `[]` (count all content); SQL-LIKE syntax (`%` / `_`) matching content paths without extension; **multiple patterns form a union** (`['posts/%', 'notes/%']` counts both) | ⚙️ server-only (the full rule stays out of appConfig; the client only receives the derived `stats.postsOnly` display fact) |

### `integrations`

⚠️ **Never store real secrets here.** `twikoo.*` is client-visible (enters appConfig / the client bundle); `scripts` does not enter appConfig — the module injects it into `<head>` at build time (script attributes appear in generated page HTML). Secrets belong in consumer `runtimeConfig` (server-only).

| Field | Type | Constraint / default | Visibility |
| --- | --- | --- | --- |
| `twikoo.envId` | string | Optional; configuring it renders the comment area | ✅ (appConfig) |
| `twikoo.preload` | string | Optional; defaults to `envId` | ✅ (appConfig) |
| `scripts` | `Record<string, string\|number\|boolean>[]` | Default `[]`; third-party script attributes injected into `<head>` | 🏗 build-time `<head>` injection (removed from appConfig; present in page HTML) |

### `features`

| Field | Type | Constraint / default | Visibility |
| --- | --- | --- | --- |
| `atom` | boolean | Default `true`, `/atom.xml`; when disabled, static output omits the file and dev/SSR runtime returns 404 | 🏗 build-time route rules + server runtime guard (kept out of appConfig) |
| `opml` | boolean | Default `true`, `/subscriptions.opml`; same disable semantics | 🏗 same |
| `stats` | boolean | Default `true`, stats API (server-side); same disable semantics | 🏗 same |
| `antiMirror` | `boolean \| { blacklist: string[] }` | Default `false`. **The Theme ships no default blacklist**: mirror domains must be provided by the consumer in `blacklist`; `true` (equivalent to an empty blacklist) **skips script injection and logs a WARN** — use `{ blacklist: [...] }` to provide domains explicitly. The script navigates mirror hosts back to the canonical host of `site.url` | 🏗 build-time client-script injection (blacklist and site URL are inlined base64; never enters appConfig) |

### `changelog`

`{ date, text }[]`, default `[]`. Displayed newest-first in the changelog widget. Client-visible.

## `app/app.config.ts` (UI overrides, all optional)

The type is `ClarityUiConfig` (from `clarity-theme/config`). Every field may be overridden as needed:

| Group | Fields |
| --- | --- |
| `component.alert` | `defaultStyle: 'card' \| 'flat'` |
| `component.codeblock` | `triggerRows` / `collapsedRows` / `enableIndentGuide` / `indent` / `tabSize` |
| `component.excerpt` | `animation` / `caret` |
| `component.slide` | `showTitle` |
| `component.stats` | `birthYear?` (archive-page age) |
| `header` | `logo` (defaults to `site.author.avatar`) / `showTitle` / `subtitle` (defaults to `site.subtitle`) / `emojiTail` |
| `nav` / `footer.nav` | `NavGroup[]` (`{ title, items }`) |
| `footer` | `copyright` (inline HTML supported) / `iconNav` |
| `link` | `remindNoFeed` / `randomInGroup` |
| `pagination` | `perPage` / `sortOrder` (must be an `article.order` key) / `allowAscending` |
| `themes` | light / system / dark `icon` / `tip` |

Objects merge deeply; arrays replace the Theme value entirely. Only `component`, `footer`, `header`, `link`, `nav`, `pagination`, and `themes` are valid groups — see [customization](./customization.md).

## Files consumers must provide (the Theme never carries them)

| File | Notes |
| --- | --- |
| `clarity.config.ts` | Site configuration |
| `content.config.ts` | Calls `createClarityContentConfig(clarityConfig)` |
| `feeds.ts` (injected via `#clarity/feeds`) | Friend data, typed `FeedGroup[]` (from `clarity-theme/config`) |
| `content/` | Article content |

## Injection points and internal virtual modules

| Identifier | Direction | Notes |
| --- | --- | --- |
| `#clarity/config` | Consumer → Theme | Build-time alias pointing at the consumer clarity config module; not an independent public API |
| `#clarity/feeds` | Consumer → Theme | Friend data |

## Module options (`nuxt.config.ts`)

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `clarityConfig.configFile` | string | Auto-discovery (relative to rootDir: `clarity.config.ts` → `clarity.config.mjs` → `clarity.config.js`) | Path to the clarity config file in the consumer |

Friend data is auto-discovered in the same order (`feeds.ts` → `feeds.mjs` → `feeds.js`); when absent, the Theme's built-in empty fallback is used and a WARN is logged (the friend page and OPML output empty lists).

## Contract conventions

- Fields not listed on this page are **not public API** and may change on upgrade (semver: added in minor, removed/renamed only in major).
- `FeedEntry` / `FeedGroup` are the public type contract for friend data.
