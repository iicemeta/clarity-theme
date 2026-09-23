# create-clarity-theme

Create an independent Nuxt 4 blog that consumes the published
[Clarity Theme](https://www.npmjs.com/package/clarity-theme) Layer.

The current initial prerelease is `0.1.0-beta.3` and is distributed through
the npm `beta` dist-tag:

```bash
npx create-clarity-theme@beta my-blog
```

## Create a new blog

### pnpm

```bash
pnpm create clarity-theme my-blog
```

### npm

```bash
npx create-clarity-theme@beta my-blog
```

Then:

```bash
cd my-blog
pnpm dev
```

The CLI asks only for the project name, site identity, URL, author, language,
and timezone. Every prompt displays its editable default value, and pressing
Enter accepts it. Real terminals use the `@clack/prompts` interface; piped or
CI stdin automatically switches to a simple line-based prompt with the same
defaults and validation.

### Prompt defaults

| Prompt | Default |
| --- | --- |
| Project name | `my-blog` (only asked when the directory argument is omitted) |
| Site title | Humanized project name, for example `my-blog` → `My Blog` |
| Site description | `My personal blog built with Clarity Theme` |
| Site URL | `https://example.com/` |
| Author name | `Your Name` |
| Language | `zh-CN` |
| Timezone | System timezone detected through `Intl.DateTimeFormat().resolvedOptions().timeZone` |
| Site established date | The creation date in the selected timezone |

The timezone priority is:

```text
--timezone option > detected system timezone > UTC fallback
```

`UTC` is a validated IANA fallback and is used only when ICU cannot report a
usable system timezone.

## Options

| Option | Description |
| --- | --- |
| `--title <title>` | Site title |
| `--description <text>` | Site description |
| `--url <url>` | Canonical HTTP(S) site URL |
| `--author <name>` | Author name |
| `--language <tag>` | BCP 47-style language tag |
| `--timezone <zone>` | IANA timezone |
| `--package-manager <name>` | Use `pnpm`, `npm`, or `yarn` |
| `--no-install` | Generate files without installing dependencies |
| `--yes`, `-y` | Use defaults for remaining prompts |
| `--version`, `-v` | Print the CLI version |
| `--help`, `-h` | Show all options |

For example, a fully non-interactive setup:

```bash
pnpm create clarity-theme my-blog --yes --timezone Asia/Tokyo
```

The installer is inferred from `npm_config_user_agent`, so `pnpm create` uses
`pnpm install` and `npx` uses `npm install`. Windows paths are supported and
installation commands never interpolate project metadata into a shell command.

## Generated project

```text
my-blog/
├─ app/app.config.ts
├─ content/posts/welcome.md
├─ scripts/new-blog.mjs
├─ public/favicon.svg
├─ clarity.config.ts
├─ content.config.ts
├─ feeds.ts
├─ nuxt.config.ts
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.json
└─ .gitignore
```

The generated project depends directly on `clarity-theme`, Nuxt, Vue,
vue-router, TypeScript, vue-tsc, Nuxt Content, and Zod. Other Clarity runtime
dependencies remain Theme dependencies. The template contains no upstream
articles, friend links, analytics IDs, deployment settings, domains, or tokens.

## Write articles with new-blog

Generated consumers own their authoring workflow:

```bash
pnpm new-blog
pnpm new-blog "我的新文章"
pnpm new-blog "我的新文章" --yes
```

The command asks for the title (when omitted), category, tags, and layout, then
creates `content/posts/<year>/<slug>.md`. The generated frontmatter matches the
Clarity Content schema:

```yaml
---
title: 我的新文章
date: 2026-09-23 20:23
updated: 2026-09-23 20:23
draft: false
categories:
  - 未分类
tags: []
type: tech
---
```

The article timestamp uses the system timezone (with the same UTC fallback).
An existing filename is never overwritten; `new-blog` appends `-2`, `-3`, and
so on instead.

## Package script boundaries

| Script group | Commands | Owner |
| --- | --- | --- |
| Theme development | `dev`, `build`, `generate`, `lint`, `typecheck`, `verify`, test suites | `clarity-theme` repository |
| Consumer development | `dev`, `dev:host`, `build`, `generate`, `preview`, `typecheck` | Generated consumer |
| Consumer authoring | `new-blog`, `new` | Generated consumer |

`new-blog` is deliberately not part of the Theme Layer. Manual-installation
consumers can create Markdown files directly, or copy the script from the
creator template into their own repository.

## Verification

From the repository root:

```bash
pnpm test:create
pnpm test:create:e2e
pnpm test:create:tarball
```

These commands respectively test CLI behavior, a generated independent
consumer through install/new-blog/typecheck/generate, and the packed npm
tarball through its installed `create-clarity-theme` binary.
