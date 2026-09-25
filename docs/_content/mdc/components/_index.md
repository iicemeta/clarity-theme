# Component References

**English** | [简体中文](./_index.zh-CN.md)

One component, one reference. Every `supported` and `conditional` MDC component has its own page; `do-not-use` findings stay in the [audit](../audit.md) and deliberately get no authoring reference. Machines should enter through `skills/article-beautifier/references/_index.md`; humans can browse the table below.

| Reference | MDC tag | Kind | Status | Purpose |
| --- | --- | --- | --- | --- |
| [alert](./alert.md) | `::alert` | container | supported | Typed callout: tip, info, question, warning, error |
| [badge](./badge.md) | `:badge[…]` | inline | supported | Compact linked chip with auto image |
| [blur](./blur.md) | `:blur[…]` | inline | supported | Hover-to-reveal spoiler text |
| [card-list](./card-list.md) | `::card-list` | container | supported | Grid of cards from a plain list |
| [chat](./chat.md) | `::chat` | container | supported | Chat transcript with speaker captions |
| [copy](./copy.md) | `:copy{…}` | inline | supported | Editable, copyable command line |
| [emoji-clock](./emoji-clock.md) | `:emoji-clock{…}` | inline | supported | Clock emoji matching a time |
| [feed-card](./feed-card.md) | `::feed-card` | container | conditional | Friend-link card needing `FeedEntry` data |
| [feed-group](./feed-group.md) | `::feed-group` | container | conditional | Friend-link group needing feed data |
| [folding](./folding.md) | `::folding` | container | supported | Collapsible details block |
| [key](./key.md) | `:key{…}` | inline | supported | Keyboard key with modifiers |
| [link](./link.md) | `[label](https://example.com)` | prose | supported | Themed link with domain icon |
| [link-banner](./link-banner.md) | `::link-banner` | container | supported | Banner-style link card |
| [link-card](./link-card.md) | `::link-card` | container | supported | Icon link card |
| [pic](./pic.md) | `::pic` | container | supported | Rich image with caption and zoom |
| [poetry](./poetry.md) | `::poetry` | container | supported | Centered verse block |
| [code-block](./code-block.md) | fenced code | prose | supported | ProsePre: filename, meta, collapse, copy |
| [inline-code](./inline-code.md) | `` `code` `` | prose | supported | ProseCode with optional `{lang}` |
| [table](./table.md) | Markdown table | prose | supported | Scrollable table wrapper |
| [quote](./quote.md) | `::quote` | container | supported | Large quotation with icon |
| [tab](./tab.md) | `::tab` | container | supported | Tabbed panels via `#tabN` slots |
| [timeline](./timeline.md) | `::timeline` | container | supported | Timeline with caption lines |
| [tip](./tip.md) | `:tip[…]` | inline | supported | Inline tooltip, optionally copyable |
| [video-embed](./video-embed.md) | `::video-embed` | container | supported | Responsive video / iframe embed |

Fence-driven components ([Mermaid](../plugins/mermaid.md), [ABC music](../plugins/music-abc.md)) and pipeline features are documented under [plugins](../plugins/_index.md).
