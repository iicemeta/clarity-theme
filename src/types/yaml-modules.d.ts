/**
 * YAML 导入类型（与 unplugin-yaml 官方声明一致）。
 *
 * Theme 直接注册 unplugin-yaml/vite 插件而非其 nuxt 模块：后者会向消费项目
 * compilerOptions.types 注入 pnpm 严格布局下无法解析的条目。通配符模块声明
 * 必须位于非模块（script）文件中才能全局生效。
 */
declare module '*.yaml' {
	const value: Record<string, unknown>
	export default value
}

declare module '*.yml' {
	const value: Record<string, unknown>
	export default value
}

declare module '*.yaml?raw' {
	const value: string
	export default value
}

declare module '*.yml?raw' {
	const value: string
	export default value
}
