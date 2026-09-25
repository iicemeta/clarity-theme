/**
 * 页面内采集脚本（经 CDP Runtime.evaluate 注入执行）
 *
 * 稳定条件（全部满足后才采集，避免竞态）：
 *   1. document.fonts.ready（字体加载完成）；
 *   2. 资源时间线静默（连续 1s 无新增 resource entry）；
 *   3. 双 rAF + 300ms 缓冲（水合与布局稳定；动画经 prefers-reduced-motion 关闭）。
 *
 * 采集内容：字体状态、样式表、DOM 结构（tag+class 序列）、
 * critical selectors 的 computed styles 与 geometry、资源清单。
 */

export function collectionScript(selectors, styleProps) {
	const selectorsJson = JSON.stringify(selectors)
	const propsJson = JSON.stringify(styleProps)
	return `(() => new Promise((resolvePage, rejectPage) => {
const SELECTORS = ${selectorsJson}
const STYLE_PROPS = ${propsJson}
const timeout = setTimeout(() => rejectPage(new Error('采集超时')), 30000)

function raf() {
	return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
}

async function settle() {
	await (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
	let last = performance.getEntriesByType('resource').length
	let stable = 0
	while (stable < 2) {
		await new Promise(r => setTimeout(r, 500))
		const now = performance.getEntriesByType('resource').length
		if (now === last) stable++
		else { stable = 0; last = now }
	}
	await raf()
	await new Promise(r => setTimeout(r, 300))
}

function serializeDom(root) {
	const lines = []
	const walk = (el, depth) => {
		for (const node of el.children) {
			const tag = node.tagName.toLowerCase()
			if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'template')
				continue
			const classes = [...node.classList].sort().join('.')
			lines.push(depth + ' ' + tag + (classes ? '.' + classes : ''))
			walk(node, depth + 1)
		}
	}
	walk(root, 0)
	return lines
}

function normaliseFontFamily(value) {
	return value.toLowerCase().replaceAll("'", '').replaceAll('"', '').split(',').map(s => s.trim()).join(',')
}

function collect() {
	const fonts = {}
	for (const face of [...document.fonts]) {
		const key = face.family.replaceAll("'", '')
		fonts[key] ??= { families: key, total: 0, loaded: 0 }
		fonts[key].total++
		if (face.status === 'loaded') fonts[key].loaded++
	}
	const fontList = Object.values(fonts).sort((a, b) => a.families.localeCompare(b.families))

	const sheetHrefs = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href)
	const inlineSheets = [...document.styleSheets].filter(s => !s.href).length

	const dom = serializeDom(document.body)

	const styles = {}
	const geometry = {}
	const missing = []
	for (const selector of SELECTORS) {
		let el = null
		try { el = document.querySelector(selector) } catch { /* 非法选择器视为缺失 */ }
		if (!el) { missing.push(selector); continue }
		const cs = getComputedStyle(el)
		const style = {}
		for (const prop of STYLE_PROPS) {
			let value = cs[prop]
			if (prop === 'font-family') value = normaliseFontFamily(value)
			if (value === '' && (prop === 'letter-spacing')) value = 'normal'
			style[prop] = String(value)
		}
		styles[selector] = style
		const r = el.getBoundingClientRect()
		geometry[selector] = {
			x: Math.round(r.x * 100) / 100,
			y: Math.round(r.y * 100) / 100,
			width: Math.round(r.width * 100) / 100,
			height: Math.round(r.height * 100) / 100,
		}
	}

	const resources = performance.getEntriesByType('resource')
		.map(e => e.name.replace(location.origin, '').split('?')[0])

	return { fonts: fontList, sheetHrefs, inlineSheets, dom, styles, geometry, missing, resources }
}

settle()
	.then(() => collect())
	.then(
		value => { clearTimeout(timeout); resolvePage(value) },
		error => { clearTimeout(timeout); rejectPage(error) },
	)
}))()`
}

/** 页面加载 + 稳定条件封装（颜色模式预设经 localStorage，两侧同一 storage key） */
export async function openPage(browser, { url, viewport, colorMode }) {
	const session = browser.session
	await session.send('Emulation.setDeviceMetricsOverride', {
		width: viewport.width,
		height: viewport.height,
		deviceScaleFactor: 1,
		mobile: viewport.mobile ?? false,
	})
	await session.send('Emulation.setEmulatedMedia', {
		features: [
			{ name: 'prefers-reduced-motion', value: 'reduce' },
			{ name: 'prefers-color-scheme', value: colorMode },
		],
	})
	await session.send('Page.enable')
	// 在同源「无脚本资源」上预设颜色模式存储：导航到 app 页面本身会有旧页面
	// 上下文销毁与新页面 color-mode 初始化的竞态；/favicon.svg 是同源静态
	// 资源，加载完成即稳定，setItem 确定性落地后目标页在 preload 阶段读取。
	const origin = new URL(url).origin
	const waitForPage = prefix => session.evaluate(`(async () => {
		const prefix = ${JSON.stringify(prefix)}
		const deadline = Date.now() + 15000
		while (Date.now() < deadline) {
			if (location.href.startsWith(prefix) && document.readyState === 'complete')
				return 'ok'
			await new Promise(r => setTimeout(r, 50))
		}
		throw new Error('等待页面加载超时: ' + location.href)
	})()`)
	await session.send('Page.navigate', { url: `${origin}/favicon.svg` })
	await waitForPage(`${origin}/favicon.svg`)
	await session.evaluate(`localStorage.setItem('nuxt-color-mode', ${JSON.stringify(colorMode)}); 'ok'`)
	await session.send('Page.navigate', { url })
	await waitForPage(origin + new URL(url).pathname)
	// 冻结动画到终态（任务 §23）：文章卡入场渐显使用 scroll-driven
	// animation-timeline: view()，duration/animation-duration 置零无法脱离
	// 滚动进度，必须同时把 timeline 改回 auto，使所有动画立即到达最终帧。
	await session.evaluate(`(() => {
		const style = document.createElement('style')
		style.textContent = '*, *::before, *::after {'
			+ 'animation-duration: 0s !important;'
			+ 'animation-delay: 0s !important;'
			+ 'animation-timeline: auto !important;'
			+ 'transition-duration: 0s !important;'
			+ 'transition-delay: 0s !important;'
			+ '}'
		document.head.appendChild(style)
		return 'ok'
	})()`)
	await new Promise(resolve => setTimeout(resolve, 400))
}
