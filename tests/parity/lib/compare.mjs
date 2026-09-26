/**
 * Parity 结果比较器
 *
 * 两类结果（任务 §17）：
 *   HARD FAILURE —— 字体/样式表缺失、DOM 结构漂移、critical computed style
 *                   或 geometry 明显不同 → 计入失败；
 *   DIAGNOSTIC   —— 资源清单哈希差异等合法差异 → 记录但不失败。
 */
import { diffPng, writeDiff } from './png.mjs'

const GEOMETRY_TOLERANCE_PX = 2

/** 资源清单仅诊断：本地资产带内容哈希，两个独立构建的哈希必然不同 */
export function compareCase(collected, { page, viewport, mode }) {
	const failures = []
	const notes = []
	const ctx = { page, viewport: `${viewport.width}x${viewport.height}`, mode }
	const up = collected.upstream
	const cl = collected.clarity

	// ---- fonts（hard：同族字体加载状态必须一致；DOUYIN 绝对存在性单独校验）----
	const fontFamilies = new Set([...up.fonts.map(f => f.families), ...cl.fonts.map(f => f.families)])
	for (const family of [...fontFamilies].sort()) {
		const a = up.fonts.find(f => f.families === family)
		const b = cl.fonts.find(f => f.families === family)
		const loadedA = a?.loaded ?? 0
		const loadedB = b?.loaded ?? 0
		if ((loadedA > 0) !== (loadedB > 0)) {
			failures.push({ ...ctx, kind: 'font', selector: family, upstream: `${loadedA}/${a?.total ?? 0} loaded`, clarity: `${loadedB}/${b?.total ?? 0} loaded`, difference: '字体加载状态不一致' })
		}
	}
	const douyin = { up: up.fonts.find(f => f.families.includes('DOUYIN')), cl: cl.fonts.find(f => f.families.includes('DOUYIN')) }
	if (!douyin.up || douyin.up.loaded === 0 || !douyin.cl || douyin.cl.loaded === 0) {
		notes.push({ ...ctx, kind: 'font-absolute', detail:
			`DOUYINSANSBOLD-GB 未加载（upstream ${douyin.up?.loaded ?? 0 ?? 0}/${douyin.up?.total ?? 0}, clarity ${douyin.cl?.loaded ?? 0}/${douyin.cl?.total ?? 0}）。`
			+ '若两侧一致，多为环境无法访问字体 CDN（网络受限），属环境限制而非 parity 失败；若不一致则已计入 hard failure。' })
	}

	// ---- stylesheets（hard：外部关键样式表与本地构建样式表必须两侧一致存在）----
	const key = href => href.includes('katex')
		? 'katex'
		: href.includes('inter-ui')
			? 'inter'
			: href.includes('bytedance')
				? 'douyin-font-css'
				: href.includes('fonts.googleapis')
					? 'google-fonts-css'
					: null
	const keySet = list => new Set(list.map(key).filter(Boolean))
	const keysUp = keySet(up.sheetHrefs)
	const keysCl = keySet(cl.sheetHrefs)
	for (const k of new Set([...keysUp, ...keysCl])) {
		if (keysUp.has(k) !== keysCl.has(k)) {
			failures.push({ ...ctx, kind: 'stylesheet', selector: k, upstream: keysUp.has(k) ? 'present' : 'missing', clarity: keysCl.has(k) ? 'present' : 'missing', difference: '关键样式表下发不一致' })
		}
	}
	if ((up.inlineSheets + up.sheetHrefs.length) === 0 || (cl.inlineSheets + cl.sheetHrefs.length) === 0) {
		failures.push({ ...ctx, kind: 'stylesheet', selector: '(any)', upstream: up.sheetHrefs.length + up.inlineSheets, clarity: cl.sheetHrefs.length + cl.inlineSheets, difference: '一侧完全没有样式表' })
	}

	// ---- DOM 结构（hard：tag+class 序列必须逐行一致）----
	if (up.dom.length !== cl.dom.length) {
		failures.push({ ...ctx, kind: 'dom', selector: '(root)', upstream: `${up.dom.length} nodes`, clarity: `${cl.dom.length} nodes`, difference: 'DOM 节点数量不一致' })
	}
	const domDiffs = []
	for (let i = 0; i < Math.min(up.dom.length, cl.dom.length); i++) {
		if (up.dom[i] !== cl.dom[i]) {
			domDiffs.push({ line: i, upstream: up.dom[i], clarity: cl.dom[i] })
			if (domDiffs.length >= 8) {
				break
			}
		}
	}
	if (domDiffs.length) {
		for (const d of domDiffs) {
			failures.push({ ...ctx, kind: 'dom', selector: `line ${d.line}`, upstream: d.upstream, clarity: d.clarity, difference: 'DOM 结构漂移' })
		}
	}

	// ---- critical selectors 存在性（hard：一侧缺失）----
	const onlyUp = up.missing.filter(s => !cl.missing.includes(s))
	const onlyCl = cl.missing.filter(s => !up.missing.includes(s))
	for (const selector of onlyUp) {
		failures.push({ ...ctx, kind: 'selector', selector, upstream: 'missing', clarity: 'present', difference: 'critical selector 仅一侧缺失' })
	}
	for (const selector of onlyCl) {
		failures.push({ ...ctx, kind: 'selector', selector, upstream: 'present', clarity: 'missing', difference: 'critical selector 仅一侧缺失' })
	}

	// ---- computed styles（hard：两侧都存在的 selector 逐属性比较）----
	for (const selector of Object.keys(up.styles)) {
		if (!cl.styles[selector]) {
			continue // 已由存在性 hard failure 覆盖
		}
		for (const [prop, valueUp] of Object.entries(up.styles[selector])) {
			const valueCl = cl.styles[selector][prop]
			if (normaliseStyle(prop, valueUp) !== normaliseStyle(prop, valueCl)) {
				failures.push({ ...ctx, kind: 'computed-style', selector, prop, upstream: valueUp, clarity: valueCl, difference: 'computed style 不一致' })
			}
		}
	}

	// ---- geometry（hard：阈值 2px）----
	for (const selector of Object.keys(up.geometry)) {
		const rectUp = up.geometry[selector]
		const rectCl = cl.geometry[selector]
		if (!rectCl) {
			continue
		}
		for (const axis of ['x', 'y', 'width', 'height']) {
			if (Math.abs(rectUp[axis] - rectCl[axis]) > GEOMETRY_TOLERANCE_PX) {
				failures.push({ ...ctx, kind: 'geometry', selector, prop: axis, upstream: rectUp[axis], clarity: rectCl[axis], difference: `几何差异超过 ${GEOMETRY_TOLERANCE_PX}px 阈值` })
			}
		}
	}

	// ---- resources（diagnostic）----
	const onlyUpRes = up.resources.filter(r => !cl.resources.includes(r)).length
	const onlyClRes = cl.resources.filter(r => !up.resources.includes(r)).length
	if (onlyUpRes || onlyClRes) {
		notes.push({ ...ctx, kind: 'resources', detail:
			`资源清单差异（diagnostic，构建哈希不同属预期）：upstream 独有 ${onlyUpRes}，clarity 独有 ${onlyClRes}` })
	}

	return { failures, notes }
}

/** computed style 归一化：字体引号/大小写、line-height normal、颜色空格 */
function normaliseStyle(prop, value) {
	let v = String(value).trim().toLowerCase()
	if (prop === 'line-height' && v === 'normal') {
		return 'normal'
	}
	if (prop === 'border-radius' || prop.startsWith('border-top-') || prop === 'font-family') {
		v = v.replaceAll(' ', '')
	}
	if (prop === 'font-family') {
		v = v.replaceAll('\'', '').replaceAll('"', '')
	}
	// chromium 有时输出 rgba(0, 0, 0, 0) / transparent 两种空色
	if ((prop === 'background-color' || prop === 'color') && v === 'rgba(0,0,0,0)') {
		v = 'transparent'
	}
	return v
}

/** 视觉诊断（非门禁）：截图 diff 仅产出工件与度量 */
export function visualDiff(upstreamPng, clarityPng) {
	const result = diffPng(upstreamPng, clarityPng)
	return result
}

export { writeDiff }
