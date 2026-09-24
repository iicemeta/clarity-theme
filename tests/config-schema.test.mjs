#!/usr/bin/env node
/**
 * clarity.config 校验行为回归（Issue C）
 *
 * 0.1.x 兼容契约：
 *   - 已移除的 legacy 键（如 article.useRandomPermalink）→ 警告 + 忽略，不致命
 *   - 注册表之外的未知键 → 仍然致命（拼写错误保护不放宽）
 *   - defineClarityConfig 与模块内 parseClarityConfig 共用同一契约
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test
import { it as test } from 'node:test'
import { defineClarityConfig } from '../src/config/define.mjs'
import { clarityConfigSchema, legacyConfigKeys, stripLegacyConfigKeys } from '../src/config/schema.mjs'

const validSite = {
	title: 'Legacy Compat Site',
	description: 'verify legacy key handling',
	url: 'https://legacy.example.com/',
	author: { name: 'Tester' },
}

test('legacy 注册表非空且仅含已移除键', () => {
	assert.deepEqual(Object.keys(legacyConfigKeys), ['article.useRandomPermalink'])
})

test('legacy 键被剥离并报告，其余配置保持原值', () => {
	const { config, legacyKeys } = stripLegacyConfigKeys({
		site: validSite,
		article: { useRandomPermalink: true, hidePostPrefix: false },
	})
	assert.deepEqual(legacyKeys, ['article.useRandomPermalink'])
	assert.equal(config.article.hidePostPrefix, false)
	assert.equal('useRandomPermalink' in config.article, false)
	assert.deepEqual(clarityConfigSchema.safeParse(config).error?.issues, undefined)
})

test('未命中 legacy 键时不产生拷贝、不报告', () => {
	const input = { site: validSite }
	const { config, legacyKeys } = stripLegacyConfigKeys(input)
	assert.deepEqual(legacyKeys, [])
	assert.equal(config, input)
})

test('注册表外的未知键仍然致命（strictObject 不放宽）', () => {
	const { config } = stripLegacyConfigKeys({ site: validSite, articel: { typo: true } })
	const result = clarityConfigSchema.safeParse(config)
	assert.equal(result.success, false)
})

test('defineClarityConfig：legacy 键警告后通过校验', () => {
	const warnings = []
	const originalWarn = console.warn
	console.warn = message => warnings.push(String(message))
	try {
		const config = defineClarityConfig({
			site: validSite,
			article: { useRandomPermalink: true },
		})
		assert.equal(config.article.hidePostPrefix, true)
	}
	finally {
		console.warn = originalWarn
	}
	assert.equal(warnings.filter(w => w.includes('useRandomPermalink') && w.includes('0.2.0')).length, 1)
})

test('defineClarityConfig：未知键仍抛出校验错误', () => {
	assert.throws(
		() => defineClarityConfig({ site: validSite, unknowKey: true }),
		/校验失败/,
	)
})
