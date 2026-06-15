import type { CompositionPlanContract } from "./composition-plan";
import type { ScreenIntentContract } from "./screen-intent";
import type { SCHEMA_VERSION } from "./versions";

/**
 * 02-intent-composition 통합 step의 출력. 내부 두 contract는 각자의
 * schemaVersion을 유지한 채 spread되어 기존 context 키(screen-intent,
 * composition-plan)로 내려간다 — 하류 step은 통합 여부를 모른다.
 */
export type IntentCompositionContract = {
	schemaVersion: typeof SCHEMA_VERSION.intentComposition;
	screenIntent: ScreenIntentContract;
	compositionPlan: CompositionPlanContract;
};
