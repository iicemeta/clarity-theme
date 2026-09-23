# Create a New Clarity Blog

**English** | [简体中文](./new-project.zh-CN.md)

The fastest way to start is the official creator package. It is published separately from the Theme as `create-clarity-theme` and generates an independent Nuxt project — not a fork of this repository.

## Requirements

- Node.js satisfying the Theme engine range (`^22.19 || ^24.11 || >=26`)
- pnpm, npm, or another compatible package manager

## pnpm

```bash
pnpm create clarity-theme@beta my-blog
```

## npm

```bash
npx create-clarity-theme@beta my-blog
```

The `@beta` dist-tag is used while the initial prerelease is the published channel; it becomes the unqualified command once the stable creator release is promoted to `latest`.

The CLI asks for site metadata and your preferred package manager, then generates:

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
2. Replace the welcome article with your own posts under `content/posts/` — see [content](../guides/content.md).
3. Optionally add root `feeds.ts` friend data — see [manual installation](./manual-installation.md).
4. Customize UI defaults, components, and styles — see [customization](../guides/customization.md).

For all CLI options (including `--yes`, `--help`, and `--no-install`), see [`create-clarity-theme/README.md`](../../create-clarity-theme/README.md).

## Deploying

The generated project is a standard Nuxt application; run `pnpm generate` for static output or `pnpm build` for SSR. Keep deployment configuration, redirects, environment variables, and platform settings in your project — the Theme never carries them. Secrets belong only in server-side `runtimeConfig`.
