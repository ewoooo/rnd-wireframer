import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: ["@cx/agent", "@cx/components", "@cx/external", "@cx/layout", "@cx/renderer", "@cx/types"],
};

export default nextConfig;
