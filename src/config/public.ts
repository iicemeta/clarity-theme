import type { ClarityIntegrationsConfig } from './schema'

/**
 * 客户端可见性约定（详见 docs/guides/configuration.md）：
 * - feed、完整 stats、features 与 site.author.email 等服务端/构建期字段
 *   改由 Nitro 私有 runtimeConfig 提供（config/server.ts），不进入客户端 bundle；
 * - 仅构建期使用的字段（integrations.scripts、article.hidePostPrefix、
 *   article.robotsNotIndex）由模块直接消费，同样不进入 appConfig。
 * 允许进入客户端 bundle 的配置不包含任何密钥（secret 只允许 runtimeConfig）。
 */

/** appConfig 中暴露的 integrations 子集：scripts 仅构建期注入 <head> */
export type ClarityPublicIntegrationsConfig = Omit<ClarityIntegrationsConfig, 'scripts'>
