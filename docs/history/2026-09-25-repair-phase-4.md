# Repair Phase 4 报告（治理与遗产收口）

> 冻结记录：2026-09-25。目标：把历史遗产与外围工具收口，使新维护者能够通过
> README + Architecture + Upstream Sync + Parity 文档在几分钟内理解整个项目。

## Documentation

| 文档 | 变更 |
| --- | --- |
| `docs/concepts/architecture.md` / `.zh-CN.md` | **重点重写**。以任务管线为主轴：Upstream → sync-manifest → `src/` → clarity-source-layout → clarity-config → consumer。新增源码分类词表（SOURCE / TRANSFORM / CLARITY-ONLY / LEGACY，指向权威登记表）；新增「构建期生成模块」一节（`<buildDir>/clarity/` 三模块、幂等双写、prerender 内联、缺 version 降级语义）；别名表更新（生成模块、Vite resolveId 重定向契约及其 rolldown 原生 alias 抢占原因）；新增 prerender / client / nitro 语义节与 Legacy 面节；声明 docs/history 为冻结记录。不再把 0.1.0 架构表述为当前设计。 |
| `README.md` / `README.zh-CN.md` | 导航收口：Concepts 行标注管线与四分类；Maintainers 行加入 Testing & Parity、Transform parity、Legacy policy；Release history 行标注 history 为冻结叙事。 |
| `docs/README.md` / `README.zh-CN.md` | Maintainers 表加入 transform-parity 与 legacy-policy 两行；MDC 行从正式导航表移除，改为正文说明（内容创作语料，位于 `docs/_content/mdc/`）。 |
| `docs/guides/content.md` / `.zh-CN.md` | MDC 语料链接更新到新位置，措辞标明"内容创作素材而非主题文档"。 |
| `docs/getting-started/manual-installation.md` / `.zh-CN.md` | （Phase 2 已并入）根 tsconfig 前置条件——本阶段无新变更。 |

## Legacy

- `useClarityConfig()` / `useClaritySite()` / `useClarityArticle()` / `useClaritySiteFeedEntry()`、app-config 的 `clarity` 嵌套键：状态 **deprecated**（LEGACY）。
- `article.useRandomPermalink`：**deprecated**——构建期警告 + 忽略（legacy 注册表）；注册表外未知键仍然致命。
- 新增 `docs/maintainers/legacy-policy.md` / `.zh-CN.md`：0.1.x → legacy、0.2.x → current 的时间线、逐面行为表、四条治理规则（先治理后删除 / 不新增 legacy / 删除属破坏性发布 / 文档提法必须四分类之一）、迁移对照表。
- `useClarityServerConfig()` 明确标注**现行内部通道**（非 legacy、非公共导出），避免误伤。
- 全部 legacy 实现保留在 `src/`（boundary 冻结文件），按"先治理、后删除"原则不提前删除；真正删除属 Phase 5（0.2.0）。

## 关键词分类清点（rg 无 UNKNOWN）

- `useClarityConfig`：architecture（LEGACY 说明）、reference/api（deprecated + 迁移指引）、docs/history（HISTORY）、src 实现（LEGACY 实现面）、parity manifest reason 字段（登记元数据）。
- `useRandomPermalink`：CHANGELOG（HISTORY）、configuration guide（MIGRATION：兼容窗口与 0.2.0 移除）、architecture（LEGACY）、docs/history（HISTORY）、schema/define/clarity-config 实现（LEGACY 实现）、tests 与 consumer 断言（LEGACY 行为的回归锁）。
- `clarity.*` 嵌套键：migration skill config-mapping（MIGRATION：新迁移一律扁平键；LEGACY 注记兼容窗口）、clarity-config 实现（LEGACY 实现）。

## MDC

```text
old location: docs/mdc/**
new location: docs/_content/mdc/**
```

72 个文件逐字保留（git rename）；语料内部相对链接按新深度修正（指向 docs 各节 `../../../`、指向 skills `../../../../`）。正式导航（docs/README）不再把 MDC 语料列为主题文档，改为正文注记；beautifier skill 内三处 `docs/mdc/` 路径引用同步更新为 `docs/_content/mdc/`。

## Skills

- `migrate-blog-v3-to-clarity`：**保持结构**。两处旧 API 更新——① App UI fields 段从 `app.config.clarity.*` 嵌套改为扁平键（现行 API），并加 LEGACY 注记（兼容窗口到 0.2.0，见 legacy-policy）；② `useRandomPremalink` 映射行从"无字段"改为"LEGACY：警告并忽略，0.2.0 移除，删除该键"。
- `article-beautifier`：SKILL.md 顶部加 **Status: OPTIONAL / FROZEN** 标记——内容创作辅助，不是 Clarity runtime 或公共 API 的组成部分，仅修错、不扩张。

## Creator

`create-clarity-theme` 能力冻结：无新增 features / prompts / migration / template。全仓 stale-API 扫描（useClarityConfig / useRandomPermalink / clarity.* 嵌套）在 create-clarity-theme 内零命中，其文档对现行 API 无错误描述，本阶段未改动。

## Temporary audit assets

| 资产 | 分类 | 处置 |
| --- | --- | --- |
| `artifacts/`（0.1.0/0.1.1 era tgz、create tarball） | TEMPORARY | 已从磁盘移除（gitignored 本地产物，未入库；可由 tag 重建） |
| audit-tools/（工作区级，仓库外） | HISTORICAL（审计过程工具） | 不在仓库内，无需处置 |
| parity-lab/（工作区级，仓库外） | HISTORICAL（审计原型） | 正式 harness 已提取进 `tests/parity/`；lab 目录保留于工作区供追溯 |
| 正式 runtime/visual parity harness（`tests/parity/`） | TEST | **保留**，未做任何修改 |

## CI

| 检查 | 结果 |
| --- | --- |
| `pnpm test:upstream-parity` | PASS（identical 103 / mechanical 16 / boundary 10 / bugfix 1，计数不变） |
| `pnpm lint`（eslint + stylelint） | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test:config` | PASS（6/6） |
| `pnpm test:transform-parity` | PASS（6/6） |
| `pnpm test:runtime-parity` | PASS（16/16 矩阵一致） |
| `pnpm test:visual-parity` | PASS（16/16；pixdiff 峰值 0.21%，诊断非门禁） |
| `pnpm test:consumer` | PASS（tarball 边界/exports/type/3 组 generate 断言） |
| `docs:check` | PASS（全绿） |

测试逻辑零改动；所有门禁在文档治理变更后保持绿色。

## Remaining legacy（Phase 5 / 0.2.0 必须做）

1. **删除 legacy composables**：`src/shared/utils/clarity.ts` 的 `useClarityConfig()` 系列，及类型模板/文档中的对应声明。
2. **删除 `clarity` app-config 兼容键**：`clarity-config` 的注入、`AppConfigInput.clarity` 类型、`pickUiOverrides`/`warnSiteLevelAppConfigOverrides` 的 0.1.x 读取分支。
3. **删除 legacy 键注册表**：`src/config/schema.ts` / `schema.mjs` 的 `legacyConfigKeys` 与 `stripLegacyConfigKeys`，define 双轨与模块 parse 的剥离调用，`tests/config-schema.test.mjs` 中对应断言。
4. **迁移脚本收尾**：`create-clarity-theme` / migration skill 移除 legacy 兼容说明，CHANGELOG 记 breaking change 与迁移指引。
5. **同步调整测试**：consumer/file-generate 断言从「legacy 警告出现」翻转为「legacy 输入致命」，属于 0.2.0 破坏性发布的一部分。
6. **择机发布 0.2.0** 并按 publishing 流程走 release checklist。
