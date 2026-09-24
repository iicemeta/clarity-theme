# 重建决策：REPAIR

```text
DECISION:
REPAIR
```

**不是 RECONSTRUCT（从 upstream 重建最小 Layer），不是 RECONSIDER_LAYER（放弃 Layer 改走 init-project + 补丁包）。**
在 REPAIR 的框架内包含一次**有边界的边界层重构**（Phase 1–2，见审计报告 §9），并附一条明确的升级条款（见文末）。

---

## 1. 为什么是 REPAIR：证据链

### 证据 A：Layer 抽象已被证明能达到结构级 parity（排除 情况 C）

受控双 consumer（相同 link.md、相同 feeds 数据集、相同示例文章）对照：

- /link dev SSR 的 DOM 标签序列 LCS diff **逐标签一致**（9 feed-card、2 feed-group、全部类名一致；唯一差异是 emojiTail 的 span 数量，属站点数据）。
- 120 文件同步面 source parity 全绿（103 identical / 16 mechanical 均为编译期擦除的类型导入）。
- 同一台机器、同一 Node/pnpm，upstream 直接运行的渲染与 Layer 消费运行的结构输出无差异。

**结论：blog-v3 的结构与 Layer 化的冲突已被 src/ 布局 + clarity-source-layout + 别名桥解决到"可工作"程度。** 情况 C（Layer 与 blog-v3 结构严重冲突）不成立，无需重新考虑 Layer 本身。

### 证据 B：现存缺陷全部落在边界层，且各自有明确定位的修法（排除"污染扩散"）

维护者体验到的灾难分属两个时代：

1. **0.1.0 的重写式架构（useClarityConfig 嵌套键 + 组件逐个改写）是 /link 崩坏与"样式没保留"的直接来源**——实测该版本 tgz 中 BlogSidebar/FeedCard/link.vue 全部读嵌套 `clarity` 键而上游语义是扁平键。**这条路线已在 `d263d4d`（v0.1.4 fidelity reset）被整体判决并回滚。** 今天的仓库里它是尸体，不是活代码。
2. 当前 master 的四个实证缺陷（见审计报告 §1/§5）全部位于 `nuxt.config.ts` 手工转换面与 `clarity-config` 模块，**同步面（src/ 的 120 个文件）零缺陷**：
   - DOUYIN 字体 link 缺失 → `nuxt.config.ts` 补一行 + transform 面纳入对照清单；
   - MISSING_EXPORT（consumer 缺 version 字段即生产构建失败）→ client 上下文别名失效是既成事实，改为显式契约/校验；
   - file: 安装 generate 静默无页面 → prerender 内联 hack 一族，Phase 2 攻坚；
   - 0.1.x 配置键 fatal → strictObject 降级为 passthrough+warn。

缺陷集中度高、同步面干净——这是"修补可行"的最强信号。RECONSTRUCT 会丢弃 parity manifest、sync 工具、已验证的边界模块和整套分层测试（这些恰是项目里最贵、最正确的资产），换来的只是重新引入一遍同样要解的边界问题。

### 证据 C：项目的自我修正机制是有效的（历史证明）

从 0.1.0（重写）到 0.1.4（忠实提取）的转向，加上 parity gate 的建立，说明这个仓库具备"发现方向错误后整体纠偏并上锁"的能力。本次审计确认纠偏后的架构是对的——现在需要的是把纠偏进行到边界层和生产管线，而不是再转一次向。

### 证据 D：投入产出对比

| 路线 | 丢弃什么 | 解决四个缺陷吗 | 风险 |
| --- | --- | --- | --- |
| **REPAIR**（选定） | 无 | 是（逐项有修法） | prerender 静默失败根因未完全定位——由升级条款兜底 |
| RECONSTRUCT | parity 体系、sync 工具、边界模块、测试三层、creator 兼容 | 是（但会重新发明） | 重建期同步面再次开放漂移；0.1.0 教训重演概率不低 |
| RECONSIDER_LAYER | 全部复用性 | 否（字体/配置类问题换形态存在） | 回到 sync-fork 灾难，违背项目立项动机 |

---

## 2. 升级条款（何时推翻本决策）

若 Phase 2 结束时满足**任一**条件：

1. file: 安装形态的 generate 在任一平台仍无法产出完整预渲染页面，且根因被证明在 Nuxt/Nitro 上游而非 clarity 边界层；
2. 为维持 parity 需要的边界 hack 总量继续增长（`clarity-config` 突破 ~800 行或出现第 4 个构建上下文特判）；
3. upstream blog-v3 的目录/别名约定发生结构性变更，同步面改写从"机械"退化为"语义"。

则触发 **RECONSTRUCT**：以当前 parity manifest 为蓝本，从 f6ea97d（或新基线）重建最小 Layer——届时本审计报告 §8 的最小架构图即为重建规格。在上述条件未满足前，不允许以"代码看着乱"为由触发重建。

---

## 3. 决策附带的硬性要求（REPAIR 的护栏）

1. **同步面冻结**：src/ 120 文件的字节级 parity 是本项目的宪法；任何修改必须走 manifest 登记（mechanical/boundary/bugfix），CI 门禁不得放松。
2. **transform 面纳入管控**：`nuxt.config.ts` 与 upstream nuxt.config 的 head.link/modules/css 逐项建立对照表并纳入文档治理——字体丢失这类事故必须再有即红。
3. **事故层门禁**：Phase 3 落地双 consumer computed-style 对照后，方可宣告"visual parity 有保障"；在此之前对外话术保持"结构 parity 已验证，视觉 parity 在建"。
4. **0.1.0 遗产清退**：`useClarityConfig` 兼容层、`clarity` 嵌套键注入、migration skill 旧映射，统一标记 deprecated 并给出 sunset（建议 0.2.0 移除），避免第三代维护者再次迷失于双 API。
5. **生成物出包**：`src/generated/` 的构建期写入必须迁移出 node_modules（buildDir 或 consumer 侧），消除 pnpm 硬链接穿透 store 的跨项目污染面。

---

## 4. 一句话回答维护者的七个问题

| 问题 | 回答 |
| --- | --- |
| Clarity Theme 现在到底是什么？ | blog-v3 的忠实 Layer 提取：同步面字节级对齐上游，站点数据经 clarity.config 注入为上游形状，0.1.0 的"重写式主题"已废弃但兼容层还在。 |
| 哪些是真正核心？ | src/ 同步面 + parity manifest/gate + sync 工具 + clarity-source-layout/clarity-config 两个边界模块 + 双 consumer 测试。其余（mdc 语料、skills、creator 功能化）是外围。 |
| 为什么 /link 和 upstream 不一样？ | 你体验到的崩坏是 0.1.0 重写式架构的形状错配，已被 v0.1.4 修复（实测 DOM 逐标签一致）；当前残留差异是 DOUYIN 字体未随 Layer 下发导致的标题字体回退——一行配置的事故。 |
| 当前测试到底在保护什么？ | 保护 source parity（严防组件漂移复发）、打包纯度、同步工具与脚手架；**不保护** runtime/visual parity 与真实 consumer 的生产管线——这正是事故都从盲区来的原因。 |
| 哪些只是历史遗留？ | useClarityConfig 兼容层、clarity 嵌套键、docs/mdc 语料库、migration skill 的旧键引用、audit-tools 时代的 150 个一次性脚本（工作区层面）。 |
| 如果今天重做，最小架构是什么？ | 见审计报告 §8：同步面 + 受控 nuxt.config + 两个边界模块 + parity gate + 一个 playground + 一个真实 consumer 测试，其余皆可后置。 |
| 继续 Layer 还是重新考虑？ | 继续。结构冲突已被证明可解（证据 A）；放弃 Layer 等于回到 sync-fork 立项前的灾难，且解决不了已定位的缺陷类别。 |
