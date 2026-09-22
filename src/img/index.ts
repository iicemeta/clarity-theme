/**
 * `clarity-theme/img` 类型真源。
 *
 * 类型实现复用 `src/utils/img.ts`（Layer 内部与包导出共享同一份签名），
 * 运行时实现在同目录 index.mjs：Node 原生 TS 剥离不允许
 * node_modules 内的 TS 文件，因此包入口运行时必须是 .mjs。
 */
export * from '../utils/img'
