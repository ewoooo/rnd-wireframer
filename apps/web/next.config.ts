import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: ["@cx/components", "@cx/layout", "@cx/wireframe"],
};

export default nextConfig;
