import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@cx/adapters",
		"@cx/agent",
		"@cx/components",
		"@cx/external",
		"@cx/inference",
		"@cx/layout",
		"@cx/renderer",
		"@cx/schema",
		"@cx/validation",
	],
};

export default nextConfig;
