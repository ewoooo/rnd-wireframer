// [KIKI-SHIM] 임시 — kiki가 라이브러리 빌드를 제공하면 이 파일 전체 삭제. (제거 가이드: packages/external/KIKI-SHIM.md)
// kiki(@cx/external) 이미지 import 전용 Turbopack 로더.
//
// kiki는 Vite 기반이라 `import x from './x.png'` 가 string URL 을 돌려준다고 가정하고
// 컴포넌트들이 전부 `<img src={x} />` 로 쓴다. 반면 Next/Turbopack 기본 동작은 이미지를
// 디코드해 StaticImageData 로 만든다 — (1) kiki의 string 기대와 어긋나고,
// (2) 일부 kiki PNG는 IDAT CRC가 어긋난 파일이라 엄격한 Turbopack 디코더가 빌드 자체를 깨뜨린다.
// (images.disableStaticImages 로는 Turbopack 디코드가 안 막힘.)
//
// 그래서 이 로더가 이미지 import 를 가로채 "디코드 없이" base64 data URI 문자열로 내보낸다.
// → 디코더 우회(손상 PNG도 안전) + string 타입(kiki 컴포넌트와 호환) + 이미지도 실제로 보임.
const MIME = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	svg: "image/svg+xml",
	webp: "image/webp",
	gif: "image/gif",
};

module.exports = function kikiImageUrlLoader(content) {
	const ext = this.resourcePath.split(".").pop().toLowerCase();
	const mime = MIME[ext] || "application/octet-stream";
	const dataUri = `data:${mime};base64,${content.toString("base64")}`;
	return `export default ${JSON.stringify(dataUri)};`;
};

// content 를 Buffer 로 받기 위해 raw 로더로 동작
module.exports.raw = true;
