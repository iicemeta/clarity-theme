# Legacy Policy

**English** | [简体中文](./legacy-policy.zh-CN.md)

How Clarity Theme classifies and sunsets its 0.1.x compatibility surface. This page is governance, not API documentation — the API reference is [public API](../reference/api.md).

## Timeline

| Era | Reading path | Status |
| --- | --- | --- |
| **0.1.x (legacy)** | `useClarityConfig()` / `useClaritySite()` / `useClarityArticle()` / `useClaritySiteFeedEntry()`; the `clarity` key in `app/app.config.ts`; `article.useRandomPermalink` | **Removed in 0.2.0.** Kept deprecated through 0.1.x; deleted in the 0.2.0 breaking release. |
| **0.2.x (current)** | Flat upstream-shaped app config via `useAppConfig()` (`title`, `nav`, `component.*`, `article.*`, …); `clarity.config.ts` via `defineClarityConfig()` | Current API |

## What was legacy (removed in 0.2.0)

| Surface | Former location | Behavior at removal |
| --- | --- | --- |
| `useClarityConfig()` and friends | `src/shared/utils/clarity.ts` (client) | Deleted. No Theme component ever consumed them; they served 0.1.x consumer code reading the injected `clarity` app-config key. |
| `clarity` nested app-config key | injected by `src/modules/clarity-config` | Injection and its type surface deleted. A leftover `clarity` key in a consumer `app/app.config.ts` is now just an inert unknown field (build-time migration warning). |
| `article.useRandomPermalink` | legacy registry (`legacyConfigKeys` in `src/config/schema.ts` / `schema.mjs`) | Registry deleted. The key is a fatal unknown key again (strictObject typo protection fully restored). |

`useClarityServerConfig()` (`src/server/utils/clarity.ts`) is **current, not legacy** — the internal Nitro-side config channel for server routes; not a public export.

## Rules

1. **Govern first, remove later.** A deprecated surface keeps working with warnings until the next breaking release; removal lands in that release together with a CHANGELOG migration note (0.2.0 did exactly this).
2. **No new legacy.** New features must target the flat upstream-shaped app config. Anything newly deprecated must be added to this page the same release, with its removal release named.
3. **Removal is a breaking release.** Legacy composables, compat config keys, and compat registries are removed together, never piecemeal.
4. **Documentation classification.** Every mention of removed surfaces in docs, skills, or templates must be one of: `CURRENT` (the flat path), `MIGRATION` (how to move), or `HISTORY` (frozen record). No `UNKNOWN` mentions.

## Migration (0.1.x → 0.2.0)

| 0.1.x | 0.2.0 |
| --- | --- |
| `useClarityConfig().site.title` | `useAppConfig().title` |
| `useClaritySite()` | `useAppConfig()` flat site fields (`title`, `author`, `favicon`, …) |
| `useClarityArticle()` | `useAppConfig().article` |
| `useClaritySiteFeedEntry()` | derive from flat fields, or rely on the Theme's OPML/Atom outputs |
| UI overrides under `app.config.clarity` | flat keys in `app/app.config.ts` (`component`, `footer`, `header`, `link`, `nav`, `pagination`, `themes`) — provide the complete object for a key you override |
| `article.useRandomPermalink` | delete the key (no replacement; random permalinks belong to consumer build scaffolding). Leaving it fails config validation. |
