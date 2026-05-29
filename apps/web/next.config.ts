import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@cx/components",
		"@cx/layout",
		"@cx/layout-pattern-store",
		"@cx/renderer",
		"@cx/table-materializer",
	],
};

export default nextConfig;
