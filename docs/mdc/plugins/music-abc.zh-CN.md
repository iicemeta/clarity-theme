# ABC 乐谱

[English](./music-abc.md) | **简体中文**

## 用途

把 ABC 记谱渲染为乐谱，并提供可选播放控件。

## 基本语法

````md
```music-abc
X:1
T:Clarity Test
M:4/4
L:1/8
K:C
CDEF GABc | c'BAG FEDC |
```
````

## 行为

- 经[代码组件映射](./code-component.zh-CN.md)由 `MusicScore.vue`（abcjs）渲染；不要写 `:music-score`。
- 记谱渲染不需要对 sound fonts 的网络访问。
- 只有浏览器支持音频且 `https://paulrosen.github.io/midi-js-soundfonts/` 可达（HEAD 探测）时才出现播放控件；失败会打日志并静默降级为仅记谱。
- 乐谱响应式缩放（`resize` 模式）。

## 何时使用

文章确实要讨论的音乐示例。

## 何时不要使用

ASCII 吉他谱或非 ABC 记谱，或装饰用途——乐谱信息密度很高。

## 常见错误

- 在离线/自托管部署上期待播放——记谱仍会渲染。
- 无效的 ABC 头；abcjs 的错误表现为乐谱损坏，而不是友好提示。

## 支持状态

`supported` —— 兼容性用例 `D-music` 与 `D-music-client` 验证（渲染）；播放按设计受网络条件限制。

## 来源

`src/components/content/MusicScore.vue`；映射于 `nuxt.config.ts`；上游展示页中的用法。
