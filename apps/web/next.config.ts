import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@cx/adapters",
		"@cx/agent",
		"@cx/components",
		"@cx/inference-nodes",
		"@cx/layout",
		"@cx/layout-pattern-store",
		"@cx/pipeline",
		"@cx/renderer",
		"@cx/schema",
		"@cx/validation",
	],
};

export default nextConfig;
