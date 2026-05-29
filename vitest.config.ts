import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	oxc: {
		jsx: {
			runtime: "automatic",
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "apps/web/src"),
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		include: ["apps/**/*.{test,spec}.{ts,tsx}", "packages/**/*.{test,spec}.{ts,tsx}"],
		setupFiles: ["./vitest.setup.ts"],
	},
});
