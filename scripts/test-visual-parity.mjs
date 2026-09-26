#!/usr/bin/env node
/**
 * Visual Parity 诊断（非像素门禁）
 *
 * 在 runtime parity 同一矩阵上额外截取 upstream/clarity/diff 三联 PNG，
 * 产出 tests/parity/artifacts/ 下的诊断工件与 pixdiff 比例报告。
 *
 * 截图不要求 pixel-perfect（任务 §16）；本脚本默认始终退出 0——
 * 只有语义层（test:runtime-parity）才是门禁。--gate 时按 --max-ratio
 * 阈值（默认 8%）判失败，用于受控环境的回归观察。
 */
import { relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { runParity } from '../tests/parity/lib/engine.mjs'

const themeDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const fresh = process.argv.includes('--fresh')
const gate = process.argv.includes('--gate')
const maxRatio = Number(process.argv.find(arg => arg.startsWith('--max-ratio='))?.slice('--max-ratio='.length) ?? 8)

console.log('▶ Visual Parity（截图诊断工件；非像素门禁）')
const report = await runParity({ visual: true, fresh })

console.log(`\n======== Visual Parity 诊断 ========`)
for (const stat of report.visual) {
	console.log(`  ${stat.page} ${stat.viewport} ${stat.mode}: pixdiff ${stat.ratio}% (${stat.diffPixels}px)`)
}
console.log(`工件目录：${relative(themeDir, resolve(themeDir, 'tests/parity/artifacts'))}`)

if (gate) {
	const over = report.visual.filter(stat => stat.ratio > maxRatio)
	if (over.length) {
		console.error(`✖ ${over.length} 个组合 pixdiff 超过 ${maxRatio}% 阈值`)
		process.exitCode = 1
	}
	else {
		console.log(`✔ 全部组合 pixdiff ≤ ${maxRatio}%`)
	}
}
else if (report.failures.length) {
	console.error(`ℹ 语义层存在 ${report.failures.length} 项 hard failure（以 test:runtime-parity 为准）；截图仅作诊断`)
}
