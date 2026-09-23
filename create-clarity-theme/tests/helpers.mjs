import { execSync } from 'node:child_process'
/* eslint-disable no-console -- command progress is useful during long E2E runs */
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

export function createWorkDirectory(prefix) {
	return mkdtempSync(join(tmpdir(), prefix))
}

export function run(label, args, cwd) {
	const command = [label, ...args.map(quote)].join(' ')
	console.log(`  $ ${command}`)
	execSync(command, {
		cwd,
		stdio: 'inherit',
		env: {
			...process.env,
			NUXT_TELEMETRY_DISABLED: '1',
			NO_COLOR: '1',
		},
	})
}

export function quote(value) {
	return /[\s"^]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}
