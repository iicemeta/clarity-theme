# Integrations

**English** | [简体中文](./integrations.zh-CN.md)

Clarity integrates third-party services through configuration only — it never operates a backend, bundles service credentials, or ships analytics identifiers. Source of truth: `clarityIntegrationsSchema` / `clarityFeaturesSchema` in `src/config/schema.ts`, the injection code in `src/modules/clarity-config/index.ts`, and `src/components/post/Comment.vue` plus `src/modules/clarity-config/anti-mirror-client.ts` at runtime.

## Twikoo comments

```ts
export default defineClarityConfig({
	site: { /* … */ },
	integrations: {
		twikoo: {
			envId: 'https://twikoo.example.com/',
			preload: 'https://twikoo.example.com/',
		},
		scripts: [
			{ src: 'https://twikoo.example.com/', defer: true },
		],
	},
})
```

- The comment area renders only when `integrations.twikoo.envId` is present; `preload` is optional and defaults to `envId`.
- The Theme does not bundle Twikoo — keep its loader script in `integrations.scripts`.
- `twikoo.*` is client-visible configuration; it must not contain private credentials. Your Twikoo deployment secrets belong to your Twikoo backend, not to Clarity configuration.
- Check that the article page contains `#twikoo` and that CSP/network policy allows the loader.

## Head scripts

```ts
export default defineClarityConfig({
	site: { /* … */ },
	integrations: {
		scripts: [
			{ src: 'https://analytics.example.com/script.js', defer: true },
		],
	},
})
```

Each entry is a record of HTML attributes (`src`, `defer`, `async`, `data-*`, …). The module injects them into `<head>` at build time; they appear in generated page HTML but never enter appConfig. Never place private tokens here — analytics identifiers and public endpoints only. Environment-specific values belong in consumer `runtimeConfig` and your own injection code.

## Anti-mirror

```ts
export default defineClarityConfig({
	site: { /* … */ },
	features: {
		antiMirror: { blacklist: ['mirror.example.com'] },
	},
})
```

- Default is `false`. The Theme ships **no default blacklist** — mirror-domain suffixes must be provided explicitly.
- `antiMirror: true` is equivalent to an empty blacklist: injection is skipped and the build logs a WARN. Use `{ blacklist: [...] }` instead.
- The blacklist and the canonical URL derived from `site.url` are base64-inlined into a small client script that navigates visitors from a mirrored hostname back to the canonical host.
- Do not copy an old private domain list during migration without explicit user confirmation.

## Feature outputs

`features.atom`, `features.opml`, and `features.stats` toggle the Theme's own server outputs (`/atom.xml`, `/subscriptions.opml`, `/api/stats`). Disabling one removes its prerender rule and head wiring **and** makes the route return 404 in dev/SSR runtime. See [routes and outputs](../reference/routes-and-outputs.md).

## Not provided by the Theme

Clarity does not operate or bundle: comment backends, analytics services, image proxies, search indexes, CMS/database layers, or deployment platforms. Custom endpoints stay in your `server/` tree and remain your responsibility.
