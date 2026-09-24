# MDC Syntax


MDC is the Markdown component syntax understood by Nuxt Content. This page documents the syntax forms Clarity articles actually use, with real shapes taken from the upstream corpus and the Layer pipeline. Per-component props and slots live under `components/`; fence-driven features live under `plugins/` (see `references/_index.md`).

## Inline components

A colon-prefixed tag renders a component inline, inside a paragraph. The bracket part becomes the default slot; the brace part carries props:

```md
A footnote-style hint :tip[hover me]{tip="explains the term"} inside a sentence.
Press :key{code="K"} to search.
```

Boolean props may be written bare (`{icon}`, `{round}`); value props use quotes (`{type="warning"}`). Inline components must stay on one line.

## Container components

A double-colon tag opens a block component, and a lone `::` closes it:

```md
::alert{type="warning" title="Backup first"}
Deleting the volume is irreversible.
::
```

Containers may hold multiple blocks — paragraphs, lists, code fences, nested components. For code fences inside a container, surround the fence with more colons on the *outer* level only when the fence itself uses ```` ``` ```` and ambiguity arises; upstream articles use the three-colon form `` :::component `` for containers that contain nested containers:

```md
:::quote
::blur
SPOILER paragraph.
::
:::
```

The number of colons only needs to increase when nesting containers of the same kind; `::`/`:::`/`::::` are depth markers, not different syntaxes.

## YAML props

Long or structured props go into a YAML block delimited by `---` directly after the opening tag:

```md
::link-card
---
title: Nuxt Content
icon: https://content.nuxt.com/favicon.ico
link: https://content.nuxt.com/docs/files/markdown
---
::
```

YAML props and brace props are interchangeable in expressiveness; prefer braces for one or two simple props and YAML for arrays, URLs with special characters, or many props. In YAML, quote strings that could parse as numbers (for example a Douyin video id).

## Slots

Named slots are `#`-prefixed lines inside a container:

```mdc
::pic{src="/img/photo.jpg"}
#caption
Optional rich caption with **Markdown**.
::
```

Slot names in use: `#title` (Alert, Folding), `#caption` (Pic), `#icon` (Quote, LinkCard), `#tab1`…`#tabN` (Tab), `#default`. An unnamed block is the default slot.

## Nesting

Containers compose: a `Tab` can hold code fences and nested `Folding`; `Chat` and `Timeline` read their caption lines (`{name}`, `{.}`, `{:}`) as structural markers. Two cautions are source-verified:

- Code indentation inside `Tab` slot blocks is swallowed by the MDC parser unless the consumer registers the detab-exempt `@nuxtjs/mdc` patch (see [patches](./plugins/patches.md)).
- Deeply nested same-name containers need increasing colon depth.

## Markdown prose mapping

Standard Markdown nodes are mapped to Theme prose components, so plain Markdown already gets themed rendering:

| Markdown | Prose component | Reference |
| --- | --- | --- |
| `[label](https://example.com)` | `ProseA` (auto domain icon, domain tooltip) | [link](./components/link.md) |
| `` `code` `` and `` `code`{lang="ts"} `` | `ProseCode` (runtime Shiki) | [inline code](./components/inline-code.md) |
| Fenced code | `ProsePre` (filename, meta, collapse, copy) | [code block](./components/code-block.md) |
| Tables | `ProseTable` (scroll toggle) | [table](./components/table.md) |
| Images | Nuxt Image pipeline with figure markup | [pic](./components/pic.md) |

Headings (h1–h4 enter the TOC), lists, task lists, footnotes, blockquotes, and inline emphasis are handled by the standard pipeline and verified by the `A-markdown` compatibility fixture.

## Raw HTML and other elements

Raw HTML keeps working, and the MDC container form `:::div` can wrap Markdown in a class-carrying element. Use it sparingly — prefer semantic components; raw wrappers are escape hatches, not structure. Embedding arbitrary Vue components by name (for example the site-header demo in upstream content) is classified `do-not-use`; classified `do-not-use` in the capability audit (`docs/mdc/audit.md` in the Theme repository).
