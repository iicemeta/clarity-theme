# MDC Capability Audit

**English** | [简体中文](./audit.zh-CN.md)

This is the maintainer-facing inventory of every article-facing Markdown/MDC capability found in the audited upstream `blog-v3` baseline, compared against the Clarity Theme Layer. It is a living document: when upstream or the Layer changes, re-run the method below and update the table, the counts, and the references — this page is the reason a gap should never be discovered twice.

## Scope

Audited surfaces (upstream side):

- `app/components/content/**` — all 27 content components
- `content/**/*.md` — 90 articles, including the component showcase `content/previews/example.md`
- `content.config.ts`, `nuxt.config.ts`, `package.json`, `pnpm-workspace.yaml`
- `remark-plugins/**` — `remark-code-component.ts`, `rehype-meta-slots.ts`
- `patches/**` and the patch registrations in `pnpm-workspace.yaml`
- prose-mapped Markdown nodes and MDC syntax forms used in real articles

Compared against (Theme side): `src/components/content/**`, `src/remark-plugins/**`, `src/components/util/Img.vue`, `src/config/feed.ts`, `src/pages/[...slug].vue`, `src/components/post/PostFooter.vue`, the `content` block of `nuxt.config.ts`, `playground/content/**`, and `scripts/compatibility-cases.mjs`.

## Method

1. **Implementation** — read every component's `defineProps` / `defineSlots` / template; record only props and slots that exist in source. Attribute fallthrough (for example `open` on Folding) is documented as such, never as a declared prop.
2. **Usage** — regex-searched all upstream articles for container tags (`::name`), inline tags (`:name{`/`:name[`), YAML prop blocks, `#slot` lines, fenced languages (`mermaid`, `music-abc`), math delimiters, meta-slot containers, and raw-HTML wrappers. Usage counts below are occurrences across the corpus, not distinct sites.
3. **Pipeline** — traced `nuxt.config.ts` → remark/rehype plugin chain → prose components → app-config-dependent behavior.
4. **Comparison** — diffed the component directory, then verified Layer registration (`components` paths in `nuxt.config.ts`) and consumer boundary (data, pages, patches, remote assets).
5. **Verification** — cross-checked each capability against the compatibility fixtures (`A-markdown`, `B-code`, `C-mdc`, `D-math`, `D-mermaid`, `D-music`, `D-image`) and browser/hydration cases.

A capability is `supported` only when the Layer carries the implementation, registers it, and no consumer-specific data, page, or patch is required. Fixture coverage is recorded separately — a source-verified component without a fixture row is still `supported`, but noted.

## Summary

| Total capabilities | supported | conditional | upstream-only | do-not-use |
| ---: | ---: | ---: | ---: | ---: |
| 39 | 30 | 7 | 0 | 2 |

Component-level detail: of the 27 upstream content components, 24 are `supported`, 2 are `conditional` (FeedCard, FeedGroup), 1 is `do-not-use` (MdTitle). The site-shell `BlogHeader`, embeddable from MDC in one upstream article, is additionally `do-not-use`. There are **no upstream-only components** — the Layer carries all of them.

## Inventory

Usage counts are occurrences in the audited upstream corpus. "Fixture" names the compatibility case that verifies the capability; "—" means source-verified only.

### Components

| Capability | Syntax | Upstream usage | Theme source | Fixture | Status | Notes |
| --- | --- | ---: | --- | --- | --- | --- |
| [Alert](./components/alert.md) | `::alert` | 63 | `src/components/content/Alert.vue` | C-mdc | supported | Types tip/info/question/warning/error; card/flat resolved via app config |
| [Badge](./components/badge.md) | `:badge[…]` | 75 | `src/components/content/Badge.vue` | C-mdc | supported | Auto GitHub avatar / favicon from `link` |
| [Blur](./components/blur.md) | `:blur[…]` / `::blur` | 11 | `src/components/content/Blur.vue` | — | supported | Hover-to-reveal spoiler text |
| [CardList](./components/card-list.md) | `::card-list` | 7 | `src/components/content/CardList.vue` | C-mdc | supported | Turns a plain ul/ol into a card grid |
| [Chat](./components/chat.md) | `::chat` + `{caption}` | 23 | `src/components/content/Chat.vue` | — | supported | `{.}` self, `{:}` system, `{name}` other party |
| [Copy](./components/copy.md) | `:copy{…}` | 186 | `src/components/content/Copy.vue` | C-mdc | supported | Editable, undoable command line |
| [EmojiClock](./components/emoji-clock.md) | `:emoji-clock{…}` | 2 | `src/components/content/EmojiClock.vue` | — | supported | Live clock unless `datetime` given |
| [FeedCard](./components/feed-card.md) | `::feed-card` + YAML | 0 (page-driven) | `src/components/content/FeedCard.vue` | — | conditional | Needs a full `FeedEntry`; designed for the friend-links page and consumer `feeds.ts` |
| [FeedGroup](./components/feed-group.md) | `::feed-group` + YAML | 0 (page-driven) | `src/components/content/FeedGroup.vue` | — | conditional | Needs `FeedEntry[]` data; not an article-authoring tool |
| [Folding](./components/folding.md) | `::folding` | 16 | `src/components/content/Folding.vue` | C-mdc | supported | `open` works via attribute fallthrough onto `<details>` |
| [Key](./components/key.md) | `:key{…}` | 9 | `src/components/content/Key.vue` | — | supported | Modifier composition `cmd`/`ctrl`/`shift`/`alt`/`meta`/`win` |
| [LinkBanner](./components/link-banner.md) | `::link-banner` + YAML | 20 | `src/components/content/LinkBanner.vue` | — | supported | Background-image link card; `title`/`link` required |
| [LinkCard](./components/link-card.md) | `::link-card` + YAML | 52 | `src/components/content/LinkCard.vue` | — | supported | Icon link card; `#icon` slot overrides `icon` prop |
| MdTitle | `::md-title` | 0 | `src/components/content/MdTitle.vue` | — | do-not-use | No usage anywhere in upstream; undocumented styling-only wrapper |
| [Mermaid](./plugins/mermaid.md) | ` ```mermaid ` fence | 2 | `src/components/content/Mermaid.vue` | D-mermaid | supported | Rendered via remark-code-component, not `::mermaid` |
| [MusicScore](./plugins/music-abc.md) | ` ```music-abc ` fence | 4 | `src/components/content/MusicScore.vue` | D-music | supported | Playback needs remote SoundFonts; notation renders regardless |
| [Pic](./components/pic.md) | `::pic` + YAML / `![]()` | 126 | `src/components/content/Pic.vue` | D-image | supported | Lightbox zoom, `#caption` slot, image mirror services |
| [Poetry](./components/poetry.md) | `::poetry` | 8 | `src/components/content/Poetry.vue` | — | supported | Centered verse block with title/author/footer |
| [ProseA](./components/link.md) | `[label](https://example.com)` | everywhere | `src/components/content/ProseA.vue` | A-markdown | supported | Auto domain icon; `icon=false` disables |
| [ProseCode](./components/inline-code.md) | `` `code`{lang="ts"} `` | common | `src/components/content/ProseCode.vue` | B-code | supported | Dual-mode: works with and without the MDC inline-code patch |
| [ProsePre](./components/code-block.md) | fenced code + meta | everywhere | `src/components/content/ProsePre.vue` | B-code | supported | `[filename]`, `{lines}`, `wrap`, `expand`, `icon=`, `indent=` |
| [ProseTable](./components/table.md) | Markdown tables | common | `src/components/content/ProseTable.vue` | A-markdown | supported | Scroll container with toggle |
| [Quote](./components/quote.md) | `::quote` / `:quote[…]` | 66 | `src/components/content/Quote.vue` | — | supported | Large quotation block; `#icon` slot |
| [Tab](./components/tab.md) | `::tab` + `#tabN` | 35 | `src/components/content/Tab.vue` | — | supported | Indent inside slot blocks is swallowed without the detab patch |
| [Timeline](./components/timeline.md) | `::timeline` + `{caption}` | 8 | `src/components/content/Timeline.vue` | — | supported | Caption lines become `dt`, other blocks become `dd` |
| [Tip](./components/tip.md) | `:tip[…]` | 21 | `src/components/content/Tip.vue` | C-mdc | supported | Tooltip; `copy` mode copies the slot text |
| [VideoEmbed](./components/video-embed.md) | `::video-embed` | 10 | `src/components/content/VideoEmbed.vue` | — | supported | raw/bilibili/bilibili-nano/youtube/douyin/douyin-wide/tiktok |

### Pipeline, syntax, and patch capabilities

| Capability | Syntax / form | Upstream usage | Theme source | Fixture | Status | Notes |
| --- | --- | ---: | --- | --- | --- | --- |
| [Core Markdown](./syntax.md) | headings, lists, tasks, footnotes, emphasis, blockquote | everywhere | Content pipeline | A-markdown | supported | TOC depth 4; task lists and footnotes verified |
| [MDC syntax forms](./syntax.md) | inline, container, YAML props, slots, nesting | everywhere | Content pipeline | C-mdc | supported | Documented in [syntax](./syntax.md) |
| [Math](./plugins/math.md) | `$…$`, `$$…$$` | present | remark-math + rehype-katex in `nuxt.config.ts` | D-math | supported | KaTeX CSS is loaded from a remote CDN by the Layer |
| [Code-component mapping](./plugins/code-component.md) | fence language → component | 6 | `src/remark-plugins/remark-code-component.mjs` | D-mermaid/D-music | supported | `mermaid`→Mermaid, `music-abc`→MusicScore |
| [Meta slots](./plugins/meta-slots.md) | `::meta-copyright`, `:::meta-aside-*` | 5 | `src/remark-plugins/rehype-meta-slots.mjs` | — | conditional | `meta-aside-*` also needs frontmatter `aside: [...]` registration |
| [Reading time](./plugins/reading-time.md) | frontmatter `readingTime` | all articles | `remark-reading-time` in `nuxt.config.ts` | E-normal | supported | Injected; never set manually |
| [Tab-preserving fenced code](./plugins/patches.md) | tab characters in fences | present | consumer patch | B-code (spaces) | conditional | Requires consumer `@nuxtjs/mdc` detab patch |
| [Fractional image densities](./plugins/patches.md) | `densities="1.5x"` | present | consumer patch | — | conditional | Requires consumer `@nuxt/image` patch |
| [Shiki highlight selector fix](./plugins/patches.md) | `::highlight()` scope | present | consumer patch | — | conditional | Requires consumer `plain-shiki` patch |
| [ICO passthrough](./plugins/patches.md) | `.ico` through IPX | present | consumer patch | — | conditional | Optional site recipe; only when ICO enters IPX |
| Raw HTML / `:::div` wrapper | HTML in Markdown | 2 | Content pipeline | — | supported | Escape hatch; prefer semantic components |
| Inline Vue component embedding | `:blog-header` | 3 | `src/components/blog/BlogHeader.global.vue` | — | do-not-use | Site-shell demo inside one article; not an article capability |

## Gaps

1. **No component-level gap.** All 27 upstream content components exist in `src/components/content/` and are registered by the Layer `components` config. Differences found during the diff are adaptations only (relative imports, `useClarityConfig()`, ProseCode dual-mode).
2. **Patch-dependent behavior.** Four upstream patches change article rendering (tab preservation, fractional densities, Shiki selector, ICO passthrough). The Theme deliberately ships none of them; consumers who need that behavior register the patches themselves. See [patch strategy](../../maintainers/patches.md) and [patches](./plugins/patches.md). No code changes were made in this audit.
3. **Fixture coverage gaps.** `blur`, `chat`, `emoji-clock`, `key`, `link-banner`, `link-card`, `poetry`, `quote`, `tab`, `timeline`, `video-embed`, `feed-card`, `feed-group`, and `meta-slots` have no compatibility fixture row. They are `supported`/`conditional` by source evidence. Adding fixture coverage is future test work, not a documentation change.
4. **Data-driven components.** FeedCard/FeedGroup expect `FeedEntry` data and are consumed by the friend-links page from consumer `feeds.ts`. They render from MDC YAML too, but are not general article tools.
5. **Remote assets.** Math needs the CDN KaTeX stylesheet injected by the Layer; MusicScore playback probes `paulrosen.github.io` SoundFonts; Badge auto-images come from GitHub/webp.se/gstatic endpoints. Offline consumers should treat those as `conditional` niceties.

## Maintenance workflow

When upstream blog-v3 adds or changes an article capability:

1. **Find the implementation** — upstream `app/components/content/<Name>.vue`, a `remark-plugins/` file, or a `content` config entry in `nuxt.config.ts`.
2. **Find real usage** — search upstream `content/**/*.md` for `::name`, `:name{`, `:name[`, YAML blocks, `#slot` lines, and fence languages; the showcase article is `content/previews/example.md`.
3. **Compare the Theme** — `src/components/content/<Name>.vue` (or `src/remark-plugins/`), registration in `nuxt.config.ts`, and any consumer boundary (data, pages, patches, remote assets).
4. **Classify** — `supported` / `conditional` / `upstream-only` / `do-not-use`, with evidence; never infer support from existence alone.
5. **Update** — the row here, the counts, the per-capability reference under `docs/mdc/components/` or `docs/mdc/plugins/`, the machine index in `skills/article-beautifier/references/_index.md` **plus the bundled copies under `skills/article-beautifier/references/`** (the Skill ships self-contained duplicates of these pages so `npx skills add` works without the repository), and — when the capability is stable and generic — a fixture in `playground/content/compatibility/` plus `scripts/compatibility-cases.mjs`.

## Answers to the maintainer questions

- **Where to check when upstream adds a component?** This table's Maintenance workflow, step 1–3.
- **Which file is the real implementation?** Theme: `src/components/content/*.vue` and `src/remark-plugins/*.mjs`. Upstream: `app/components/content/*.vue` and `remark-plugins/*.ts`.
- **Which file shows real article usage?** Upstream `content/**/*.md`; the canonical showcase is `content/previews/example.md`.
- **Does Clarity Theme support it?** The Status column; definitions in the [README](./README.md#status-vocabulary).
- **Which reference should a Skill read?** The per-capability page linked in each row, reached through `skills/article-beautifier/references/_index.md`.
