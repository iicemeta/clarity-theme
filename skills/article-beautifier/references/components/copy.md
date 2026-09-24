# Copy


## Purpose

A single command line the reader can copy — and edit first, then undo — with an optional shell prompt and syntax highlighting.

## Basic Syntax

```md
:copy{code="pnpm add clarity-theme"}
```

## Props

| Prop | Type / default | Notes |
| --- | --- | --- |
| `code` | string | The command text |
| `prompt` | string \| boolean, default `'$'` | Prompt prefix. Bare `prompt` or an empty string hides it |
| `lang` | string | Highlight language; default inferred from `prompt` |

Language inference (source: `promptLanguageMap`): a prompt starting with `#` or `$` → `sh`, `CMD` → `bat`, `PS` → `powershell`, otherwise `text`.

## Slots

None; content comes from the `code` prop.

## Supported Values

Single-line commands. A `prompt` that starts a multiline YAML value is still rendered as one line — use a fenced code block for multiline output.

## Examples

```md
:copy{prompt="#" code="reflector --country China --sort rate"}
:copy{prompt code="https://example.com/install.sh"}
```

## Nesting

Inline only.

## When to Use

Install/run commands the reader should paste, config one-liners, URLs that act as commands.

## When Not to Use

Multiline scripts, file contents, or commands whose output matters — use a fenced code block; this component is for the command itself.

## Common Mistakes

- Forgetting to escape quotes inside the brace props.
- Assuming editing the text changes what is stored — the undo button restores `code`.

## Support Status

`supported` — verified by compatibility case `C-mdc`.

## Source

`src/components/content/Copy.vue`; the most-used custom component in the upstream corpus (186 occurrences).
