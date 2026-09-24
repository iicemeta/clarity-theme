---
name: article-beautifier
description: Beautify and restructure a Clarity Theme Markdown/MDC article without changing its meaning. Use when a user asks to beautify an article, add MDC, improve article typography or visual structure, or convert plain Markdown into richer Clarity Theme article structure.
---

# Article Beautifier

Improve an article's information hierarchy, readability, and visual structure — not its component count. Plain Markdown is the default; MDC is an upgrade you must justify per use.

This Skill never edits theme implementation, components, config, or dependencies. It edits article Markdown/MDC files only.

## Workflow

1. Locate the target article and read it end to end. Do not sample.
2. Map its structure: headings, sections, lists, code, quotes, warnings, steps, resources.
3. Read [`references/_index.md`](./references/_index.md) — nothing else first.
4. Decide which capabilities have genuine semantic value for this article. Most articles need zero to three.
5. Open only the referenced files under `references/` (`components/`, `plugins/`, `syntax.md`). No bulk reading.
6. Edit the article. Preserve the author's wording, facts, links, and conclusions.
7. Re-check: meaning preserved, syntax valid, restraint respected.
8. Report what you changed, why, and what you deliberately left as plain Markdown.

The reference pages are bundled copies of the Theme repository's `docs/mdc/` wiki, so this Skill is self-contained after `npx skills add`. Repository copies are authoritative; do not treat the bundles as the source of truth when both are present.

## Restraint rules

- **Markdown first.** Use MDC only where it clearly improves expression.
- **Semantics first.** A risk note is an Alert; a plain explanation is not.
- **Cards are for independent, parallel items** — resources, features, summaries. Never one card per paragraph.
- **No stacking.** Never produce alert/tip/warning/card chains. If everything looks emphasized, nothing is.
- **Do not invent.** No new facts, links, props, APIs, or conclusions.
- **Never guess props/slots/variants.** They must exist in the capability reference or source code. If unsure, keep plain Markdown.
- Statuses matter: use `supported` freely; use `conditional` only when its condition is met; never recommend `upstream-only` or `do-not-use` items.

## Hard limits

- FeedCard/FeedGroup are friend-link data components — not article beautification.
- `meta-*` slots change page layout, not article body; only touch them on explicit request.
- Raw HTML and `:::div` wrappers are escape hatches, not structure.
- Tab indentation without the consumer patch is lossy; prefer spaces inside Tab.

## Output

Finish with a summary listing: components used and why; sections deliberately left unchanged; any capability you considered and rejected. Never just "article beautified".