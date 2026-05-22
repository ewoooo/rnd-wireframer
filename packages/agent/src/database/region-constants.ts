import type { RegionSlot } from "../types";

/**
 * Region slot별 표시 라벨. Materializer 두 곳이 이 표만 참조 (단일 진실원).
 * 새 region 추가 시 이 표만 갱신.
 */
export const REGION_METADATA_TITLE: Record<RegionSlot, string> = {
	header: "고정 상단 영역",
	contents: "스크롤 콘텐츠 영역",
	bottom: "고정 하단 영역",
};

/** wireframe schema의 region type (변경 시 schema.ts와 함께 갱신). */
export const REGION_NODE_TYPE: Record<RegionSlot, string> = {
	header: "Screen.Header",
	contents: "Screen.Contents",
	bottom: "Screen.Bottom",
};
