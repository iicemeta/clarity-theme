# Repair Phase 3 报告（Runtime / Visual Parity Gate）

> 冻结记录：2026-09-25。目标：把 upstream ↔ clarity 的 Runtime / Visual Parity
> 建立成正式、可持续、可自动运行的门禁。

## 1. Harness Architecture

```text
tests/parity/
├── fixtures/
│   ├── site.mjs                  # 单一数据源：站点身份/UI/友链/critical selectors
│   ├── content/posts/*.md        # 3 篇确定性文章（两 consumer 逐字共享）
│   └── public/favicon.svg        # 确定性静态资源（兼作颜色模式存储预设页）
├── lib/
│   ├── browser.mjs               # 跨平台 Chromium 发现（PARITY_BROWSER → Win/Linux/mac 路径）+ 原生 CDP 客户端
│   ├── page-script.mjs           # 页面加载/稳定条件 + 页面内采集脚本注入
│   ├── compare.mjs               # HARD FAILURE vs DIAGNOSTIC 判定器 + 截图 diff
│   ├── png.mjs                   # 纯 Node PNG 解码/编码/像素 diff（无 zlib 依赖）
│   ├── prepare.mjs               # 从 site.mjs 渲染双 consumer（模板化，禁第二数据源）
│   ├── server.mjs                # generate 产物静态服务（127.0.0.1 随机端口 ×2）
│   └── engine.mjs                # 矩阵编排：prepare → serve → 16 case 采集比较 → 报告
└── artifacts/                    # parity-report.json + *.upstream/.clarity/.diff.png（gitignored）

scripts/test-runtime-parity.mjs   # 语义门禁（失败即 exit 1）
scripts/test-visual-parity.mjs    # 截图诊断工件（默认非门禁，--gate 可选阈值）
```

双 consumer（任务 §7，运行完整 Nuxt 应用而非 src 对 src）：

- **upstream consumer**：blog-v3 @ `f6ea97d` 完整树（git archive）+ fixture 配置覆盖层
  （blog.config.ts / app/app.config.ts / app/feeds.ts / content/ / public/），
  `pnpm install` + `nuxt generate`；
- **clarity consumer**：最小脚手架 + `file:` 安装当前主题（`PARITY_THEME_REF=pack`
  可切 tarball）+ 同一 fixture 数据的 clarity 形态（clarity.config.ts /
  app/app.config.ts / feeds.ts / content/ / public/），同样 generate。
- 上游解析顺序与 source parity 门一致（`PARITY_UPSTREAM_DIR` → 同级 checkout → clone）；
- 构建缓存于 `.parity-cache/`（stamp = 上游 commit + fixture 内容 + 主题 HEAD/脏状态），
  变更自动失效重建。

## 2. Compared Pages

`/`（首页）、`/link?shuffle=false`（友链 + 确定性排序开关）、`/archive`（归档，含
2025/2026 两个年份分组）、`/hello-parity`（文章页，tech 版式：标题/列表/引用/行内码/代码块）。

## 3. Compared Viewports

1440×900（desktop）、390×844（mobile，`Emulation.setDeviceMetricsOverride` mobile 模式）。

## 4. Compared Modes

light、dark。实现：`localStorage['nuxt-color-mode']` 预设（两侧同一 @nuxtjs/color-mode
存储键）+ `Emulation.setEmulatedMedia` 同时模拟 `prefers-color-scheme`；动画经
`prefers-reduced-motion: reduce` + fixture 关闭 excerpt 打字机动画双重稳定。

## 5. Runtime Checks

每 case 的采集在**全部稳定条件满足后**执行：`document.fonts.ready` → 资源时间线
静默（连续 1s 无新增）→ 双 rAF + 300ms 缓冲。

- **Fonts**：`document.fonts` 全量 FontFace（family/loaded/total）。
  HARD：同族字体加载状态两侧不一致（特别覆盖 DOUYINSANSBOLD-GB 的绝对存在与
  loaded —— 两侧一致地因网络受限未加载时记为环境限制 note，不一致才是 parity 失败）。
- **Stylesheets**：关键外部样式表五键（katex / inter / douyin-font-css /
  google-fonts-css / 本地构建产物）存在性 + 非空总量。HARD：任一键单侧缺失。
- **DOM**：`document.body` 深度优先 tag+class 序列（跳过 script/style/noscript/
  template，无文本节点 → 站点身份/随机内容天然排除）。HARD：节点数或任一序列行不一致。
- **Computed styles**：critical selectors（`#blog-root`、`#blog-sidebar`、
  `#blog-aside`、`#content`、`#main-content`、sidebar header/footer、`.feed-group`、
  `.feed-title`、`.feed-list`、`.feed-card`、`.sitenick`、`.archive-title`、
  `.archive-year`、`.archive-group`、`article`、`.text-creative`）× 16 属性
  （font-family/size/weight、line-height、letter-spacing、color、background-color、
  border-top-width/style/color、border-top-left-radius、display、position、
  margin、padding、gap）。归一化（引号/大小写/空色/空格）后逐属性比较。HARD：不一致。
- **Geometry**：同 selectors 的 `getBoundingClientRect` x/y/width/height，
  阈值 **2px**（同机同浏览器下字体度量一致，超阈值即布局漂移）。HARD：超阈值。
- **Resources**：`performance.getEntriesByType('resource')` 清单 —— DIAGNOSTIC
  （两独立构建的哈希文件名必然不同，不判失败，记录差异计数）。

失败输出含 Page / Viewport / Mode / Kind / Selector / Prop / upstream 值 /
clarity 值 / difference 文本（任务 §18 格式），完整 JSON 落盘
`tests/parity/artifacts/parity-report.json`。

## 6. Visual Checks

`test:visual-parity` 在同一矩阵额外产出三联 PNG（upstream / clarity / diff，
差异像素标红、背景灰度化）共 16×3 个文件 + pixdiff 百分比报告。**非像素门禁**：
默认始终 exit 0（§16/§19：截图仅诊断工件，不提交 golden master）；`--gate
--max-ratio=N` 可选阈值门禁。动画冻结注入（见 §23 稳定条件）后实测 pixdiff
峰值 **0.21%**（绝大多数 case ≤0.1%，多数为 0）——残留为亚像素抗锯齿噪声。

关键稳定性机制：文章卡入场渐显使用 scroll-driven `animation-timeline: view()`，
仅置零 duration 无法脱离滚动进度；harness 在页面加载后注入
`animation-timeline: auto !important; animation-*-duration: 0s !important` 强制
所有动画立即到达最终帧。开发期间该问题未处理时 desktop dark 首页 pixdiff 高达
19.86%（入场渐显中间态）——正是门禁需要消化的时序噪声类别。

## 7. CI Integration

- **ci.yml 新增 Layer 4 `runtime-parity` job**（ubuntu-latest，PR/push 均运行）：
  `pnpm test:runtime-parity --fresh`（跳过缓存全量重建）；失败时上传
  parity-report 工件。ubuntu 预装 google-chrome，native CDP 无新增浏览器依赖。
- **parity.yml（新 workflow）**：nightly（UTC 03:00）+ 手动触发，运行
  `pnpm test:visual-parity --fresh` 并始终上传截图/diff 工件（保留 30 天）。
- 分层不变：`test:upstream-parity`（Source）/ `test:consumer`、`test:file-generate`
  （Packaging/Generate）/ `test:runtime-parity`（Browser/Runtime）/
  `test:visual-parity`（Visual diagnostics）；`test:parity` 组合 source+runtime+visual。

## 8. Known Legitimate Differences

- **站点身份/内容文本**：DOM 比较不含文本节点；fixture 两侧数据同源，标题等仅
  用于资源存在性断言。
- **构建哈希资源名**：resources 清单差异为 diagnostic（66 vs 63 等计数差来自
  双入口chunk 拆分差异，属构建产物层面，不影响渲染语义）。
- **友链分组随机排序**：两侧同一上游组件内建 `?shuffle=false` 确定性开关，fixture
  URL 固定携带；无订阅源提醒、卡片浮现延迟（link 哈希决定）均为确定性。
- **Nuxt appConfig 数组合并语义（重要发现）**：consumer app.config 文件与
  clarity-config `updateAppConfig` 注入值合并时**数组执行 concat**（实测
  emojiTail 3+3=6、nav 1+1=2 组）。clarity 的 UI 默认值被设计为与上游
  app.config 默认值一致，因此 fixture 在 clarity 侧不显式写这两个数组键、
  回落默认值；upstream 侧显式写同值。此语义已记录于 fixture 模板注释。
- **上 Nuxt 配置对 `blogConfig.twikoo.preload` 的无条件读取**：fixture 的
  upstream blog.config 必须提供 `twikoo` 键（空 envId，两侧均不渲染评论区）。
- **相对时间文本**：归档/侧栏的"上次更新 X ago"以生成时刻为基准，两个 consumer
  构建时间不同则文本必然不同——文本层不在比较范围；视觉影响仅小文本区域。
- **环境字体 CDN**：字体绝对加载性受网络可达性影响；判定规则见 §5 Fonts。

## 9. Remaining Blind Spots

1. **仅 generate 静态产物**：dev server 模式、SSR node-server 运行时（/api/stats
   动态路径）未纳入 runtime 门禁（Phase 2 的 build/generate 矩阵覆盖构建侧）。
2. **交互态**：hover 展开的 dropdown、搜索弹层、暗色切换按钮点击后的行为、
   移动端抽屉开合等交互后 DOM/几何未比较（当前只测加载稳态）。
3. **图片密集页**：fixture 故意规避了远程图片/`_ipx` 处理链路的视觉稳定性问题；
   真实站点图片布局差异不在此门禁覆盖内。
4. **字体渲染跨平台差异**：geometry 阈值 2px 基于"同机同浏览器"前提；跨 OS 的
   font hinting 差异可能使部分几何对在阈值边缘波动（CI 单 OS 运行语义矩阵，
   视觉矩阵仅诊断不门禁，风险可控）。
5. **pixdiff 阈值**：mobile 首页 ~3% 的残留噪声（动画帧相位）未做归零；若未来
   启用 `--gate` 需先按页面建立分页阈值。
6. **全量矩阵成本**：prepare 双 consumer 全新 install+generate ≈ 4 分钟（有
   stamp 缓存时近零）；nightly 视觉矩阵再叠加一轮采集 ≈ 2 分钟。
