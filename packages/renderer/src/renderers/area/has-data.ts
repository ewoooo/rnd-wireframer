/**
 * Mock 환경에서 area의 데이터 유무를 결정한다.
 *
 * 목업 단계 단순 모델 — 영역 ID별 boolean. 진짜 API/policy/state 추적은 별도.
 *
 * 데이터 컨텍스트 규약:
 *   data.__areaData__ = {
 *     "AREA_ID_1": { hasData: true },
 *     "AREA_ID_2": { hasData: false },
 *   }
 *
 * 미지정 영역은 default true (회귀 없음).
 */

export function resolveHasData(
	data: Record<string, unknown>,
	areaId: string,
): boolean {
	const areaData = data.__areaData__;
	if (!areaData || typeof areaData !== "object") return true;
	const entry = (areaData as Record<string, unknown>)[areaId];
	if (!entry || typeof entry !== "object") return true;
	const flag = (entry as { hasData?: unknown }).hasData;
	if (typeof flag === "boolean") return flag;
	return true;
}
