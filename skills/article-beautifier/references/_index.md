# Capability Index

Machine navigation layer for the Article Beautifier Skill. Read this file first, then open only the referenced file for capabilities the article actually needs. Paths are relative to this skill directory (`skills/article-beautifier/`).

These pages are **bundled copies** of the Theme repository's `docs/mdc/` references, so the Skill stays self-contained after `npx skills add` installs only this directory. The repository copies are authoritative; when the Theme's MDC surface changes, update `docs/mdc/` first and re-sync these files. Status definitions and full evidence live in `docs/mdc/audit.md` (repository).

## Recommended capabilities

```yaml
capabilities:
  - name: alert
    file: components/alert.md
    category: container
    status: supported
    purpose: Typed callout for warnings, errors, questions
    keywords: [warning, caution, note, tip, error, risk, notice, callout]
  - name: card-list
    file: components/card-list.md
    category: container
    status: supported
    purpose: Grid of cards for parallel independent items
    keywords: [features, resources, options, comparison, grid, cards]
  - name: copy
    file: components/copy.md
    category: inline
    status: supported
    purpose: Single copyable command line with prompt
    keywords: [command, install, shell, terminal, cli, run]
  - name: folding
    file: components/folding.md
    category: container
    status: supported
    purpose: Collapsible secondary content
    keywords: [details, expand, collapse, appendix, spoiler, reference-list]
  - name: link-card
    file: components/link-card.md
    category: container
    status: supported
    purpose: Card for one recommended external resource
    keywords: [link, resource, recommendation, site, tool, docs]
  - name: link-banner
    file: components/link-banner.md
    category: container
    status: supported
    purpose: Hero banner for one flagship link
    keywords: [banner, hero, flagship, cover, featured]
  - name: pic
    file: components/pic.md
    category: container
    status: supported
    purpose: Rich image with caption, sizing, zoom
    keywords: [image, figure, screenshot, caption, photo, diagram]
  - name: quote
    file: components/quote.md
    category: container
    status: supported
    purpose: Display quotation with icon
    keywords: [quote, quotation, epigraph]
  - name: tab
    file: components/tab.md
    category: container
    status: supported
    purpose: Parallel variants of the same content
    keywords: [tabs, variants, before-after, languages, alternatives]
  - name: timeline
    file: components/timeline.md
    category: container
    status: supported
    purpose: Labeled chronological events
    keywords: [timeline, history, changelog, phases, chronology]
  - name: chat
    file: components/chat.md
    category: container
    status: supported
    purpose: Quoted conversation transcript
    keywords: [chat, conversation, dialogue, transcript, ai]
  - name: poetry
    file: components/poetry.md
    category: container
    status: supported
    purpose: Centered verse with title/author
    keywords: [poem, poetry, lyrics, verse]
  - name: badge
    file: components/badge.md
    category: inline
    status: supported
    purpose: Compact chip naming a technology or site
    keywords: [badge, chip, tech, brand]
  - name: blur
    file: components/blur.md
    category: inline
    status: supported
    purpose: Hover-to-reveal spoiler text
    keywords: [spoiler, blur, hidden, reveal]
  - name: tip
    file: components/tip.md
    category: inline
    status: supported
    purpose: Inline tooltip gloss
    keywords: [tooltip, gloss, term, jargon, hover]
  - name: key
    file: components/key.md
    category: inline
    status: supported
    purpose: Keyboard key with modifiers
    keywords: [keyboard, shortcut, kbd, hotkey]
  - name: emoji-clock
    file: components/emoji-clock.md
    category: inline
    status: supported
    purpose: Clock emoji for a time
    keywords: [clock, time, emoji]
  - name: link
    file: components/link.md
    category: prose
    status: supported
    purpose: Plain Markdown links get themed rendering automatically
    keywords: [link, href, anchor, external, internal]
  - name: inline-code
    file: components/inline-code.md
    category: prose
    status: supported
    purpose: Backtick code with optional {lang} highlighting
    keywords: [code, inline, identifier, filename]
  - name: code-block
    file: components/code-block.md
    category: prose
    status: supported
    purpose: Fenced code with filename/meta/collapse/copy
    keywords: [code, fence, snippet, filename, highlight, collapse]
  - name: table
    file: components/table.md
    category: prose
    status: supported
    purpose: Markdown tables render as scrollable tables
    keywords: [table, rows, columns, matrix]
  - name: mermaid
    file: plugins/mermaid.md
    category: fence-plugin
    status: supported
    purpose: Diagrams via mermaid fences
    keywords: [diagram, flowchart, sequence, graph, mermaid]
  - name: music-abc
    file: plugins/music-abc.md
    category: fence-plugin
    status: supported
    purpose: ABC notation via music-abc fences
    keywords: [music, score, notation, abc, song]
  - name: math
    file: plugins/math.md
    category: fence-plugin
    status: supported
    purpose: LaTeX math via $ delimiters
    keywords: [math, formula, latex, katex, equation]
```

## Conditional — only with the documented condition

```yaml
conditional:
  - name: meta-slots
    file: plugins/meta-slots.md
    condition: frontmatter aside array must register meta-aside-* names
    keywords: [aside, license, copyright, widget, meta]
  - name: feed-card
    file: components/feed-card.md
    condition: requires full FeedEntry data; friend-link context only
    keywords: [friend, feed, blogroll]
  - name: feed-group
    file: components/feed-group.md
    condition: requires FeedEntry[] data; friend-link page context
    keywords: [friend, feed, group, blogroll]
  - name: tab-preserving-fences
    file: plugins/patches.md
    condition: consumer @nuxtjs/mdc detab patch registered
    keywords: [tab, indent, patch, detab]
  - name: fractional-densities
    file: plugins/patches.md
    condition: consumer @nuxt/image patch registered
    keywords: [density, image, patch]
```

## Syntax reference

`references/syntax.md` bundles the MDC syntax forms (inline components, containers, YAML props, slots, nesting, prose mapping) for the workflow's syntax-validity check.

## Forbidden for recommendations

`do-not-use`: `::md-title` (unused, undocumented wrapper) and inline site-shell embedding such as `:blog-header`. See `docs/mdc/audit.md` in the Theme repository before ever revisiting these.

## Selection heuristics

- Warnings/risks/errors → `alert` (one, with a real semantic type).
- Recommended resources, 3+ parallel items → `card-list` or `link-card`.
- Commands readers run → `copy`; multiline code stays fenced.
- Secondary/digressive blocks → `folding`.
- Parallel variants → `tab`; sequences stay lists.
- Chronology with labels → `timeline`; without labels stay headings.
- Everything else stays plain Markdown.