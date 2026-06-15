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
	// [KIKI-SHIM] 임시 — 아래 turbopack 블록 전체는 kiki 빌드 제공 시 삭제. (제거 가이드: packages/external/KIKI-SHIM.md)
	// kiki(@cx/external) 이미지 import 대응. Next/Turbopack 기본 동작은 이미지를 디코드해
	// StaticImageData로 만드는데 (1) kiki는 Vite 기반이라 string URL을 기대하고 (2) 일부 kiki PNG는
	// IDAT CRC가 깨진 파일이라 디코더가 빌드를 죽인다 (disableStaticImages로도 안 막힘).
	// 아래 로더가 이미지를 디코드 없이 base64 data URI 문자열로 내보낸다. 앱 내 이미지 import는
	// kiki 컴포넌트뿐이라 전역 규칙으로 둬도 안전.
	turbopack: {
		rules: Object.fromEntries(
			["*.png", "*.jpg", "*.jpeg", "*.svg", "*.webp", "*.gif"].map((glob) => [
				glob,
				{ loaders: ["./loaders/kiki-image-url.cjs"], as: "*.js" },
			]),
		),
	},
};

export default nextConfig;
