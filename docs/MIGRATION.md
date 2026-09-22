# Migrating blog-v3 to Clarity Theme

**English** | [简体中文](./MIGRATION.zh-CN.md)

This guide migrates an existing Nuxt 4 `blog-v3` project to the Clarity Theme Layer while preserving articles, frontmatter, public assets, redirects, patches, custom components, custom modules, and server capabilities. It is written for the tested extraction baseline; see [Compatibility](./COMPATIBILITY.md) for the current release matrix.

## 1. Scope

| Item | Supported baseline |
| --- | --- |
| Source project | `blog-v3` 3.7.2 |
| Tested source commit | `f6ea97d745517feb52f0c100e89acb36f0adc12f` |
| Nuxt source/runtime | 4.5.2 / Clarity peer `^4.5.2` |
| Node | `^22.19 \|\| ^24.11 \|\| >=26` |
| Package manager | pnpm 10+; Clarity development itself uses pnpm 12.4.1 |

The field and file mappings below are maintained for this baseline. A nearby 3.7.x source may still migrate, but every unrecognized local change must be reviewed rather than blindly overwritten. Later upstream versions require a diff review and may also require waiting for a Clarity sync.

Migration does not require moving `content/` into the Theme, converting frontmatter, or deleting the old project. Clarity is a Layer; your repository remains the site and data owner.

## 2. Before You Migrate

### 2.1 Verify tooling and versions

```bash
node -v
pnpm -v
node -p "require('./package.json').version"
node -p "require('./package.json').dependencies.nuxt || require('./package.json').devDependencies.nuxt"
```

- Node must satisfy Clarity's engine range.
- Use pnpm 10 or newer. The exact Clarity development version is not mandatory for your site.
- Confirm the source package version and commit. The migration map is tested against 3.7.2 at the commit shown above.

### 2.2 Require a clean, recoverable source repository

```bash
git status --short --branch
git log -1 --oneline
```

Commit or stash user changes first. If the working tree is not clean, stop and produce an inventory instead of overwriting files.

### 2.3 Inventory site-specific capabilities

Record every one of these before editing:

- `blog.config.ts` site, article, feed, stats, script, and Twikoo values
- `app/app.config.ts` UI values and expressions derived from site config
- `content.config.ts` schema extensions
- custom Content collections or Markdown plugins
- `app/feeds.ts` friend groups and helper imports
- `redirects.json`
- `patches/` and `pnpm-workspace.yaml` `patchedDependencies`
- custom modules, plugins, middleware, components, layouts, pages, composables, and stores
- custom server routes, middleware, nitro plugins, and route rules
- deployment files and platform settings
- `runtimeConfig`, environment variables, prerender routes, headers, and redirects
- scripts that create articles or inspect feeds
- integrations such as analytics, comments, search, image services, and external APIs

Mark each item as:

| Classification | Meaning |
| --- | --- |
| `AUTO` | Safe mechanical mapping documented in this guide |
| `REVIEW` | Needs a human decision or site-specific test |
| `KEEP` | Preserve unchanged in the consumer |
| `NEVER_TOUCH` | User content or high-value data that must not be rewritten |

`content/**`, article bodies, frontmatter semantics, public assets, redirects, patches, unknown custom modules, and unknown server code are never automatically deleted or rewritten.

## 3. Backup Guidance

1. Create a migration branch:

   ```bash
   git switch -c migrate-to-clarity
   ```

2. Tag or record the exact source commit:

   ```bash
   git tag pre-clarity-migration
   ```

3. Optionally copy the complete project, including untracked files, to another location. Include `.env` files in your private backup but never commit them.
4. Confirm your Git remote or another offline backup contains all important branches and tags.
5. Keep the original project available until the migrated site builds and you have reviewed representative article routes, feeds, images, redirects, and integrations.

Do not delete `content/`, `public/`, `patches/`, `redirects.json`, custom server code, or the original configuration files until the migration report and validation are complete.

## 4. Migration Steps

The order below keeps a recoverable boundary: install the Layer first, replace configuration entry points one at a time, then reconcile custom code and data.

### 4.1 Install Clarity Theme

Before the first npm release, pin a reviewed Git commit:

```bash
pnpm add github:iicemeta/clarity-theme#<commit>
```

After a released version exists, use the documented package range instead. Install Clarity as a runtime dependency, not a development dependency.

### 4.2 Replace the application entry in `nuxt.config.ts`

Start from a small consumer configuration:

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

Keep consumer-owned settings:

- redirects and custom route rules/headers
- `runtimeConfig`, especially server-only secrets
- custom modules and plugins
- custom nitro/prerender/deployment settings
- platform-specific image, hosting, edge, or CDN behavior
- custom hooks not already supplied by Clarity

Do not copy the complete old blog `nuxt.config.ts`. Clarity already provides its modules, Content Markdown pipeline, styling, color mode, SEO site metadata, robots, LLMs, common head links, and prerender rules for Atom, OPML, and stats. Duplicating those can create unstable merges or duplicate output.

If your Clarity config is not at the root, set the module option:

```ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
	clarityConfig: { configFile: 'config/clarity.config.ts' },
})
```

### 4.3 Create `clarity.config.ts`

Move site and semantic data out of `blog.config.ts`. A near-equivalent of the tested upstream shape is:

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
		},
		types: { tech: {}, story: {} },
		order: { date: 'Created', updated: 'Updated' },
		useRandomPermalink: false,
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

	features: {
		atom: true,
		opml: true,
		stats: true,
		antiMirror: false,
	},

	changelog: [],
})
```

Never place private tokens in this file. Values under `site`, most article/feed/stats data, feature flags, Twikoo settings, and changelog can reach generated client output. Use server-only `runtimeConfig` for secrets.

The complete field contract is in [Configuration](./CONFIGURATION.md).

### 4.4 Replace `content.config.ts`

Use the Clarity factory:

```ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

Do not spread a custom collection schema into this file without reviewing the factory output. If you added frontmatter fields, decide whether they are:

- already represented by the Clarity schema;
- presentation-only fields that can remain extra Content data; or
- contract fields requiring a local schema extension and tests.

Article bodies and frontmatter keys should remain unchanged during migration. Do not normalize dates, categories, permalinks, or wording as a side effect.

### 4.5 Convert `app/app.config.ts` to UI-only overrides

Remove the old spread:

```ts
export default defineAppConfig({
	// Old pattern: do not carry this into Clarity.
	// ...blogConfig,
	clarity: {},
})
```

Keep only UI groups under `clarity`:

```ts
export default defineAppConfig({
	clarity: {
		component: {
			codeblock: { triggerRows: 32, collapsedRows: 16 },
		},
		footer: {
			iconNav: [
				{ icon: 'tabler:home', text: 'Homepage', url: 'https://example.com/' },
			],
		},
		header: {
			showTitle: true,
			emojiTail: ['📝'],
		},
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

Allowed top-level keys are exactly `component`, `footer`, `header`, `link`, `nav`, `pagination`, and `themes`. Site values derived from `blog.config.ts` must come from `clarity.config.ts`. The module intentionally warns if it finds site-level fields in app config.

Nuxt merges objects deeply, but arrays replace the Theme array entirely. Rewrite expressions that referenced `blogConfig`; for example, set the current footer copyright text explicitly or rely on Clarity's generated default.

### 4.6 Move friend data to root `feeds.ts`

Clarity expects optional root-level `feeds.ts`, `feeds.mjs`, or `feeds.js`:

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

- Move friend groups from old `app/feeds.ts`; do not move the old self-feed export into Theme data.
- Atom output derives from your Content collection and `site.*`, so the self-feed entry is no longer required.
- Preserve custom helper functions only when your friend data truly depends on them; otherwise inline stable values to avoid carrying private application utilities.
- `feeds.ts` is user data and is never packaged with Clarity.

### 4.7 Preserve redirects

Keep `redirects.json` at the consumer root and continue deriving route rules from it. Do not move it into Clarity, rename old routes, or change article paths while migrating.

After generation, test both a representative redirect and a canonical article URL. Redirect status should normally remain 308 unless your old deployment deliberately used another status.

### 4.8 Reconcile `package.json`

Clarity supplies its generic blog dependencies. Your package should keep:

- `clarity-theme`
- Nuxt and Vue versions satisfying Clarity peers
- custom modules, integrations, server libraries, deployment tools, and content tooling
- site scripts such as article scaffolding and feed checks
- package-manager patch registration

Remove a dependency only when all of these are true:

1. Clarity declares it for the Layer;
2. no consumer file imports it directly; and
3. your lockfile and typecheck/generate run remain clean.

When in doubt, keep the dependency and mark it `REVIEW`.

### 4.9 Preserve patches

Read [Patches](./PATCHES.md) before changing this area. Patches are install-root state and never transit through an npm package.

| Source patch | Migration action |
| --- | --- |
| `@nuxtjs/mdc` detab behavior | Keep as a consumer patch when tab preservation matters to your code blocks |
| `@nuxt/image` fractional densities | Keep when content passes string values such as `1.5x`; otherwise test removal |
| `plain-shiki` selector | Keep for the current Clarity baseline if exact copy-box highlight colors are required |
| `ipx` ICO passthrough | Keep only if your ICO assets really pass through IPX |
| unregistered files such as the inactive `@vue/shared` patch | Do not register or copy merely because it exists |

Keep patch files and their `patchedDependencies` mappings together, regenerate the lockfile, and inspect the resulting diff. Never copy patches into the Theme package.

### 4.10 Preserve custom components

Clarity already contains the upstream-derived generic components. Do not copy the entire old `app/components/` tree over it.

For each old component:

1. If it is unchanged generic blog code, let the Layer provide it.
2. If it is your custom component, keep it at the same consumer-relative path.
3. If it intentionally modifies generic Clarity behavior, copy only that component to the same path as a consumer override.
4. If it depends on old `blogConfig`, import from `~/clarity.config` only during a transitional review; final runtime code should use Clarity composables or explicit props/configuration.

Common override locations include:

```text
app/components/content/Badge.vue
app/components/blog/BlogFooter.vue
app/components/post/Article.vue
app/components/widget/BlogStats.vue
```

Consumer same-path components take precedence. Nuxt may emit an intentional duplicate-name warning for this pattern.

### 4.11 Preserve custom server and route code

Clarity supplies:

- `server/api/stats.get.ts`
- `server/routes/atom.xml.get.ts`
- `server/routes/subscriptions.opml.get.ts`

Keep your custom server routes, middleware, nitro plugins, API endpoints, authentication, proxies, webhooks, and deployment handlers. If one collides with a Clarity output path, do not delete it silently; compare behavior and choose one explicit implementation.

Route rules and redirects remain consumer-owned. Preserve authentication, caching, headers, SSR/ISR, platform transforms, and deployment-specific behavior.

### 4.12 Preserve assets, public files, and content

- Keep `content/` exactly where it is.
- Keep `public/` files and cache fingerprints/paths.
- Keep source images and other asset directories referenced by articles.
- Keep custom fonts and icons only when your site still uses them.
- Do not rewrite article bodies, frontmatter, image URLs, category names, permalinks, or link text as part of Theme migration.

If an asset must move to repair a broken path, make that a separate reviewed change with before/after validation.

## 5. `blog.config.ts` → `clarity.config.ts` Mapping

| blog-v3 field | Clarity field | Notes |
| --- | --- | --- |
| `title` | `site.title` | Required |
| `subtitle` | `site.subtitle` | Optional |
| `description` | `site.description` | Required |
| `url` | `site.url` | Required; must end with `/` |
| `author` | `site.author` | `name`, `avatar`, `email`, and `homepage` keep their meanings |
| `copyright` | `site.copyright` | `abbr`, `name`, and `url` remain available |
| `favicon` | `site.favicon` | External or public URL may be used |
| `language` | `site.language` | Default `zh-CN` |
| `timeEstablished` | `site.established` | Optional date string |
| `timeZone` | `site.timezone` | Lowercase `zone`; default `Asia/Shanghai` |
| `defaultCategory` | `article.defaultCategory` | Moves under `article` |
| `article.categories` | `article.categories` | Same icon/color shape |
| `article.types` | `article.types` | First key remains the default layout |
| `article.order` | `article.order` | Sort field → display name |
| `article.useRandomPremalink` | `article.useRandomPermalink` | Corrects the source typo; currently a scaffolding flag, not a generator |
| `article.hidePostPrefix` | `article.hidePostPrefix` | Controls `/posts/` prefix removal |
| `article.robotsNotIndex` | `article.robotsNotIndex` | Feeds robots configuration |
| `feed.limit` | `feed.limit` | Positive integer |
| `feed.enableStyle` | `feed.enableStyle` | Atom XSLT switch |
| `stats.includePaths` | `stats.includePaths` | SQL-LIKE Content path patterns |
| `scripts` | `integrations.scripts` | Preserve analytics and Twikoo loader scripts |
| `twikoo` | `integrations.twikoo` | `envId` and optional `preload` |
| `myFeed` | no Clarity config field | Atom self-feed data is derived from `site` and Content |

Fields that became explicit `features`:

| Old behavior | New field | Default |
| --- | --- | --- |
| Atom always generated | `features.atom` | `true` |
| OPML always generated | `features.opml` | `true` |
| Stats API/widget always enabled | `features.stats` | `true` |
| Anti-mirror script configured in private code | `features.antiMirror` | `false` |

The Twikoo UI is enabled by the presence of `integrations.twikoo.envId`; it is not a `features` flag. Its loader script remains in `integrations.scripts`.

## 6. `app/app.config.ts` Mapping

| Old top-level key | New consumer key |
| --- | --- |
| `component` | `clarity.component` |
| `footer` | `clarity.footer` |
| `header` | `clarity.header` |
| `link` | `clarity.link` |
| `nav` | `clarity.nav` |
| `pagination` | `clarity.pagination` |
| `themes` | `clarity.themes` |

Do not spread the old blog config into app config. Site identity and semantic configuration belong in `clarity.config.ts`; app config only overrides reactive UI defaults.

Special cases:

- `header.logo` defaults from `site.author.avatar`.
- `header.subtitle` defaults from `site.subtitle`.
- `footer.copyright` has a generated default from the current year, author, and optional copyright name.
- `pagination.sortOrder` must be a key in `article.order`.
- `component.stats.wordCount` is obsolete; the widget computes current word counts from the stats API.

## 7. `nuxt.config.ts` Principles

### Provided by Clarity

- core blog modules and Layer component/style registration
- Content Markdown, MDC, math, Mermaid, ABC, reading-time, and sitemap pipeline
- color mode and common UI runtime setup
- site name/URL/locale, robots, sitemap, and LLMs defaults
- common head metadata and output feature route rules
- Atom, OPML, and stats server outputs
- permalink and `/posts/` prefix Content hook

### Keep in the consumer

- `extends: ['clarity-theme']`
- redirects imported from `redirects.json`
- custom `routeRules`, headers, caching, auth, and proxies
- server-only `runtimeConfig` and environment integration
- custom modules and plugins
- deployment and prerender routes not known by the Theme
- platform-specific image, edge, CDN, or hosting settings
- custom hooks that implement site policy

Merge a setting into consumer config only when you can test that it overrides rather than duplicates Theme behavior.

## 8. Patch Migration

Clarity deliberately has no patch directory. Preserve required patches in your package-manager configuration, and consult [Patches](./PATCHES.md) for the current disposition.

- **Digested by Theme code:** the old inline-code portion of the MDC compatibility problem is handled by Clarity's code component.
- **Still consumer-owned:** MDC detab preservation, fractional image densities where used, the short-term plain-Shiki selector patch, and optional IPX ICO passthrough.
- **Upstream PR candidates:** fractional image density parsing and the plain-Shiki selector default. MDC detab behavior requires a broader upstream design discussion.

A patch is not migrated merely by copying its file. The dependency version, patch path, lockfile, and `patchedDependencies` registration must all match.

## 9. Data Safety Boundary

- Clarity does not migrate or own articles; `content/` remains in your project.
- Clarity does not carry your friend links; `feeds.ts` remains in your project.
- Clarity does not carry your statistics backend or analytics identifiers; only generic stats generation and configured head scripts are supported.
- Clarity does not carry redirects, deployment files, private media, secrets, or patches.
- Theme package output must not contain user articles or site-specific data.

## 10. Validation

Run commands serially; do not start multiple dev/build processes over the same project simultaneously.

Minimum consumer validation:

```bash
pnpm install
pnpm typecheck
pnpm generate
```

If your project has no `typecheck` script, use `pnpm exec nuxt typecheck` or add an equivalent script. Then run your own unit, lint, link, content, screenshot, deployment-preview, and integration tests.

Representative manual checks:

1. Home page and pagination
2. newest and oldest article routes
3. articles with custom permalinks
4. articles with images, code tabs, math, Mermaid, and music
5. archive, friend, search, TOC, and 404 pages
6. Atom, OPML, stats, robots, sitemap, and LLMs outputs
7. redirects and custom headers
8. Twikoo and analytics branches
9. light/dark/system theme behavior
10. every custom component and server route

Theme maintainers should additionally run the Clarity release suite:

```bash
pnpm test:consumer
pnpm test:compatibility
```

These commands validate the Theme's fixtures and packed consumer; they do not replace tests for your site-specific content.

## 11. Troubleshooting

### Layer is not loaded

- Confirm `clarity-theme` is installed at the required commit/version.
- Confirm `extends: ['clarity-theme']`.
- Remove stale `.nuxt/`, `.output/`, and `.data/` caches after entry-point changes.
- Ensure a custom module or config hook has not replaced Clarity's module list.

### Configuration is rejected or ignored

- Use the exact Clarity field names; schemas reject unknown fields.
- Check `timeZone → timezone`, `timeEstablished → established`, and `useRandomPremalink → useRandomPermalink`.
- Keep `site.url` slash-terminated.
- Confirm `clarity.config.ts` is at the root or referenced by `clarityConfig.configFile`.
- Remove old `...blogConfig` from app config.

### Content schema errors

- Ensure `content.config.ts` exports `createClarityContentConfig(clarityConfig)`.
- Import the same root Clarity config; do not create two divergent config objects.
- Confirm article `type` values exist in `article.types`.
- Do not add a second `content` collection without reviewing Nuxt Content query behavior.

### Articles return 404

- Check `article.hidePostPrefix` and the physical path under `content/posts/`.
- Check frontmatter `permalink` values without editing them.
- Inspect generated routes and redirects for collisions.
- Confirm platform trailing-slash and prerender settings.

### Permalinks differ

Clarity honors Content frontmatter `permalink` before applying prefix hiding. Do not regenerate permalinks during migration. Compare source route, canonical route, redirect target, and generated route list.

### Images fail

- Preserve public/source asset paths.
- Check external image providers and platform image settings.
- Keep the fractional-density patch if content passes `1.5x` strings.
- Keep or deliberately test the ICO/IPX patch.
- Verify custom `Img`/content component overrides still receive the same props.

### Shiki output changes

- Put consumer themes in `app/shiki.config.ts`.
- Confirm both light and dark theme imports.
- Restricted/offline builds may be affected by remote Shiki imports.
- Keep the short-term selector patch if exact plain-highlight colors are required.

### Mermaid changes

Use the Theme Markdown pipeline rather than registering a duplicate `remark-code-component` configuration. Check fenced language, component props, custom `Mermaid.vue` overrides, and browser console errors.

### Math rendering changes

Avoid adding a second KaTeX stylesheet or duplicate remark/rehype plugins. Inspect inline and display equations separately and keep custom math component overrides.

### Twikoo does not initialize

- Configure `integrations.twikoo.envId`.
- Keep the Twikoo loader script in `integrations.scripts`; the Theme does not bundle Twikoo.
- Check `preload`, browser network access, CSP, and deployment domain settings.
- Confirm the article page contains `#twikoo`.

### Atom or OPML is missing

- Check `features.atom` and `features.opml`.
- Confirm generated files and route rules after cache cleanup.
- For Atom, inspect Content draft/date behavior and `feed.limit`.
- For OPML, confirm root `feeds.ts` is discovered and exports `FeedGroup[]`.

### Stats are wrong

- Check `features.stats` and `stats.includePaths`.
- Remember multiple patterns are currently a known correctness issue at the tested baseline; use one reviewed pattern if you hit it.
- Confirm Content paths and generated JSON before changing configuration.

### Redirects fail

- Keep `redirects.json` and its route-rule mapping.
- Check status code, trailing slash, platform transform order, and article route collisions.
- Do not delete old routes until canonical URLs and external links are verified.

### Patch behavior changes

- Confirm every patch is registered in the consumer package-manager config.
- Regenerate the lockfile after dependency or patch changes.
- Compare MDC tabs, image densities, Shiki selector behavior, and ICO handling.
- Never copy patches into Clarity or rely on a package to activate them.
