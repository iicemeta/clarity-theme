# Code Component Mapping


## Purpose

`remark-code-component` converts fenced code blocks with special languages into component props, so authors write plain fences and get rich components.

## Basic Syntax

```md
```mermaid
graph TD
    A --> B
```
```

## Mapping

Configured in the `content` block of `nuxt.config.ts` (source: `src/remark-plugins/remark-code-component.mjs`):

| Fence language | Component | Prop |
| --- | --- | --- |
| `mermaid` | `Mermaid` | `code` |
| `music-abc` | `MusicScore` | `abc` |

## Behavior

The plugin visits `code` AST nodes, replaces matching fences with a `codeComponent` node whose tag is the component name, and moves the fence text into the configured prop. The component never receives the fence's meta string.

## When to Use

Always write Mermaid/ABC as fences — do not hand-write `::mermaid` or `:music-score`; the components expect the pipeline's props.

## Common Mistakes

- Expecting fence meta (`wrap`, `[filename]`) to reach the component — it does not.
- Adding new mappings by editing the plugin in `node_modules` — the mapping is Layer config; changing it is a Theme change.

## Support Status

`supported` — the mechanism behind compatibility cases `D-mermaid` and `D-music`.

## Source

`src/remark-plugins/remark-code-component.mjs`; registration in `nuxt.config.ts`.
