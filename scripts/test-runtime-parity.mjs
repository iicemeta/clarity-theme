#!/usr/bin/env node
/**
 * Runtime Parity 门禁（semantic：字体/样式表/DOM/computed style/geometry）
 *
 *   clarity-theme ↔ upstream blog-v3
 *   两个真实 Nuxt consumer（fixture 单一数据源）× 4 页 × 2 视口 × 2 颜色模式
 *
 * Hard failure 即退出非零；截图诊断走 test:visual-parity。
 */
import { relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { runParity } from '../tests/parity/lib/engine.mjs'

const themeDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const fresh = process.argv.includes('--fresh')

console.log('▶ Runtime Parity（upstream ↔ clarity，真实 consumer 矩阵）')
const report = await runParity({ visual: false, fresh })

console.log(`\n======== Runtime Parity 结果 ========`)
if (report.notes.length) {
	for (const note of report.notes) {
		console.log(`ℹ [${note.kind}] ${note.page} ${note.viewport} ${note.mode}: ${note.detail ?? ''}`)
	}
}
if (report.failures.length === 0) {
	console.log('✔ 全部矩阵一致：DOM / 字体 / 样式表 / computed style / geometry 均无漂移')
}
else {
	console.error(`✖ ${report.failures.length} 项 hard failure：`)
	for (const failure of report.failures) {
		console.error(`  ✕ [${failure.kind}] ${failure.page} ${failure.viewport} ${failure.mode}`)
		console.error(`      selector: ${failure.selector}${failure.prop ? `  prop: ${failure.prop}` : ''}`)
		console.error(`      upstream: ${failure.upstream}`)
		console.error(`      clarity : ${failure.clarity}`)
		console.error(`      difference: ${failure.difference}`)
	}
	console.error(`\n完整报告：${relative(themeDir, resolve(themeDir, 'tests/parity/artifacts/parity-report.json'))}`)
	process.exitCode = 1
}
