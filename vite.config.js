import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';

export default defineConfig({
	base: './', // Use relative paths instead of absolute
	plugins: [
		vue({
			template: { transformAssetUrls },
		}),
		quasar(),
	],
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
	},
	define: {
		'process.env': {
			NODE_ENV: JSON.stringify(process.env.NODE_ENV),
			BACKEND_URL: JSON.stringify(
				process.env.BACKEND_URL || 'https://your-app.railway.app'
			),
		},
	},
});
