import type { ClarityServerConfig } from '../../config/server'

/**
 * 获取服务端专用 Clarity 配置（完整 site/feed/stats 与 feature 路由开关）。
 *
 * 数据来自 Nitro 私有 runtimeConfig，不会进入客户端 bundle；
 * 请只在 server/ 侧调用；客户端渲染读取扁平 app config（useAppConfig()）。
 */
export function useClarityServerConfig(): ClarityServerConfig {
	return useRuntimeConfig().clarity as ClarityServerConfig
}
