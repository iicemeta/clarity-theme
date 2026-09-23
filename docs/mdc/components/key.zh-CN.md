# Key

[English](./key.md) | **简体中文**

## 用途

渲染为 `<kbd>` 的键盘按键，支持修饰键组合与可选的平台适配。

## 基本语法

```md
按 :key{code="K"} 打开搜索。任意平台使用 :key{cmd code="K"}。
```

## Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `text` | string | 覆盖组合后的显示文本 |
| `code` | string | `KeyboardEvent.key` 值，例如 `Escape`、`ArrowUp`、` `（空格） |
| `icon` | boolean | 符号模式；macOS 默认开启 |
| `ctrl` / `shift` / `alt` / `meta` / `win` | boolean | 修饰键开关 |
| `cmd` | boolean | 智能适配：Windows/Linux 用 Ctrl，macOS 用 Cmd（⌘） |
| `prevent` | boolean | 按键匹配时阻止默认行为 |

组件还会发出 `press` 事件并跟踪实时修饰键状态；这些能力面向应用代码，而非 MDC。

## 插槽

- `default` —— 覆盖按键显示文本

## 支持的取值

显示与符号映射（来源：`Key.vue`）覆盖 `Space`、方向键、`Control`、`Delete`、`Escape`、`Meta`、`Alt`、`Backspace`、`Enter`、`Shift`、`Tab`、`Win`。

## 示例

```md
:key{code="A" ctrl shift} · :key{alt shift} · :key{code="Escape" ctrl alt icon}
```

## 嵌套

仅行内。

## 何时使用

操作说明中的真实键盘快捷键。

## 何时不要使用

菜单路径或界面按钮（写成文本或行内代码），或装饰性的按键堆砌。

## 常见错误

- 把 `cmd` 与 `ctrl` 组合使用——`cmd` 已经按平台解析。
- 使用显示名（`Esc`）而不是 `code` 值（`Escape`）却期待图标映射。

## 支持状态

`supported` —— 源码验证；暂无兼容性基准覆盖（见审计缺口 3）。

## 来源

`src/components/content/Key.vue`；上游展示页中的用法。
