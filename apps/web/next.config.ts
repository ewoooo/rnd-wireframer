import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@cx/adapters",
		"@cx/components",
		"@cx/layout",
		"@cx/layout-pattern-store",
		"@cx/renderer",
	],
};

export default nextConfig;
