import {
	composeWireframeFromSpec,
	type SpecComponentEntry,
	type SpecOrganismSource,
	type SpecScreenSource,
} from "@cx/wireframe";

const components: SpecComponentEntry[] = [
	{
		code: "list-cell-term-required",
		componentType: "list-cell",
		property: {
			name: "필수 약관 항목",
			description: "회원 가입을 위해 반드시 동의해야 합니다.",
		},
	},
	{
		code: "list-cell-term-optional",
		componentType: "list-cell",
		property: {
			name: "선택 약관 항목",
			description: "혜택과 이벤트 안내를 받을 수 있습니다.",
		},
	},
	{
		code: "accordion-term-detail",
		componentType: "accordion",
		property: {
			name: "약관 전문 보기",
			description: "약관 내용을 펼쳐서 확인합니다.",
		},
	},
	{
		code: "section-message-term-error",
		componentType: "section-message",
		property: {
			name: "약관 조회 오류 안내",
			description: "잠시 후 다시 시도해 주세요.",
			variant: "negative",
		},
	},
];

const organisms: SpecOrganismSource[] = [
	{
		metadata: {
			module: "mbr",
			code: "ogn-mbr-term-list",
			name: "약관 목록 조회",
			type: "organism",
			usage: "section",
		},
		layout: {
			flow: "vertical",
		},
		states: {
			default: {
				visible: ["requiredTerm", "optionalTerm", "termDetail"],
			},
			error: {
				visible: ["errorMessage"],
			},
		},
		children: [
			{
				id: "requiredTerm",
				componentCode: "list-cell-term-required",
				slot: "terms",
				policyCode: "POL-MBR-TERM-001-01",
				events: {
					onChange: {
						action: "setState",
						target: "checkedTerms",
					},
				},
			},
			{
				id: "optionalTerm",
				componentCode: "list-cell-term-optional",
				slot: "terms",
				policyCode: "POL-MBR-TERM-001-02",
			},
			{
				id: "termDetail",
				componentCode: "accordion-term-detail",
				slot: "detail",
			},
			{
				id: "errorMessage",
				componentCode: "section-message-term-error",
				slot: "feedback",
			},
		],
	},
	{
		metadata: {
			module: "mbr",
			code: "ogn-mbr-term-agree",
			name: "약관 동의 CTA",
			type: "organism",
			usage: "section",
		},
		layout: {
			flow: "vertical",
		},
		states: {
			default: {
				visible: ["agreeButton"],
			},
		},
		children: [
			{
				id: "agreeButton",
				componentCode: "button-next",
				slot: "cta",
			},
		],
	},
];

const extendedComponents: SpecComponentEntry[] = [
	...components,
	{
		code: "button-next",
		componentType: "button",
		property: {
			name: "다음",
			description: "약관 동의 후 다음 단계로 이동",
		},
	},
];

const screens: SpecScreenSource[] = [
	{
		module: "mbr",
		screenVariantId: "mbr-join-base",
		metadata: {
			code: "NOVA-MBR-FP-001-0",
			name: "약관 동의",
			description: "회원 가입에 필요한 약관을 확인하고 동의한다.",
			surface: "page",
		},
		organisms: [
			{ order: 1, organismCode: "ogn-mbr-term-list" },
			{ order: 2, organismCode: "ogn-mbr-term-agree" },
		],
	},
	{
		module: "mbr",
		screenVariantId: "mbr-join-e2",
		metadata: {
			code: "NOVA-MBR-FP-001-E2",
			name: "약관 동의-필수 약관 미동의",
			description: "필수 약관 미동의 시 진행 제한 상태를 안내한다.",
			surface: "page",
		},
		organisms: [{ order: 1, organismCode: "ogn-mbr-term-list" }],
	},
];

export const wireframeWorkbenchData = screens.map((screenSource) => {
	const composition = composeWireframeFromSpec({
		screenSource,
		organisms,
		components: extendedComponents,
		author: "plus_x_author_1",
		now: "2026-05-21T00:00:00Z",
	});

	return {
		code: screenSource.metadata.code,
		name: screenSource.metadata.name,
		description: screenSource.metadata.description,
		module: screenSource.module,
		screenVariantId: screenSource.screenVariantId,
		organisms: screenSource.organisms,
		schema: composition.schema,
		warnings: composition.warnings,
	};
});

export const organismCatalog = organisms.map((organism) => ({
	code: organism.metadata.code,
	name: organism.metadata.name,
	usage: organism.metadata.usage ?? "section",
	stateCount: Object.keys(organism.states ?? {}).length,
	componentCount: organism.children?.length ?? 0,
}));
