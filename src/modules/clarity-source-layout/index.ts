import type { Nuxt } from '@nuxt/schema'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineNuxtModule, getLayerDirectories } from 'nuxt/kit'

const moduleDir = dirname(fileURLToPath(import.meta.url))
const themeSrcDir = resolve(moduleDir, '../..')
const themePkgDir = resolve(moduleDir, '../../..')

/**
 * Clarity keeps all runtime source under `src/`. These values must only apply
 * to the theme layer; declaring them statically in `nuxt.config.ts` would let
 * c12 merge them into consumers which do not explicitly override them.
 */
export default defineNuxtModule({
	meta: {
		name: 'clarity-source-layout',
	},

	setup(_options, nuxt) {
		const layer = findThemeLayer(nuxt)
		if (!layer) {
			return
		}

		const sourceDir = withTrailingSlash(themeSrcDir)
		const directories = {
			layouts: withTrailingSlash(resolve(themeSrcDir, 'layouts')),
			middleware: withTrailingSlash(resolve(themeSrcDir, 'middleware')),
			modules: withTrailingSlash(resolve(themeSrcDir, 'modules')),
			pages: withTrailingSlash(resolve(themeSrcDir, 'pages')),
			plugins: withTrailingSlash(resolve(themeSrcDir, 'plugins')),
			public: withTrailingSlash(resolve(themeSrcDir, 'public')),
			server: withTrailingSlash(resolve(themeSrcDir, 'server')),
			shared: withTrailingSlash(resolve(themeSrcDir, 'shared')),
		}

		layer.config.srcDir = sourceDir
		layer.config.serverDir = directories.server
		layer.config.dir = {
			...layer.config.dir,
			app: sourceDir,
			modules: directories.modules,
			public: directories.public,
			shared: directories.shared,
		}

		// `getLayerDirectories()` caches a plain metadata object per layer before
		// modules are installed. Nuxt exposes no invalidation API, so update the
		// cached paths in place as well as `layer.config`.
		const cached = getLayerDirectories(nuxt).find(directory => isSamePath(directory.root, themePkgDir))
		if (cached) {
			Object.assign(cached, {
				app: sourceDir,
				appLayouts: directories.layouts,
				appMiddleware: directories.middleware,
				appPages: directories.pages,
				appPlugins: directories.plugins,
				modules: directories.modules,
				public: directories.public,
				server: directories.server,
				shared: directories.shared,
			})
		}
	},
})

function findThemeLayer(nuxt: Nuxt) {
	return nuxt.options._layers.find(layer => isSamePath(layer.config.rootDir ?? layer.cwd, themePkgDir))
}

function isSamePath(left: string, right: string) {
	return left === right || relative(resolve(left), resolve(right)) === ''
}

function withTrailingSlash(path: string) {
	return `${path.replace(/[\\/]$/, '').replaceAll('\\', '/')}/`
}
