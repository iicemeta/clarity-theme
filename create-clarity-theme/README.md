# create-clarity-theme

Create an independent Nuxt 4 blog that consumes the published
[Clarity Theme](https://www.npmjs.com/package/clarity-theme) Layer.

The stable creator is distributed through the npm `latest` dist-tag:

```bash
npx create-clarity-theme@latest my-blog
```

## Create a new blog

### pnpm

```bash
pnpm create clarity-theme my-blog
```

### npm

```bash
npx create-clarity-theme@latest my-blog
```

Then:

```bash
cd my-blog
pnpm dev
```

The generated project is pnpm-based: it ships a `pnpm-workspace.yaml` with
`patchedDependencies` and declares `packageManager: pnpm`. Dependencies are
therefore always installed with **pnpm**, regardless of whether the creator
was launched through `pnpm create` or `npx`. After generating the files, the
CLI asks whether to install dependencies now; declining (or `--no-install`)
leaves a ready project where you run `pnpm install` yourself. If pnpm is not
found, the CLI skips installation and prints setup guidance
(`corepack enable` or https://pnpm.io/installation).

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
| `--package-manager <name>` | Must be `pnpm` (generated projects are pnpm-based) |
| `--no-install` | Skip dependency installation entirely |
| `--install` | Install dependencies without asking |
| `--yes`, `-y` | Use defaults for remaining prompts |
| `--version`, `-v` | Print the CLI version |
| `--help`, `-h` | Show all options |

For example, a fully non-interactive setup:

```bash
pnpm create clarity-theme my-blog --yes --timezone Asia/Tokyo
```

Installation always runs `pnpm install` (a fixed command; project metadata is
never interpolated into a shell command). Windows paths are supported.

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

## Upstream example content

Clarity is extracted from blog-v3 and intentionally keeps a few public
examples from the upstream author in the Layer — the same content the upstream
author's own `init-project` script leaves in place as a reference. After every
successful creation the CLI prints an `Upstream example content` notice that
lists them in detail:

| Content | Where it appears | How to change it |
| --- | --- | --- |
| CommGroup widget (QQ group `169994096`, group avatar, `纸网接入点`) | Articles whose frontmatter sets `aside: [comm-group]` | Create `app/components/widget/CommGroup.vue` in the generated project |
| BlogLog widget (upstream site history, incl. `zhilu.site` / `zhilu.cyou`) | Sidebar of non-article / 404 pages | Create `app/components/widget/BlogLog.vue` with your own history |

The unused `zi:zhilu` icon asset, the internal anti-mirror blacklist, and the
Atom feed `generator` URI that credits blog-v3 need no action — they are not
rendered as site content. The same table is copied into the generated
project's `README.md`.

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
