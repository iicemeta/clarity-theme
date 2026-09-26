#!/usr/bin/env node
/**
 * clarity.config 校验行为回归
 *
 * 0.2.0 契约（legacy 兼容层已移除）：
 *   - 0.1.x 的 legacy 键（article.useRandomPermalink）与其它未知键一样致命
 *   - strictObject 拼写保护无例外
 *   - defineClarityConfig 与模块内 parse 共用同一 strict schema
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test
import { it as test } from 'node:test'
import { defineClarityConfig } from '../src/config/define.mjs'
import { clarityConfigSchema } from '../src/config/schema.mjs'

const validSite = {
	title: 'Strict Schema Site',
	description: 'verify strict key handling',
	url: 'https://strict.example.com/',
	author: { name: 'Tester' },
}

test('schema 默认值填充', () => {
	const parsed = clarityConfigSchema.parse({ site: validSite })
	assert.equal(parsed.article.defaultCategory, '未分类')
	assert.equal(parsed.features.atom, true)
})

test('0.2.0 已移除的 legacy 键 useRandomPermalink 致命', () => {
	assert.throws(
		() => defineClarityConfig({ site: validSite, article: { useRandomPermalink: true } }),
		/useRandomPermalink/,
	)
})

test('任意未知键致命（strictObject 拼写保护）', () => {
	assert.throws(
		() => defineClarityConfig({ site: validSite, unknowKey: true }),
		/校验失败/,
	)
	assert.throws(
		() => clarityConfigSchema.parse({ site: validSite, articel: {} }),
		/Unrecognized key/,
	)
})

test('合法配置通过并填充默认值', () => {
	const config = defineClarityConfig({ site: validSite })
	assert.equal(config.article.hidePostPrefix, true)
	assert.equal(config.feed.limit, 50)
})
