# Create a New Clarity Blog

**English** | [简体中文](./new-project.zh-CN.md)

The fastest way to start is the official creator package. It is published separately from the Theme as `create-clarity-theme` and generates an independent Nuxt project — not a fork of this repository.

## Requirements

- Node.js satisfying the Theme engine range (`^22.19 || ^24.11 || >=26`)
- pnpm, npm, or another compatible package manager

## pnpm

```bash
pnpm create clarity-theme my-blog
```

## npm

```bash
npx create-clarity-theme@latest my-blog
```

The commands resolve the stable creator from the npm `latest` dist-tag. Pin
`@<version>` explicitly, or use the historical `@beta` dist-tag, when you
deliberately need a prerelease creator.

The creator is the source of truth for new-project skeletons, `package.json`,
Nuxt configuration, Clarity configuration, and the minimum tested direct
dependencies. Do not hand-write a `package.json`, guess Nuxt/Vue/Nuxt Content
versions, or assemble a Nuxt skeleton by hand — Agents asked to create a
Clarity blog must run the creator instead. Migrating an existing `blog-v3`
site is a different workflow; see [migration from blog-v3](./migration-from-blog-v3.md).

The CLI asks for site metadata and your preferred package manager. Every prompt
shows its editable default value, and pressing Enter accepts it:

| Prompt | Default |
| --- | --- |
| Project name | `my-blog` |
| Site title | Humanized project name (`my-blog` → `My Blog`) |
| Site description | `My personal blog built with Clarity Theme` |
| Site URL | `https://example.com/` |
| Author name | `Your Name` |
| Language | `zh-CN` |
| Timezone | Detected system timezone, with a `UTC` fallback |
| Site established date | The project creation date in the selected timezone |

The timezone priority is `--timezone` option > detected system timezone >
`UTC`. The CLI then generates:

- a Nuxt consumer project with `extends: ['clarity-theme']`
- `clarity.config.ts` and `content.config.ts` wired to the public Clarity exports
- one generic welcome article under `content/posts/`
- the minimum tested direct dependencies

## Next steps

```bash
cd my-blog
pnpm dev
```

Then:

1. Edit `clarity.config.ts` with your site identity — see [configuration](../guides/configuration.md).
2. Create your first article with `pnpm new-blog "My first post"`, then replace or remove the welcome article — see [content](../guides/content.md).
3. Optionally add root `feeds.ts` friend data — see [manual installation](./manual-installation.md).
4. Customize UI defaults, components, and styles — see [customization](../guides/customization.md).

For all CLI options (including `--yes`, `--help`, and `--no-install`), see [`create-clarity-theme/README.md`](../../create-clarity-theme/README.md).

## Upstream example content

Clarity is extracted from blog-v3 and intentionally keeps a few public
examples from the upstream author in the Layer — the same content the upstream
author's own `init-project` script leaves as a reference. After creation, the
CLI prints an `Upstream example content` notice listing them; the short
version:

| Content | Where it appears | How to change it |
| --- | --- | --- |
| CommGroup widget (QQ group `169994096`, group avatar, `纸网接入点`) | Articles whose frontmatter sets `aside: [comm-group]` | Create `app/components/widget/CommGroup.vue` in your project |
| BlogLog widget (upstream site history, incl. `zhilu.site` / `zhilu.cyou`) | Sidebar of non-article / 404 pages | Create `app/components/widget/BlogLog.vue` with your own history |

The unused `zi:zhilu` icon asset, the internal anti-mirror blacklist, and the
Atom feed `generator` URI that credits blog-v3 need no action — they are not
rendered as your site content.

## Updating the Theme

The generated `package.json` declares a caret range (for example `^0.1.3`).
Under npm node-semver that means `>=0.1.3 <0.2.0`: later `0.1.x` patch releases
are accepted, `0.2.0` is not, and the range is not an exact pin. The lockfile
records the resolved version actually installed, which may stay on an older
in-range patch until you request an update — `pnpm install` alone does not
refresh it:

```bash
pnpm update clarity-theme          # refresh the resolved version within the declared range
pnpm add clarity-theme@<version>   # explicitly change the declared dependency range
```

Never hand-edit `pnpm-lock.yaml`.

## Deploying

The generated project is a standard Nuxt application; run `pnpm generate` for static output or `pnpm build` for SSR. Keep deployment configuration, redirects, environment variables, and platform settings in your project — the Theme never carries them. Secrets belong only in server-side `runtimeConfig`.
