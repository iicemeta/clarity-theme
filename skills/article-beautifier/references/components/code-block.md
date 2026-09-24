# Code Block (ProsePre)


## Purpose

Every fenced code block renders through ProsePre: Shiki highlighting at runtime, a filename/language caption, copy and wrap buttons, and automatic collapsing of long blocks.

## Basic Syntax

````md
```ts
const answer = 42
```
````
(The outer fence here is documentation scaffolding — write the inner fence in your article.)

## Props

ProsePre receives parsed fence metadata; authors write it in the fence info string instead of props:

| Form | Example | Effect |
| --- | --- | --- |
| language | ` ```ts ` | Shiki language (default `text`) |
| `[filename]` | ` ```ts [app.vue] ` | Caption with a file-type icon |
| `{lines}` | ` ```ts {2,4} ` | Line highlights (parsed into the `highlights` prop) |
| `wrap` | ` ```ts wrap ` | Start with soft wrap on |
| `expand` | ` ```ts expand ` | Never collapse, however long |
| `icon=` | ` ```ts icon=tabler:star ` | Override the caption icon |
| `indent=` | ` ```ts indent=2 ` | Tab size for this block |

Collapse thresholds come from the app-config key `clarity.component.codeblock` (`triggerRows`, `collapsedRows`, `indent`, `tabSize`, `enableIndentGuide`).

## Slots

None; the code text is the block content.

## Supported Values

Any Shiki language id. `md`/`mdc`/`json`/`yaml` default to indent 2 (source: `getIndent` in `ProsePre.vue`).

## Examples

````md
```ts [clarity.config.ts] {2} icon=tabler:star indent=2 wrap
import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({})
```
````

## Nesting

Code fences nest inside containers (`Tab`, `Folding`); increase the outer colon depth. Without the consumer detab patch, tab-indented code inside `Tab` slot blocks loses its indentation — prefer spaces there.

## When to Use

All code. Prefer meta flags over prose explanations of formatting.

## When Not to Use

Single commands readers copy — [Copy](./copy.md) fits better.

## Common Mistakes

- Putting `wrap`/`expand` in YAML props — they belong in the fence info string.
- Expecting tab preservation without the consumer patch (see [patches](../plugins/patches.md)).

## Support Status

`supported` — verified by compatibility case `B-code` (filename, meta flags, icon, indent, highlights, collapse, diff).

## Source

`src/components/content/ProsePre.vue`; fence parsing by the MDC `parseThematicBlock`; runtime highlighting via `@bikariya/shiki`.
