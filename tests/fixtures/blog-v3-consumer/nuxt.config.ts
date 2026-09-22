import { mapValues } from 'es-toolkit/object'
import redirectList from './redirects.json'

export default defineNuxtConfig({
	modules: ['./modules/site'],
	routeRules: mapValues(redirectList, to => ({ redirect: { to, statusCode: 308 } })),
	runtimeConfig: {
		apiToken: 'server-only-fixture',
	},
})
