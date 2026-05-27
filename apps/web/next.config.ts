import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@cx/components",
		"@cx/layout",
		"@cx/engine",
	],
};

export default nextConfig;
