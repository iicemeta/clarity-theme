# Migrating blog-v3 to Clarity Theme

**English** | [简体中文](./migration-from-blog-v3.zh-CN.md)

This guide migrates an existing Nuxt 4 `blog-v3` project to the Clarity Theme Layer while preserving articles, frontmatter, public assets, redirects, patches, custom components, custom modules, and server capabilities. It is maintained against the source baseline recorded in [`sync-manifest.json`](../../sync-manifest.json) (upstream `blog-v3` 3.7.2); the current verified matrix is in [compatibility](../reference/compatibility.md).

For an Agent-assisted migration, ask your agent to use the `migrate-blog-v3-to-clarity` skill. The skill encodes the same inventory → classification → plan → apply → validation workflow with stricter non-interactive guardrails.

## New project vs existing project

Creating a blog from scratch and migrating an existing site are two different
contracts. Do not mix them:

| Situation | Required path | Never |
| --- | --- | --- |
| New Clarity blog | [`create-clarity-theme`](./new-project.md) — `pnpm create clarity-theme <project>` or `npx create-clarity-theme@latest <project>` | Hand-write `package.json`, guess Nuxt/Vue/Nuxt Content versions, assemble a Nuxt skeleton by hand, or copy this repository as a site |
| Existing `blog-v3` | This guide and the `migrate-blog-v3-to-clarity` skill | Re-run the creator over the project, replace consumer files with the creator template, or delete content, `public/`, redirects, patches, or custom code |

The creator is the source of truth for new-project skeletons, `package.json`,
and the minimum tested direct dependencies. Migration keeps the consumer's own
`package.json` and changes dependencies only through package-manager commands.
Agents asked to "create a Clarity blog" must use the creator and must not
hand-write `package.json`.

### Theme updates after migration

A `package.json` range is not the installed version. Under npm node-semver,
`^0.2.0` means `>=0.2.0 <0.3.0`: it accepts later `0.2.x` patch releases but
not `0.3.0` — a caret range is not an exact pin. `pnpm-lock.yaml` records the
resolved version actually installed, which may stay on an older in-range patch
until you request an update; `pnpm install` alone does not refresh it. A
consumer still pinned to a `^0.1.x` range stays on the legacy 0.1.x line and
must widen the range to receive 0.2.x.

```bash
pnpm update clarity-theme          # refresh the resolved version within the declared range
pnpm add clarity-theme@<version>   # explicitly change the declared dependency range
```

Never hand-edit `pnpm-lock.yaml`.

## 1. Scope

Migration does **not** move `content/` into the Theme, convert frontmatter, or delete your old project. Clarity is a Layer; your repository remains the site and data owner. Every unrecognized local change must be reviewed rather than blindly overwritten. If the source project is not blog-v3, or its baseline is materially different and cannot be reconciled with the mappings below, stop and explain the gap.

| Item | Supported value |
| --- | --- |
| Source project | `blog-v3` 3.7.2 (baseline recorded in `sync-manifest.json`) |
| Nuxt source/runtime | 4.5.2 / Clarity peer `^4.5.2` |
| Node | `^22.19 \|\| ^24.11 \|\| >=26` |
| Package manager | pnpm 10+ works for consumers; Theme development itself uses pnpm 12.4.1 |

## 2. Before you migrate

1. Verify tooling: `node -v`, `pnpm -v`, and the source package/Nuxt versions satisfy the table above.
2. Require a clean, recoverable repository:

   ```bash
   git status --short --branch
   git log -1 --oneline
   ```

   Commit or stash user changes first. If the tree is not clean, stop and produce an inventory instead of overwriting files.

3. Create a migration branch and tag the source commit:

   ```bash
   git switch -c migrate-to-clarity
   git tag pre-clarity-migration
   ```

4. Inventory site-specific capabilities before editing anything: `blog.config.ts`, `app/app.config.ts`, `content.config.ts`, custom collections or Markdown plugins, `app/feeds.ts`, `redirects.json`, `patches/` and their package-manager registration, custom modules/plugins/middleware/components/layouts/pages/composables/stores, custom server routes and route rules, deployment files, `runtimeConfig`, article scaffolding scripts, and integrations.
5. Classify every inventoried asset:

   | Classification | Meaning |
   | --- | --- |
   | `AUTO` | Safe mechanical mapping documented in this guide |
   | `REVIEW` | Needs a human decision or site-specific test |
   | `KEEP` | Preserve unchanged in the consumer |
   | `NEVER_TOUCH` | User content or high-value data that must not be rewritten |

   `content/**`, article bodies, frontmatter semantics, public assets, redirects, patches, unknown custom modules, and unknown server code are never automatically deleted or rewritten.

## 3. Migration steps

The order keeps a recoverable boundary: install the Layer first, replace configuration entry points one at a time, then reconcile custom code and data.

### 3.1 Install Clarity Theme

Install the released npm package as a runtime dependency:

```bash
pnpm add clarity-theme
```

For unreleased commits or debugging a specific change, fall back to a pinned Git dependency (`pnpm add github:iicemeta/clarity-theme#<commit>`); released sites should use the npm package.
When an explicit version or range change is intended, use
`pnpm add clarity-theme@<version>` instead of editing `package.json` by hand.

### 3.2 Replace the application entry in `nuxt.config.ts`

```ts
import { mapValues } from 'es-toolkit/object'
import redirectList from './redirects.json'

export default defineNuxtConfig({
	extends: ['clarity-theme'],

	routeRules: {
		...mapValues(redirectList, to => ({ redirect: { to, statusCode: 308 } })),
		// Keep only site-specific rules here.
	},
})
```

Keep consumer-owned settings: redirects and custom route rules/headers, `runtimeConfig` (especially server-only secrets), custom modules and plugins, custom nitro/prerender/deployment settings, platform image/edge/CDN behavior, and custom hooks. Do not copy the complete old blog `nuxt.config.ts` — Clarity already provides its modules, Content Markdown pipeline, styling, color mode, SEO metadata, robots, LLMs, common head links, and prerender rules for Atom, OPML, and stats.

### 3.3 Create `clarity.config.ts`

Move site and semantic data out of `blog.config.ts`:

```ts
import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: 'My Blog',
		subtitle: 'A short subtitle',
		description: 'A description used by SEO and feeds.',
		url: 'https://example.com/',
		language: 'zh-CN',
		established: '2019-07-19',
		timezone: 'Asia/Shanghai',
		favicon: '/favicon.svg',
		author: {
			name: 'My Name',
			avatar: '/avatar.webp',
			email: 'me@example.com',
			homepage: 'https://example.com/',
		},
		copyright: { abbr: 'CC BY 4.0', name: 'Attribution 4.0 International', url: 'https://creativecommons.org/licenses/by/4.0/' },
	},
	article: {
		defaultCategory: 'Uncategorized',
		categories: {
			Uncategorized: { icon: 'tabler:circle-dashed' },
			Tech: { icon: 'tabler:code', color: '#7777ff' },
		},
		types: { tech: {}, story: {} },
		order: { date: 'Created', updated: 'Updated' },
		hidePostPrefix: true,
		robotsNotIndex: ['/preview', '/previews/*'],
	},
	feed: { limit: 50, enableStyle: true },
	stats: { includePaths: [] },
	integrations: {
		scripts: [
			// Preserve only your own analytics and Twikoo loader scripts.
		],
		twikoo: {
			envId: 'https://twikoo.example.com/',
			preload: 'https://twikoo.example.com/',
		},
	},
	features: { atom: true, opml: true, stats: true, antiMirror: false },
	changelog: [],
})
```

Never place private tokens in this file. Values under `site`, most article/feed/stats data, feature flags, Twikoo settings, and changelog can reach generated client output; secrets belong in server-only `runtimeConfig`. The complete field contract is in [configuration](../guides/configuration.md).

### 3.4 Replace `content.config.ts`

```ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

Do not spread a custom collection schema into this file without reviewing the factory output. If you added frontmatter fields, decide whether they are already represented by the Clarity schema, presentation-only extra Content data, or contract fields requiring a local schema extension and tests. Article bodies and frontmatter keys should remain unchanged — do not normalize dates, categories, permalinks, or wording as a side effect.

### 3.5 Convert `app/app.config.ts` to UI-only overrides

Remove the old `...blogConfig` spread. Keep only UI groups under `clarity`:

```ts
export default defineAppConfig({
	clarity: {
		component: { codeblock: { triggerRows: 32, collapsedRows: 16 } },
		header: { showTitle: true, emojiTail: ['📝'] },
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
		pagination: { perPage: 10, sortOrder: 'date' },
	},
})
```

Allowed top-level keys are exactly `component`, `footer`, `header`, `link`, `nav`, `pagination`, and `themes`. Site values derived from `blog.config.ts` must live in `clarity.config.ts`; the module warns when it finds site-level fields in app config. Objects merge deeply; arrays replace the Theme value entirely.

### 3.6 Move friend data to root `feeds.ts`

```ts
import type { FeedGroup } from 'clarity-theme/config'

export default [
	{
		name: 'Friends',
		desc: 'Blogs I read',
		entries: [
			{
				author: 'Friend',
				title: 'Friend Blog',
				desc: 'A friend site',
				link: 'https://friend.example.com/',
				feed: 'https://friend.example.com/atom.xml',
				date: '2026-01-01',
			},
		],
	},
] satisfies FeedGroup[]
```

Move friend groups from old `app/feeds.ts`; do **not** move the old self-feed export — Atom output derives from your Content collection and `site.*`. Preserve custom helper functions only when the data truly depends on them. `feeds.ts` is user data and never packaged with Clarity.

### 3.7 Preserve redirects

Keep `redirects.json` at the consumer root and keep deriving route rules from it (§3.2). Do not move it into Clarity, rename old routes, or change article paths during migration. Test a representative redirect and a canonical article URL after generation.

### 3.8 Reconcile `package.json`

Your package keeps: `clarity-theme`, Nuxt/Vue satisfying Clarity peers, custom modules/integrations/server libraries/deployment tools, site scripts, and patch registration. Remove a dependency only when Clarity declares it for the Layer, no consumer file imports it directly, and your lockfile plus typecheck/generate remain clean. When in doubt, keep it and mark it `REVIEW`.

### 3.9 Preserve patches

Patches are install-root state and never transit through an npm package — see [patch strategy](../maintainers/patches.md).

| Source patch | Migration action |
| --- | --- |
| `@nuxtjs/mdc` detab behavior | Keep as a consumer patch when tab preservation matters to your code blocks |
| `@nuxt/image` fractional densities | Keep when content passes string values such as `1.5x`; otherwise test removal |
| `plain-shiki` selector | Keep for the current baseline if exact copy-box highlight colors are required |
| `ipx` ICO passthrough | Keep only if your ICO assets really pass through IPX |
| unregistered files such as the inactive `@vue/shared` patch | Do not register or copy merely because it exists |

Keep patch files and their `patchedDependencies` mappings together, regenerate the lockfile, and inspect the diff.

### 3.10 Preserve custom components

Do not copy the entire old `app/components/` tree. For each component:

1. unchanged generic blog code → let the Layer provide it;
2. your own custom component → keep it at the same consumer-relative path;
3. an intentional modification of generic Clarity behavior → copy only that component to the same path as a consumer override;
4. code depending on old `blogConfig` → rewrite against Clarity's public composables or explicit props/configuration.

Consumer same-path components take precedence; Nuxt may emit an intentional duplicate-name warning (`NUXT_B3011`) for this pattern. See [customization](../guides/customization.md).

### 3.11 Preserve custom server and route code

Clarity supplies `server/api/stats.get.ts`, `server/routes/atom.xml.get.ts`, and `server/routes/subscriptions.opml.get.ts`. Keep your custom routes, middleware, nitro plugins, endpoints, authentication, proxies, webhooks, and deployment handlers. If one collides with a Clarity output path, compare behavior and choose one explicit owner rather than relying on accidental precedence.

### 3.12 Preserve assets, public files, and content

Keep `content/`, `public/`, source images, and referenced asset directories exactly where they are. Do not rewrite article bodies, frontmatter, image URLs, category names, permalinks, or link text as part of Theme migration. If an asset must move to repair a broken path, make that a separate reviewed change.

## 4. `blog.config.ts` → `clarity.config.ts` mapping

| blog-v3 field | Clarity field | Notes |
| --- | --- | --- |
| `title` | `site.title` | Required |
| `subtitle` | `site.subtitle` | Optional |
| `description` | `site.description` | Required |
| `url` | `site.url` | Required; must end with `/` |
| `author` | `site.author` | `name`, `avatar`, `email`, `homepage` keep their meanings |
| `copyright` | `site.copyright` | `abbr`, `name`, `url` remain available |
| `favicon` | `site.favicon` | External or public URL may be used |
| `language` | `site.language` | Default `zh-CN` |
| `timeEstablished` | `site.established` | Optional date string |
| `timeZone` | `site.timezone` | Lowercase `zone`; default `Asia/Shanghai` |
| `defaultCategory` | `article.defaultCategory` | Moves under `article` |
| `article.categories` | `article.categories` | Same icon/color shape |
| `article.types` | `article.types` | First key remains the default layout |
| `article.order` | `article.order` | Sort field → display name |
| `article.useRandomPremalink` | no Clarity field | Random permalink generation belongs to consumer build scaffolding; drop the field and keep `permalink` frontmatter as-is |
| `article.hidePostPrefix` | `article.hidePostPrefix` | Controls `/posts/` prefix removal |
| `article.robotsNotIndex` | `article.robotsNotIndex` | Feeds robots configuration |
| `feed.limit` | `feed.limit` | Positive integer |
| `feed.enableStyle` | `feed.enableStyle` | Atom XSLT switch |
| `stats.includePaths` | `stats.includePaths` | SQL-LIKE Content path patterns; multiple patterns are combined as a union |
| `scripts` | `integrations.scripts` | Preserve analytics and Twikoo loader scripts |
| `twikoo` | `integrations.twikoo` | `envId` and optional `preload` |
| `myFeed` | no Clarity config field | Atom self-feed data is derived from `site` and Content |

Implicit upstream behavior becomes explicit feature flags (all default `true` except `antiMirror`): `features.atom`, `features.opml`, `features.stats`, and `features.antiMirror`. The Twikoo UI is enabled by the presence of `integrations.twikoo.envId`, not by a `features` flag; its loader script remains in `integrations.scripts`.

## 5. `app/app.config.ts` mapping

Clarity keeps the upstream-shaped **flat** app config, so the mapping is identity: the top-level key names do not change.

| Old top-level key | New consumer key |
| --- | --- |
| `component` | `component` |
| `footer` | `footer` |
| `header` | `header` |
| `link` | `link` |
| `nav` | `nav` |
| `pagination` | `pagination` |
| `themes` | `themes` |

The 0.1.x nested form (`app.config.clarity.component`, …) was removed in 0.2.0. If a migrated project still carries a `clarity` key, delete it and move each value to the matching top-level key. See the [legacy policy](../maintainers/legacy-policy.md).

Special cases: `header.logo` defaults from `site.author.avatar`; `header.subtitle` defaults from `site.subtitle`; `footer.copyright` has a generated default; `pagination.sortOrder` must be a key in `article.order`; `component.stats.wordCount` is obsolete (the widget computes current word counts from the stats API).

## 6. Data safety boundary

- Clarity does not migrate or own articles; `content/` remains in your project.
- Clarity does not carry friend links; `feeds.ts` remains in your project.
- Clarity does not carry your statistics backend or analytics identifiers; only generic stats generation and configured head scripts are supported.
- Clarity does not carry redirects, deployment files, private media, secrets, or patches.
- Theme package output must not contain user articles or site-specific data.

## 7. Validation

Run commands serially; do not start multiple dev/build processes over the same project simultaneously.

```bash
pnpm install
pnpm typecheck   # or: pnpm exec nuxt typecheck
pnpm generate
```

Then run your own unit, lint, link, content, screenshot, deployment-preview, and integration tests. Representative manual checks:

1. home page and pagination
2. newest and oldest article routes
3. articles with custom permalinks
4. articles with images, code tabs, math, Mermaid, and music
5. archive, friend, search, TOC, and 404 pages
6. Atom, OPML, stats, robots, sitemap, and LLMs outputs
7. redirects and custom headers
8. Twikoo and analytics branches
9. light/dark/system theme behavior
10. every custom component and server route

Theme maintainers changing Clarity's migration contract should additionally run `pnpm test:migration` and `pnpm test:compatibility` in the Theme repository; these validate the Theme's fixtures, not your site content.

## 8. Troubleshooting

- **Layer is not loaded** — confirm `extends: ['clarity-theme']`, remove stale `.nuxt/`, `.output/`, `.data/` caches, and ensure no custom module replaced Clarity's module list.
- **Configuration is rejected or ignored** — schemas reject unknown fields; check `timeZone → timezone` and `timeEstablished → established`; remove the source `useRandomPremalink` flag (no Clarity equivalent); keep `site.url` slash-terminated; confirm the config file is at the root or referenced by `clarityConfig.configFile`; remove old `...blogConfig` from app config.
- **Content schema errors** — export `createClarityContentConfig(clarityConfig)` and import the same root config (do not create two divergent config objects); confirm article `type` values exist in `article.types`.
- **Articles return 404 / permalinks differ** — check `article.hidePostPrefix`, the physical path under `content/posts/`, and frontmatter `permalink` values without editing them; inspect generated routes and redirects for collisions. Clarity honors `permalink` before applying prefix hiding.
- **Images fail** — preserve public/source asset paths; keep the fractional-density patch if content passes `1.5x` strings; verify custom `Img`/content overrides still receive the same props.
- **Shiki output changes** — put consumer themes in `app/shiki.config.ts` with both light and dark imports; restricted/offline builds may be affected by remote Shiki imports.
- **Mermaid / math changes** — use the Theme Markdown pipeline rather than registering duplicate plugins; inspect fenced language, component props, and console errors separately for inline/display math.
- **Twikoo does not initialize** — configure `integrations.twikoo.envId` and keep its loader script in `integrations.scripts`; check `preload`, network access, CSP, and that the article page contains `#twikoo`.
- **Atom or OPML is missing** — check `features.atom`/`features.opml`, generated files and route rules after cache cleanup, `feed.limit`, and that root `feeds.ts` exports `FeedGroup[]`.
- **Stats are wrong** — check `features.stats` and `stats.includePaths`; multiple patterns are combined as a union (`['posts/%', 'notes/%']` counts both); confirm Content paths and the generated JSON before changing configuration.
- **Redirects fail** — keep `redirects.json` and its route-rule mapping; check status code, trailing slash, platform transform order, and route collisions.
- **Patch behavior changes** — confirm every patch is registered in the consumer package-manager config; regenerate the lockfile after dependency or patch changes; never copy patches into Clarity.
