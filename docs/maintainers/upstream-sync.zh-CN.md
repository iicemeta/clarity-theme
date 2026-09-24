# 上游同步

[English](./upstream-sync.md) | **简体中文**

当前事实来源：`sync-manifest.json`、`scripts/sync-upstream.mjs`、`tests/sync-upstream.test.mjs` 与 `.github/workflows/sync.yml`。

## 上游与基线

| 项目 | 值 |
| --- | --- |
| 上游项目 | GitHub 上的 `blog-v3`；确切 URL 见 `sync-manifest.json` 的 `upstream.repo` |
| 分支 | `main` |
| 基线 commit | `f6ea97d745517feb52f0c100e89acb36f0adc12f` |
| 上游包版本 | 3.7.2 |
| 记录的 Nuxt 版本 | 4.5.2 |
| 记录的 Content 范围 | `^3.16.0` |
| 记录的同步时间 | 2026-09-21T16:40:00+08:00 |
| 当前漂移 | 运行 `pnpm sync:check`；每周工作流会以 Issue 报告漂移 |

确切的 Git URL 不会在各文档中重复出现，因为主题纯度校验刻意限制了上游标识字符串允许出现的位置。README 与 manifest 是权威的展示/引用位置。

## Manifest 分类

分类优先级为：

```text
exclude > transform > manual > include > unknown
```

### `pathMap`

manifest 中所有 glob 与 `upstream` 块描述的都是**上游**（blog-v3）目录树。
可选的 `pathMap` 对象在引擎读写 Theme 文件时，把上游目录前缀映射到
**本地**目标位置。自 `src/` 源码目录迁移后，Theme 布局与上游不再一致：

| 上游前缀 | 本地前缀 |
| --- | --- |
| `app/` | `src/` |
| `modules/` | `src/modules/` |
| `public/` | `src/public/` |
| `remark-plugins/` | `src/remark-plugins/` |
| `server/` | `src/server/` |
| `shared/` | `src/shared/` |

映射只作用于本地文件系统边界；分类、基线比对、冲突检测与回滚语义仍以
上游路径为准。未声明 `pathMap` 的 manifest 保持恒等映射。

### `include`

当主题副本仍与记录的基线一致时，被认为可以直接同步的路径：

- `app/assets/**`
- `app/components/**`
- `app/composables/**`
- `app/layouts/**`
- `app/middleware/**`
- `app/pages/**`
- `app/plugins/**`
- `app/shiki.config.ts`
- `app/app.vue`
- `app/error.vue`
- `modules/**`
- `remark-plugins/**`
- `server/**`
- `shared/**`
- `public/assets/**`
- `public/fonts/**`

当前大多数已适配的文件与基线不一致，因此未来上游对这些文件的修改会产生冲突，而不是静默覆盖主题的工作。

### `exclude`

上游私有或非主题路径：

- `app/feeds.ts`
- `blog.config.ts`
- `content/**`
- `redirects.json`
- `edgeone.json`
- `scripts/**`
- `.vscode/**`

### `transform`

上游变更时需要人工重新设计的派生文件：

- `app/app.config.ts`
- `nuxt.config.ts`
- `content.config.ts`
- `package.json`
- `pnpm-workspace.yaml`

### `manual`

需要审查的主题自有质量/配置文件：

- `patches/**`
- `tsconfig.json`
- `eslint.config.mjs`
- `stylelint.config.mjs`
- `cspell.json`

### `unknown`

任何未被上面匹配到的变更路径。未知变更会阻止 apply，因此基线不可能静默推进。

## 命令

| 命令 | 行为 |
| --- | --- |
| `pnpm sync:check` | 比较远端分支头与 manifest commit；`--fail-on-update` 在漂移时返回状态 1 |
| `pnpm sync:diff` | 克隆目标 commit，diff 基线到分支头，并打印 include/transform/manual/exclude/unknown 分桶 |
| `pnpm sync:apply` | 要求主题工作树干净，事务式应用安全的 include 操作，校验纯度，然后更新基线 |
| `pnpm sync:verify` | 运行主题纯度校验，并要求 manifest 基线等于远端分支头 |

## Upstream Parity 门禁

`pnpm test:upstream-parity` 通过 `pathMap` 将每个 `include` 文件与 manifest commit 对比，并为每个 Theme 文件强制一种已登记的差异分类：

- `identical`（默认）：EOL 归一化后 byte-identical。
- `mechanical`：上游内容经显式替换（Layer 相对导入路径）后与 Theme 文件完全一致。
- `boundary`：SHA-256 哈希锁定并附书面理由（Layer 基础设施、包边界、配置桥接、类型兼容垫片）。
- `bugfix`：哈希锁定并附上游问题说明（例如 `modules/anti-mirror` 中对异步 `minify` 的误用）。

上游内容解析顺序：`CLARITY_UPSTREAM_DIR` 覆盖 → 仓库同级 `blog-v3-upstream` checkout（本地便捷路径）→ 向临时目录 depth-1 fetch manifest commit（CI / 独立仓库路径；`CLARITY_PARITY_FORCE_CLONE=1` 可跳过本地候选）。诊断信息一律走 stderr，保证 `--list-json` 的 stdout 是纯 JSON。

同步面内任何未登记的 Theme 侧额外文件都会让门禁失败。仅在审查差异后刷新哈希：`node scripts/test-upstream-parity.mjs --update-hashes`。门禁输出包含上游/Theme 基线与 identical、mechanical、boundary、bugfix 计数。

## Apply 与冲突语义

对 include 变更：

- 上游新增文件且本地路径不存在 → 复制。
- 上游新增文件且本地路径已存在 → 冲突；不应用任何操作。
- 本地文件哈希等于基线且上游修改了它 → 快进写入。
- 本地文件与基线不一致 → 冲突；不应用任何操作。
- 上游删除且本地等于基线 → 删除。
- 上游删除且本地不一致/不存在 → 冲突。
- 重命名被建模为旧 include 路径的删除加新路径的写入。

同一次 apply 中的所有操作都有备份；若校验或 manifest commit 失败则回滚。任何冲突都会阻止整次 apply，保留旧基线。transform/manual 文件只被报告。

## 基线语义

manifest 基线只在以下条件全部满足后推进：

1. 不存在未知变更。
2. 不存在 include 冲突。
3. 文件操作成功应用。
4. 主题纯度校验通过。
5. manifest 能够用新 commit 与时间戳重写。

否则之前的 commit 仍然有效。

## 定时工作流

`.github/workflows/sync.yml` 每周 03:00 UTC 或手动运行：

1. 从 `engines.node` 解析主 Node 版本。
2. 从 `packageManager` 安装 pnpm；无需安装依赖。
3. 运行 `pnpm sync:check --fail-on-update`。
4. 复用已打开的 `sync` Issue；否则用 `sync:diff` 详情创建一个。
5. 以明确的上游已变更消息失败。

它绝不会运行 `sync:apply`、commit 或 push。

## 与补丁的关系

主题包不携带任何包管理器 patch。差分博客消费者可能持有用于上游内容兼容的站点级 patch。patch 刻意位于同步 manifest 的主题负载之外，并在[补丁说明](./patches.zh-CN.md)中总结。

## 当前边界缺口

Manifest 现已将 `app/stores/**`、`app/types/**` 与 `app/utils/**` 归入 `include`；parity 门禁还登记了同步面内全部 Theme 侧文件（`src/` 之外的文档、CI、脚本与测试按定义仍属 Theme 自有）。

未来上游对未列出路径的变更会成为 `unknown` 并阻塞 apply——这一保护仍然有意保留。同步面内的新文件必须在 `tests/upstream-parity.manifest.json` 中登记差异分类与理由。
