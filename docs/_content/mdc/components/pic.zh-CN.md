# Pic

[English](./pic.md) | **简体中文**

## 用途

富图片：Nuxt Image 处理、可选图注、点击灯箱缩放。

## 基本语法

```mdc
::pic{src="https://example.com/photo.jpg" caption="一段图注"}
::

::pic{src="/img/local.webp" width="600"}
#caption
支持 **Markdown** 的富图注。
::
```

普通 Markdown 图片（`![alt](https://example.com/photo.jpg)`）同样经过图片管线渲染（figure 标记、Nuxt Image srcset），由兼容性用例 `D-image` 验证。需要图注、尺寸控制或缩放选项时才用 `::pic`。

## Props

`UtilImgProps` 加 Pic 自有 props（来源：`src/components/util/Img.vue`、`Pic.vue`）：

| Prop | 类型 / 默认值 | 说明 |
| --- | --- | --- |
| `src` | string，必填 | 图片 URL |
| `alt` | string，默认 `''` | 替代文本 |
| `caption` | string | 纯文本图注；`#caption` 插槽优先 |
| `width` / `height` | string \| number | 固有尺寸提示 |
| `densities` | string | 例如 `"1x,2x"`；小数密度需要消费者图片补丁 |
| `mirror` | `ImgService` | 图片镜像：`baidu` \| `fly` \| `weserv` \| `true` |
| `filter` | string | CSS 滤镜 |
| `zoom` | boolean，默认 `true` | 点击灯箱 |

## 插槽

- `caption` —— 富文本图注；覆盖 `caption` prop

## 支持的取值

本地路径自动加 app base URL 前缀；远程 URL 直通，可选镜像。

## 示例

```md
::pic{src="https://placehold.co/600x300" caption="Pic 图注"}
::
```

## 嵌套

独立块；内部不要嵌套容器。

## 何时使用

需要图注、尺寸或缩放的图片——截图、图表、照片。

## 何时不要使用

每个行内小图；普通 Markdown 语法已经过管线。

## 常见错误

- 忘记 `alt` —— 无障碍受损。
- 给自己可控的图片开启 `mirror`。

## 支持状态

`supported` —— 兼容性用例 `D-image` 验证（Markdown 图片与 Pic）。

## 来源

`src/components/content/Pic.vue`；`src/components/util/Img.vue`；上游语料中使用最多的容器（126 次）。
