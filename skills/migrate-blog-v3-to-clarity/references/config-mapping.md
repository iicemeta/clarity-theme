# blog-v3 → Clarity Configuration Mapping

The tested source baseline is blog-v3 3.7.2 at Clarity's recorded sync commit. Validate a different baseline against source code before using this map.

## Root site fields

| Source | Clarity | Required/default | Classification | Notes |
| --- | --- | --- | --- | --- |
| `title` | `site.title` | Required | `AUTO` | Non-empty |
| `subtitle` | `site.subtitle` | Optional | `AUTO` | Also seeds UI `header.subtitle` |
| `description` | `site.description` | Required | `AUTO` | SEO/feed metadata |
| `url` | `site.url` | Required | `AUTO` | Must be a valid URL ending in `/` |
| `author.name` | `site.author.name` | Required | `AUTO` | |
| `author.avatar` | `site.author.avatar` | Optional | `AUTO` | Seeds UI `header.logo` |
| `author.email` | `site.author.email` | Optional | `REVIEW` | Public metadata; consider privacy |
| `author.homepage` | `site.author.homepage` | Optional | `AUTO` | |
| `copyright` | `site.copyright` | Optional object | `AUTO` | `abbr`, `name`, `url` |
| `favicon` | `site.favicon` | Default `/favicon.svg` | `AUTO` | `/favicon.ico` redirects there |
| `language` | `site.language` | Default `zh-CN` | `AUTO` | Site locale |
| `timeEstablished` | `site.established` | Optional | `AUTO` | Site establishment date |
| `timeZone` | `site.timezone` | Default `Asia/Shanghai` | `AUTO` | Note lowercase `zone` |
| `defaultCategory` | `article.defaultCategory` | Default `未分类` | `AUTO` | Moves under article |

## Article fields

| Source | Clarity | Required/default | Classification | Notes |
| --- | --- | --- | --- | --- |
| `article.categories` | `article.categories` | Default `{}` | `AUTO` | Same icon/color structure |
| `article.types` | `article.types` | Default `{ tech: {} }` | `AUTO` | First key is default layout |
| `article.order` | `article.order` | Date/updated defaults | `AUTO` | `pagination.sortOrder` must reference a key |
| `article.useRandomPremalink` (upstream typo) | no Clarity field | — | `REVIEW` | Removed in Clarity 0.1.0: random permalink generation belongs to consumer build scaffolding, not the Theme |
| `article.hidePostPrefix` | `article.hidePostPrefix` | Default `true` | `AUTO` | Removes `/posts` for file-routed articles |
| `article.robotsNotIndex` | `article.robotsNotIndex` | Default `[]` | `AUTO` | Feeds robots config |

Do not edit article frontmatter while mapping these fields. `permalink` remains Content data and is honored by the Layer.

## Feed, stats, changelog

| Source | Clarity | Required/default | Classification | Notes |
| --- | --- | --- | --- | --- |
| `feed.limit` | `feed.limit` | Default `50` | `AUTO` | Positive integer |
| `feed.enableStyle` | `feed.enableStyle` | Default `true` | `AUTO` | Atom XSLT |
| `stats.includePaths` | `stats.includePaths` | Default `[]` | `REVIEW` | SQL-LIKE Content stems; multiple patterns are combined as a union (`posts/%` + `notes/%` counts both) |
| no source field | `changelog` | Default `[]` | `REVIEW` | Add only user-approved site history |

## Integrations and features

| Source | Clarity | Classification | Notes |
| --- | --- | --- | --- |
| `scripts` | `integrations.scripts` | `REVIEW` | Preserve analytics and Twikoo loader; reject private secrets |
| `twikoo.envId` | `integrations.twikoo.envId` | `AUTO` | Presence enables the comment UI |
| `twikoo.preload` | `integrations.twikoo.preload` | `AUTO` | Defaults to `envId` |
| implicit Atom | `features.atom` | `AUTO` | Default `true` |
| implicit OPML | `features.opml` | `AUTO` | Default `true` |
| implicit stats | `features.stats` | `AUTO` | Default `true` |
| anti-mirror module/private config | `features.antiMirror` | `REVIEW` | Default `false`; require an explicit blacklist |

`features.antiMirror: true` has an empty blacklist and skips injection. Use `{ blacklist: [...] }` when enabling it. Do not copy an old private domain list without user confirmation.

## App UI fields

Old app config spread the entire blog config. In Clarity it must contain only:

```text
clarity.component
clarity.footer
clarity.header
clarity.link
clarity.nav
clarity.pagination
clarity.themes
```

| Source UI | Clarity UI | Notes |
| --- | --- | --- |
| `component.alert` | `clarity.component.alert` | `defaultStyle` |
| `component.codeblock` | `clarity.component.codeblock` | Threshold/indent settings |
| `component.excerpt` | `clarity.component.excerpt` | Animation/caret |
| `component.slide` | `clarity.component.slide` | Title visibility |
| `component.stats.birthYear` | `clarity.component.stats.birthYear` | Optional |
| `component.stats.wordCount` | no field | Stats widget computes current values |
| `footer.copyright` | `clarity.footer.copyright` | Generated default available |
| `footer.iconNav` | `clarity.footer.iconNav` | Complete array replaces default |
| `footer.nav` | `clarity.footer.nav` | Complete array replaces default |
| `header.logo` | `clarity.header.logo` | Defaults to author avatar |
| `header.showTitle` | `clarity.header.showTitle` | |
| `header.subtitle` | `clarity.header.subtitle` | Defaults to site subtitle |
| `header.emojiTail` | `clarity.header.emojiTail` | Complete array |
| `link.remindNoFeed` | `clarity.link.remindNoFeed` | |
| `link.randomInGroup` | `clarity.link.randomInGroup` | |
| `nav` | `clarity.nav` | Complete array |
| `pagination.perPage` | `clarity.pagination.perPage` | |
| `pagination.sortOrder` | `clarity.pagination.sortOrder` | Must exist in `article.order` |
| `pagination.allowAscending` | `clarity.pagination.allowAscending` | |
| `themes.light/system/dark` | `clarity.themes.light/system/dark` | Icon/tip |

Rewrite expressions importing `blogConfig`. Do not spread it into app config.

## Content and feeds

| Source | Target | Action |
| --- | --- | --- |
| `content.config.ts` custom article schema | `createClarityContentConfig(clarityConfig)` plus reviewed extension | Compare fields before adding extras |
| `content/**` | unchanged | `NEVER_TOUCH` |
| `app/feeds.ts` friend groups | root `feeds.ts` | Preserve entries; remove self-feed export |
| `myFeed` | no config | Atom self data derives from `site` and Content |
| feed helper imports | consumer helpers only when needed | Prefer stable inline values |

## Nuxt config ownership

| Source key | Disposition |
| --- | --- |
| generic modules list | Supplied by Layer; keep only custom additions |
| common head links/meta | Supplied/injected by Layer; keep only site-specific additions |
| `site`, `robots`, `llms` | Derived from Clarity config; override only with reviewed site policy |
| Content Markdown plugins | Supplied by Layer; do not duplicate |
| color mode/components/css | Supplied by Layer |
| `routeRules` for stats/Atom/OPML | Derived from feature flags; keep custom rules |
| redirects map | Keep in consumer |
| `runtimeConfig` | Keep in consumer; secrets must be server-only |
| `nitro`/prerender/deployment | Keep site-specific values |
| custom hooks/plugins/modules | Keep and review interactions |

## Security rules

- Never move private tokens into `clarity.config.ts` or app config.
- Never treat analytics IDs, comment endpoints, mirrors, or public author email as generic defaults; require explicit user data.
- Keep environment-specific deployment values in consumer runtime config.
- Do not copy social/nav links merely because they existed in the source unless they belong to the migrating site.
