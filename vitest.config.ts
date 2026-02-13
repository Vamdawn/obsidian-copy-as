import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		include: ["tests/**/*.test.ts"],
		setupFiles: ["./tests/setup.ts"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
});
