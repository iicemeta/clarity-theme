/**
 * img 工具运行时实现（JS）。
 * 类型真源在同目录 img.ts（enum 已转为 const 数值对象）。
 * 消费项目通过 `clarity-theme/img` 使用；Node 原生 TS 剥离
 * 不允许 node_modules 内的 TS 文件，因此运行时必须是 .mjs。
 */

// @keep-sorted
const services = {
	baidu: 'https://image.baidu.com/search/down?url=',
	/** https://webp.se/fly/ */
	fly: 'https://fly.webp.se/?url=',
	/** https://wsrv.nl/docs/ */
	weserv: 'https://wsrv.nl/?url=',
}

// https://wsrv.nl/docs/quick-reference.html
export function getWsrvGhAvatar(name = '', options = { size: 92 }) {
	const srcUrl = `github.com/${name}.png?size=${options.size}`
	delete options.size

	const params = new URLSearchParams(srcUrl)
	Object.entries(options).forEach(([key, value]) => params.set(key, value))
	return services.weserv + params.toString()
}

// https://docs.webp.se/public-services/github-avatar/
export function getGithubAvatar(name = '', options = { size: 120 }) {
	return `https://avatars-githubusercontent-webp.webp.se/${name}?s=${options.size}`
}

export const getGithubIcon = (name = '') => getWsrvGhAvatar(name, { size: 32, mask: 'circle' })

export const OicqAvatarSize = {
	Size1080: 0,
	Size40: 1,
	Size40_: 2,
	Size100: 3,
	Size140: 4,
	Size640: 5,
	Size40__: 40,
	Size100_: 100,
	Size640_: 640,
}

// https://users.qzone.qq.com/fcg-bin/cgi_get_portrait.fcg?uins=
export function getOicqAvatar(qq = '', size = OicqAvatarSize.Size140) {
	return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=${size}`
}

export const QgroupAvatarSize = {
	Size640: 0,
	Size100: 100,
	Size640_: 640,
}

export function getOciqGroupAvatar(group = '', size = QgroupAvatarSize.Size100) {
	return `https://p.qlogo.cn/gh/${group}/${group}/${size}/`
}

// https://github.com/microlinkhq/unavatar
// https://docs.webp.se/public-services/unavatar/
export function getFavicon(domain, options) {
	const { provider = 'gstatic', size = 32 } = options || {}
	if (provider === 'gstatic')
		return `https://t0.gstatic.cn/faviconV2?client=SOCIAL&fallback_opts=SIZE&url=http://${domain}&size=${size}`
	return `https://unavatar.webp.se/${provider}/${domain}?w=${size}`
}

export function getImgUrl(src, service) {
	if (!service)
		return src
	if (service === true)
		service = 'fly'
	if (service in services)
		return services[service] + src
	return src
}
