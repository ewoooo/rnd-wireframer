import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@cx/adapters",
		"@cx/agent",
		"@cx/external",
		"@cx/inference",
		"@cx/layout",
		"@cx/renderer",
		"@cx/schema",
		"@cx/tokens",
		"@cx/validation",
	],
};

export default nextConfig;
