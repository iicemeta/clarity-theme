# Clarity Theme Documentation

**English** | [简体中文](./README.zh-CN.md)

This is the entry point for all Clarity Theme documentation. Documents are organized by audience; every user-facing page also has a `*.zh-CN.md` sibling. When documentation disagrees with source code, package manifests, tests, CI, or `sync-manifest.json`, those sources win — see [documentation rules](./maintainers/documentation.md).

## Getting started — for users creating or migrating a blog

| Page | Purpose |
| --- | --- |
| [New project](./getting-started/new-project.md) | Scaffold a blog with the creator CLI |
| [Manual installation](./getting-started/manual-installation.md) | Add the Layer to a Nuxt project by hand |
| [Migration from blog-v3](./getting-started/migration-from-blog-v3.md) | Preserve content, config, redirects, patches, and custom code |

## Guides — for users running a Clarity blog

| Page | Purpose |
| --- | --- |
| [Configuration](./guides/configuration.md) | Field-level `clarity.config.ts` and UI app-config contract |
| [Content](./guides/content.md) | Article collections, frontmatter schema, permalinks, and rendering features |
| [Customization](./guides/customization.md) | UI overrides, components, Shiki, CSS, pages, and server routes |
| [Integrations](./guides/integrations.md) | Twikoo, head scripts, and anti-mirror |

Authoring material (the Markdown/MDC capability audit, syntax guide, and per-component writing references) is content-creation corpus, not Theme documentation. It lives outside the formal navigation at [`docs/_content/mdc/`](./_content/mdc/README.md) and feeds the `article-beautifier` agent skill.

## Reference — for developers integrating with the Theme

| Page | Purpose |
| --- | --- |
| [Public API](./reference/api.md) | Package exports, Layer runtime contracts, and stability model |
| [Routes and outputs](./reference/routes-and-outputs.md) | Public pages, HTTP outputs, and feature flags |
| [Compatibility matrix](./reference/compatibility.md) | Generated verification matrix (do not edit by hand) |

## Concepts — for understanding the design

| Page | Purpose |
| --- | --- |
| [Architecture](./concepts/architecture.md) | Theme/consumer boundary, configuration flow, data flow, and package model |

## Maintainers — for developing and releasing the Theme

| Page | Purpose |
| --- | --- |
| [Development](./maintainers/development.md) | Repository layout, commands, and workflow |
| [Testing](./maintainers/testing.md) | Verification matrix and how to run each layer |
| [Upstream sync](./maintainers/upstream-sync.md) | Baseline manifest, drift handling, and sync commands |
| [Transform parity](./maintainers/transform-parity.md) | The nuxt.config.ts derived-surface registry and its gate |
| [Legacy policy](./maintainers/legacy-policy.md) | 0.1.x compatibility surface: classification, migration, 0.2.0 sunset |
| [Patch strategy](./maintainers/patches.md) | Why consumers own dependency patches |
| [Publishing](./maintainers/publishing.md) | Permanent release process: version, tag, OIDC npm publish, rollback |
| [Release checklist](./maintainers/release-checklist.md) | Version-agnostic release template |
| [Project status](./maintainers/project-status.md) | Current architecture and verification facts |
| [Roadmap](./maintainers/roadmap.md) | Now / Next / Later / Deferred work |
| [Documentation rules](./maintainers/documentation.md) | Documentation governance and placement rules |

## History — frozen records

[docs/history](./history) keeps one-time audits, migration reports, and phase narratives. Historical records are **not authoritative for current behavior**; they may cite old versions and paths that no longer exist. Release history lives in the root [CHANGELOG](../CHANGELOG.md), never in per-version files.