export type ValidationSeverity = "error" | "warning";
export type ValidationLayer = "input-guard" | "system" | "quality";

/**
 * 에러 코드의 단일 진실원.
 * - layer: 어느 검증 층에서 발생하는가 (input-guard=파싱, system=스키마/카탈로그 계약, quality=품질 rule)
 * - severity: 코드 단위로 고정. addIssue가 여기서 조회하므로 호출부에서 덮어쓸 수 없다
 * - owners: 발생 주체. "rule"이면 rules/ 디렉토리의 rule 파일이 발생시킨다 (드리프트 가드가 강제)
 * - docRef: 이 코드가 강제하는 계약의 근거 문서 (생성 단계 skill과의 연결 고리)
 */
export type ValidationCodeMeta = {
	layer: ValidationLayer;
	severity: ValidationSeverity;
	owners: ReadonlyArray<"engine" | "rule">;
	description: string;
	docRef?: string;
};

export const VALIDATION_CODE_REGISTRY = {
	"json-invalid": {
		layer: "input-guard",
		severity: "error",
		owners: ["engine"],
		description: "입력이 유효한 JSON이 아니거나 JSON 객체가 아니다.",
	},
	"schema-invalid": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "산출물이 JSON Schema 계약을 위반했다 (ajv).",
	},
	"required-field-missing": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "필수 필드(type, metadata, required prop, layout ref 등)가 없다.",
	},
	"duplicate-id": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "RenderTree 안에서 metadata.id가 중복됐다.",
	},
	"unknown-component-type": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "렌더러 계약(카탈로그·구조 노드 타입)에 없는 노드 타입이다.",
	},
	"unknown-prop": {
		layer: "system",
		severity: "warning",
		owners: ["engine"],
		description: "카탈로그 prop 계약에 선언되지 않은 prop이다.",
	},
	"invalid-prop-type": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "prop 값이 카탈로그에 선언된 타입과 다르다.",
	},
	"invalid-enum-value": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "enum prop 값이 허용 목록에 없다.",
	},
	"readonly-prop-written": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "aiWritable=false인 prop을 에이전트가 작성했다.",
	},
	"invalid-render-node": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "RenderTree 노드 구조(children 배열, Screen 리전, display, binding 등)가 깨졌다.",
	},
	"invalid-layout-prop": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "layout 노드 prop이 layout 계약을 위반했다.",
	},
	"internal-visible-title": {
		layer: "quality",
		severity: "warning",
		owners: ["engine"],
		description:
			"사용자에게 보이는 metadata.title이 내부 소스 이름(…Section/…Component)처럼 보인다.",
	},
	"list-text-dot-subtext-missing": {
		layer: "quality",
		severity: "error",
		owners: ["engine"],
		description: "ListText dot 행은 subText가 가시 텍스트인데 title만 제공됐다.",
	},
	"source-ref-not-materialized": {
		layer: "quality",
		severity: "warning",
		owners: ["engine", "rule"],
		description:
			"SourceSpec/CompositionPlan의 ref가 생성 산출물 어디에도 보이지 않는다 (누락 의심).",
	},
	"source-prop-mismatch": {
		layer: "quality",
		severity: "error",
		owners: ["rule"],
		description: "RenderTree가 SourceSpec의 원시 prop 값을 변조했다 (원본 보존 위반).",
	},
	"single-section-divider": {
		layer: "quality",
		severity: "error",
		owners: ["rule"],
		description: "Screen.Contents에 섹션이 하나뿐인데 section divider를 과적용했다.",
		docRef: "packages/agent/docs/skills/generate-skills/divider-usage-rules/README.md",
	},
	"state-coverage-missing": {
		layer: "quality",
		severity: "warning",
		owners: ["rule"],
		description:
			"상태가 있는 화면(폼·목록·검색 등)인데 loading/empty/error 등 상태 커버리지가 없다.",
	},
	"unknown-source-ref": {
		layer: "quality",
		severity: "warning",
		owners: ["rule"],
		description: "CompositionPlan의 sourceRef가 SourceSpec에 존재하지 않는다.",
	},
	"unknown-layout-ref": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "layout 패턴 id가 카탈로그에 없거나 노드 target과 맞지 않는다.",
	},
	"layout-ref-outside-candidates": {
		layer: "quality",
		severity: "warning",
		owners: ["engine"],
		description: "layout ref가 선택된 패턴 후보 밖이다.",
	},
	"proposal-source-evidence-missing": {
		layer: "quality",
		severity: "error",
		owners: ["engine"],
		description: "component-proposal의 sourceEvidence가 allowedRefs에 없다.",
	},
	"proposal-nearest-match-unknown": {
		layer: "quality",
		severity: "warning",
		owners: ["engine"],
		description: "component-proposal의 nearestCatalogMatch가 카탈로그 컴포넌트 타입이 아니다.",
	},
	"proposal-limit-exceeded": {
		layer: "quality",
		severity: "error",
		owners: ["engine"],
		description: "component-proposal 개수가 상한을 초과했다.",
	},
	"bottom-cta-state-ungated": {
		layer: "quality",
		severity: "error",
		owners: ["rule"],
		description:
			"Screen.Bottom의 state-variant ActionButton이 display.when 게이팅 없이 항상 렌더된다.",
	},
	"uses-candidate-component": {
		layer: "quality",
		severity: "warning",
		owners: ["engine"],
		description: "stable로 승격되지 않은 candidate 카탈로그 컴포넌트를 사용했다.",
	},
} as const satisfies Record<string, ValidationCodeMeta>;

export type ValidationIssueCode = keyof typeof VALIDATION_CODE_REGISTRY;

export function getValidationCodeMeta(code: ValidationIssueCode): ValidationCodeMeta {
	return VALIDATION_CODE_REGISTRY[code];
}
