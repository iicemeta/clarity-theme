# Inline Code (ProseCode)


## Purpose

Backtick code gets runtime Shiki highlighting when a language is given, and an optional copy button.

## Basic Syntax

``md
Run `pnpm install` first. Compare `const x = 1`{lang="ts"} with plain code.
``

## Props

ProseCode declares `language`, `code`, and `copy`. Authors pass only `{lang="…"}` (and optionally `copy`) via inline attributes; `code` is supplied by the pipeline — the Theme component works both with the upstream MDC inline-code patch (raw text as `code` prop) and without it (text extracted from the slot), so the patch is optional.

## Slots

- `default` — the code text

## Supported Values

Any Shiki language id in `lang`.

## Examples

``md
`.env`{lang="sh"} and `clarity.config.ts` are both highlighted correctly.
``

## Nesting

Inline only.

## When to Use

Short identifiers, flags, filenames; add `{lang}` when highlighting genuinely helps.

## When Not to Use

Multiline content (use a fence), or adding `lang` to every span of prose.

## Common Mistakes

- Expecting `{lang}` on long multiline text.
- Assuming the consumer patch is required — it is not, since the Theme's dual-mode ProseCode reads slot text.

## Support Status

`supported` — verified by compatibility case `B-code` (plain inline code, dotted filenames, `{lang="ts"}`, `{lang="sh"}`).

## Source

`src/components/content/ProseCode.vue`; patch boundary in [patches](../plugins/patches.md).
