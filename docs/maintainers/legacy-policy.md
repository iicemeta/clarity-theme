# Legacy Policy

**English** | [简体中文](./legacy-policy.zh-CN.md)

How Clarity Theme classifies and sunsets its 0.1.x compatibility surface. This page is governance, not API documentation — the API reference is [public API](../reference/api.md).

## Timeline

| Era | Reading path | Status |
| --- | --- | --- |
| **0.1.x (legacy)** | `useClarityConfig()` / `useClaritySite()` / `useClarityArticle()` / `useClaritySiteFeedEntry()`; the `clarity` key in `app/app.config.ts`; `article.useRandomPermalink` accepted (then removed, now warned-and-ignored) | **Deprecated.** Still functional. Removal target: **0.2.0** |
| **0.2.x (current)** | Flat upstream-shaped app config via `useAppConfig()` (`title`, `nav`, `component.*`, `article.*`, …); `clarity.config.ts` via `defineClarityConfig()` | Current API |

## What is legacy

| Surface | Where it lives | Behavior today |
| --- | --- | --- |
| `useClarityConfig()` and friends | `src/shared/utils/clarity.ts` (client) | Read the injected `clarity` app-config key. No Theme component consumes them; they exist for 0.1.x consumer code. |
| `clarity` nested app-config key | injected by `src/modules/clarity-config` | UI overrides under it merge into the flat shape; site-level fields under it trigger a build-time migration warning. |
| `article.useRandomPermalink` | legacy registry (`legacyConfigKeys` in `src/config/schema.ts` / `schema.mjs`) | Deprecation warning at build, then ignored. Unknown keys **outside** the registry remain fatal (typo protection is not relaxed). |
| `useClarityServerConfig()` | `src/server/utils/clarity.ts` | **Current, not legacy** — the internal Nitro-side config channel for server routes; not a public export. |

## Rules

1. **Govern first, remove later.** The legacy surface keeps working through 0.1.x with deprecation warnings in docs and build output. Nothing is deleted before 0.2.0.
2. **No new legacy.** New features must target the flat upstream-shaped app config. Anything newly deprecated must be added to the registry or this page the same release.
3. **Removal is a breaking release.** The 0.2.0 release removes the legacy composables, the `clarity` app-config key, and the legacy key registry together, with a migration note in the CHANGELOG.
4. **Documentation classification.** Every mention of the surfaces above in docs, skills, or templates must be one of: `CURRENT` (the flat path), `LEGACY` (deprecated, this page), `MIGRATION` (how to move), or `HISTORY` (frozen record). No `UNKNOWN` mentions.

## Migration (before 0.2.0)

| 0.1.x | Current |
| --- | --- |
| `useClarityConfig().site.title` | `useAppConfig().title` |
| `useClaritySite()` | `useAppConfig()` flat site fields (`title`, `author`, `favicon`, …) |
| `useClarityArticle()` | `useAppConfig().article` |
| `useClaritySiteFeedEntry()` | derive from flat fields, or rely on the Theme's OPML/Atom outputs |
| UI overrides under `app.config.clarity` | flat keys in `app/app.config.ts` (`component`, `footer`, `header`, `link`, `nav`, `pagination`, `themes`) |
| `article.useRandomPermalink` | delete the key (no replacement; random permalinks belong to consumer build scaffolding) |
