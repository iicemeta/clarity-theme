# Chat


## Purpose

Renders a chat transcript. Speaker captions are written as brace lines; the component maps them to caption/body pairs.

## Basic Syntax

```md
::chat
{.}

This is my own message, shown on the right.

{Alex}

This is Alex's reply.

::
```

## Props

None.

## Slots

- `default` — the transcript; blocks whose whole text matches `{…}` become captions, all other blocks become message bodies

## Supported Values

Caption markers (source: `chatRegex` in `Chat.vue`):

- `{.}` — the author themselves (right-aligned)
- `{:}` — a system message
- `{Name}` — the other party

## Examples

```md
::chat
{:}

The service restarted at 03:00.

{Ops}

Why did it restart?
::
```

## Nesting

Message bodies accept Markdown. Upstream nests a `:::div` wrapper inside a message for a long structured reply; keep such nesting rare.

## When to Use

Quoting an actual conversation (support transcripts, AI chats) that the article then discusses.

## When Not to Use

Dialogues you invented for layout, FAQ lists (use Folding), or a handful of one-line exchanges that read fine as quotes.

## Common Mistakes

- Writing the caption inline with the message instead of as its own block.
- Extra spaces inside the braces — the whole block text must match `{…}`.

## Support Status

`supported` — source-verified; not yet covered by a compatibility fixture (see audit gap 3). The component reads slot VNode text in a non-standard way; keep the caption-block convention exactly.

## Source

`src/components/content/Chat.vue`; upstream usage in `content/posts/2024/blog-using-nuxt.md` and the showcase.
