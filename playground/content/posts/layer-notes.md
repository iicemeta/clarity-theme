---
title: Layer 化说明
description: Theme 不包含任何站点内容，全部内容来自消费项目。
date: 2026-01-02 10:00
updated: 2026-01-03 11:00
categories: [技术]
tags: [layer]
type: tech
---

Clarity Theme 是一个 Nuxt Layer：

1. 站点配置来自 `clarity.config.ts`
2. 内容 Schema 来自 `createClarityContentConfig()`
3. 友链数据来自 `feeds.ts`
4. UI 默认值可被 `app/app.config.ts` 覆盖
