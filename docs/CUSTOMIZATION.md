# Customizing Clarity Theme

**English** | [简体中文](./CUSTOMIZATION.zh-CN.md)

Clarity separates site data from presentation:

- `clarity.config.ts` owns site identity, Content semantics, feed limits, stats scope, integrations, feature flags, and changelog data.
- `app/app.config.ts` owns only UI defaults.
- Same-path consumer files can override selected Layer components.
- Consumer CSS, server routes, route rules, plugins, and modules remain yours.

See [Configuration](./CONFIGURATION.md) for the data contract and [Migration](./MIGRATION.md) for blog-v3 file mapping.

## 1. UI configuration

Create `app/app.config.ts` and place overrides under `clarity`:

```ts
export default defineAppConfig({
	clarity: {
		component: {
			alert: { defaultStyle: 'flat' },
			codeblock: {
				triggerRows: 32,
				collapsedRows: 16,
				enableIndentGuide: true,
				indent: 4,
				tabSize: 3,
			},
			excerpt: { animation: true, caret: '_' },
			slide: { showTitle: true },
			stats: { birthYear: 2000 },
		},
		footer: {
			copyright: '© 2026 My Name',
			iconNav: [
				{ icon: 'tabler:brand-github', text: 'GitHub', url: 'https://github.com/example' },
			],
			nav: [
				{
					title: 'Site',
					items: [{ icon: 'tabler:rss', text: 'Feed', url: '/atom.xml' }],
				},
			],
		},
		header: {
			logo: '/avatar.webp',
			showTitle: true,
			subtitle: 'A short subtitle',
			emojiTail: ['📝', '✨'],
		},
		link: {
			remindNoFeed: true,
			randomInGroup: true,
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
		pagination: {
			perPage: 10,
			sortOrder: 'date',
			allowAscending: false,
		},
		themes: {
			light: { icon: 'tabler:sun', tip: 'Light' },
			system: { icon: 'tabler:device-desktop', tip: 'System' },
			dark: { icon: 'tabler:moon', tip: 'Dark' },
		},
	},
})
```

Only `component`, `footer`, `header`, `link`, `nav`, `pagination`, and `themes` are valid UI groups. Do not place `site`, `article`, `feed`, `stats`, `integrations`, `features`, or `changelog` here; Clarity warns because consumer app config has a higher merge priority and can accidentally mask validated site configuration.

Nuxt merges objects deeply. Arrays replace the Theme value entirely, so overriding `nav`, `footer.nav`, `footer.iconNav`, or `emojiTail` supplies the complete array.

Derived defaults:

- `header.logo` falls back to `site.author.avatar`.
- `header.subtitle` falls back to `site.subtitle`.
- `footer.copyright` is generated from the current year, author, and optional copyright name.
- `pagination.sortOrder` must match a key in `article.order`.

## 2. Consumer component overrides

Nuxt gives the consumer application precedence when a component exists at the same Layer-relative path. Put your file under your project's `app/components/` tree.

### Content components

Content/MDC components live under:

```text
app/components/content/
```

For example, create:

```text
app/components/content/Badge.vue
```

to replace the Layer component used by:

```md
:badge{name="Nuxt"}
```

Keep the public props/slots expected by your Markdown. A minimal marker component is:

```vue
<template>
<span class="my-badge"><slot /></span>
</template>
```

Common content override points include `Alert.vue`, `Badge.vue`, `CardList.vue`, `Copy.vue`, `Folding.vue`, `Mermaid.vue`, `MusicScore.vue`, `Pic.vue`, `Tip.vue`, and prose components such as `ProseCode.vue`.

### Blog layout components

Blog shell and post components live under:

```text
app/components/blog/
app/components/post/
app/components/widget/
```

Examples include:

```text
app/components/blog/BlogFooter.vue
app/components/blog/BlogSidebar.vue
app/components/post/Article.vue
app/components/widget/BlogStats.vue
```

Prefer UI configuration for data-driven changes such as navigation, footer links, pagination, and component thresholds. Copy a component only when you need different structure or behavior.

### Override rules

1. Do not copy the entire Theme component tree into your project.
2. Copy only a component you intentionally customize.
3. Track the copied path and Clarity version in your site documentation.
4. Re-review overrides after every Theme upgrade.
5. Nuxt may emit a duplicate-name warning (`NUXT_B3011`) for an intentional same-path override; functionality is supported, but the warning is a known current limitation.

Paths outside `content/`, `blog/`, `post/`, and `widget/` are more likely to be internal implementation. They can technically be overridden by path, but their props and responsibilities are less stable.

## 3. Custom Shiki configuration

Create:

```text
app/shiki.config.ts
```

Example:

```ts
export default defineConfig({
	themes: {
		light: () => import('shiki/themes/github-light.mjs'),
		dark: () => import('shiki/themes/one-dark-pro.mjs'),
	},
})
```

When this file exists, Clarity uses it instead of the Theme fallback. Keep both light and dark themes unless your color-mode configuration deliberately disables one.

Shiki code transformers and language registration are part of the Theme Markdown pipeline. A consumer Shiki theme file changes theme data; it is not a place to register duplicate Markdown plugins. If your build environment restricts remote imports, test it explicitly because current Shiki loading may contact remote module hosts.

## 4. CSS overrides

Create a consumer stylesheet, for example:

```text
app/assets/css/site.scss
```

Register it in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
	css: ['~/assets/css/site.scss'],
})
```

Use small, targeted rules rather than copying and editing the complete Theme stylesheet. Consumer CSS is appended after Layer CSS, so later rules of equal specificity can override Theme presentation.

Theme color tokens include:

```css
:root {
	--hue-theme: 220deg;
	--c-primary: hsl(var(--hue-theme) 100% 55%);
	--c-text-1: hsl(var(--hue-theme) 0% 20%);
	--c-bg: hsl(var(--hue-theme) 20% 98%);
	--c-border: hsl(var(--hue-theme) 10% 91%);
}
```

Override both light and dark scopes when changing colors:

```scss
:root,
.light {
	--hue-theme: 260deg;
}

.dark {
	--hue-theme: 260deg;
}
```

SCSS variables and mixins in `app/assets/css/_variable.scss` are internal build details. Custom properties and visible selectors are safer customization points, but major visual changes should use a component override and explicit tests.

## 5. Custom pages, layouts, plugins, and modules

Consumer-owned Nuxt files coexist with the Layer:

```text
app/layouts/
app/pages/
app/plugins/
app/composables/
modules/
```

- A consumer page or layout at the same path overrides the Layer route/layout.
- Add custom plugins and modules in consumer `nuxt.config.ts`.
- Avoid re-adding modules and hooks already supplied by Clarity; configure only your additional behavior.
- Custom composables and plugins should use Clarity's public composables rather than importing private internals.

If you override `app/error.vue`, `app/app.vue`, or a page, you own future changes to that file. Document the reason and re-review it during upgrades.

## 6. Custom server routes and route rules

Clarity provides:

```text
server/api/stats.get.ts
server/routes/atom.xml.get.ts
server/routes/subscriptions.opml.get.ts
```

Your project may add:

```text
server/api/**
server/routes/**
server/middleware/**
server/plugins/**
```

Keep authentication, APIs, webhooks, image proxies, search endpoints, and other site capabilities in the consumer. If a consumer route collides with a Clarity route, do not rely on accidental precedence: review both implementations, choose one owner, and add a regression test.

Use consumer `nuxt.config.ts` for custom `routeRules`, redirects, caching, headers, security policy, platform transforms, and deployment behavior. Redirect data remains site-owned:

```ts
import { mapValues } from 'es-toolkit/object'
import redirectList from './redirects.json'

export default defineNuxtConfig({
	extends: ['clarity-theme'],
	routeRules: {
		...mapValues(redirectList, to => ({ redirect: { to, statusCode: 308 } })),
	},
})
```

## 7. Public assets and content

Keep site-owned files in:

```text
content/
public/
```

The Theme supplies only generic fonts, Atom XSLT/CSS, and other generic public assets. Your favicon, avatars, images, downloads, service workers, verification files, and deployment metadata remain consumer files.

Do not place private keys or environment-specific credentials in public assets or any client-visible configuration.

## 8. Testing customizations

For each override, test at least:

1. the customized UI in light and dark modes;
2. mobile and desktop layout;
3. SSR HTML and client hydration;
4. relevant Markdown/MDC content;
5. feature-off branches where applicable;
6. custom server routes and route rules;
7. static generation and your deployment preview.

Run:

```bash
pnpm typecheck
pnpm generate
```

Then run your project's own integration and deployment tests. See [Migration → Validation](./MIGRATION.md#10-validation) for the full checklist.
