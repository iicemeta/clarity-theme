# Pipeline and Plugin References

**English** | [简体中文](./_index.zh-CN.md)

These capabilities are not written as component tags: they enter through fenced code languages, math delimiters, frontmatter, or package patches. One independent extension, one reference.

| Reference | Author syntax | Status | Purpose |
| --- | --- | --- | --- |
| [code-component](./code-component.md) | fence language mapping | supported | How ` ```mermaid ` and ` ```music-abc ` become components |
| [mermaid](./mermaid.md) | ` ```mermaid ` | supported | Diagram rendering, lazy and theme-aware |
| [music-abc](./music-abc.md) | ` ```music-abc ` | supported | ABC notation rendering and playback |
| [math](./math.md) | `$…$`, `$$…$$` | supported | KaTeX inline and display math |
| [meta-slots](./meta-slots.md) | `::meta-*` | conditional | Article content injected into page slots |
| [reading-time](./reading-time.md) | frontmatter | supported | Injected reading time |
| [patches](./patches.md) | consumer patches | conditional | Rendering behaviors that depend on consumer-owned patches |

The Layer configures the whole Markdown pipeline; consumer projects must not re-register these plugins. See [content guide](../../guides/content.md).
