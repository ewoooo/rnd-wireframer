import type { AgentRunner, AgentRunnerRequest } from "@cx/agent/contract";
import type { ScreenGenerationAgentInput } from "@cx/orchestration/types";

export function createFakeGenerationAgentRunner(input: {
	agentInput: ScreenGenerationAgentInput;
	onRequest: (request: AgentRunnerRequest) => void;
}): AgentRunner {
	return async (request) => {
		input.onRequest(request);

		return {
			payload: {
				renderTree: createFakeRenderTree(input.agentInput),
				tableGenerationResult: createFakeTableGenerationResult(input.agentInput),
			},
			session: {
				mode: request.session?.mode ?? "new",
				sessionId: request.session?.sessionId,
			},
			taskKind: request.taskKind,
		};
	};
}

function createFakeRenderTree(agentInput: ScreenGenerationAgentInput) {
	const { screenCode, screenName } = agentInput.context.sourceSummary;

	return {
		children: [
			{
				children: [
					{
						children: [
							{
								children: [
									{
										componentVersion: "1.0.0",
										metadata: {
											id: "fake-appbar",
											title: `${screenName} 상단 앱 바`,
										},
										layout: "layout.composite.componentAppBar",
										props: {
											showBack: true,
											showLogo: false,
											title: screenName,
										},
										type: "AppBar",
									},
								],
								componentVersion: "1.0.0",
								metadata: { id: `${screenCode}.header-area`, title: "Header area" },
								layout: "layout.area.areaAppBar",
								props: { name: "Header area" },
								type: "area.static",
							},
						],
						componentVersion: "0.1.0",
						metadata: { id: `${screenCode}.header`, title: "Header" },
						layout: "layout.region.plainStack",
						type: "Screen.Header",
					},
					{
						children: [
							{
								children: [
									{
										componentVersion: "1.0.0",
										metadata: {
											id: "fake-list-cell",
											title: "약관 목록 항목",
										},
										layout: "layout.composite.componentListCell",
										props: {
											description: "회원 가입을 위해 반드시 동의가 필요합니다.",
											title: "[필수] 서비스 이용약관 동의",
										},
										type: "list-cell",
									},
								],
								componentVersion: "1.0.0",
								metadata: { id: `${screenCode}.contents-area`, title: "Contents area" },
								layout: "layout.area.accordionList",
								props: { name: "약관 목록 조회" },
								type: "area.static",
							},
						],
						componentVersion: "0.1.0",
						metadata: { id: `${screenCode}.contents`, title: "Contents" },
						type: "Screen.Contents",
					},
					{
						children: [
							{
								children: [
									{
										componentVersion: "1.0.0",
										metadata: {
											id: "fake-action-button",
											title: "다음 CTA",
										},
										layout: "layout.composite.componentActionButton",
										props: {
											fullWidth: true,
											label: "다음",
											variant: "primary",
										},
										type: "ActionButton",
									},
								],
								componentVersion: "1.0.0",
								metadata: { id: `${screenCode}.bottom-area`, title: "Bottom area" },
								layout: "layout.area.productHeroSummary",
								props: { name: "하단 액션" },
								type: "area.dynamic",
							},
						],
						componentVersion: "0.1.0",
						metadata: { id: `${screenCode}.bottom`, title: "Bottom" },
						layout: "layout.region.commerceDetailBottomAction",
						type: "Screen.Bottom",
					},
				],
				componentVersion: "1.0.0",
				metadata: {
					id: screenCode,
					title: screenName,
				},
				layout: "layout.screen.screenShell",
				type: "Screen",
			},
		],
		metadata: { id: screenCode },
		minRendererVersion: "0.1.0",
		theme: { mode: "light" },
		version: agentInput.context.targetArtifact.schemaVersion,
	};
}

function createFakeTableGenerationResult(agentInput: ScreenGenerationAgentInput) {
	const { screenCode, screenName } = agentInput.context.sourceSummary;
	const sourceRefsByRegion = resolveSourceRefsByRegion(agentInput);

	return {
		schemaVersion: agentInput.context.intermediateArtifact.schemaVersion,
		screen: {
			id: screenCode,
			version: "0.1.0",
			metadata: { title: screenName, author: "fake-smoke" },
			screenVariantId: screenCode,
			minRendererVersion: "0.1.0",
			layout: "layout.screen.commerceDetailScreen",
			screen: {
				type: "screen.page",
				regions: {
					header: tableRegion("Screen.Header", "plain-stack", [
						{ kind: "area", id: `${screenCode}__area0` },
					]),
					contents: tableRegion("Screen.Contents", "subscription-detail-rich-content", [
						{ kind: "area", id: `${screenCode}__area1` },
					]),
					bottom: tableRegion("Screen.Bottom", "commerce-detail-bottom-action", [
						{ kind: "area", id: `${screenCode}__area999` },
					]),
				},
			},
		},
		areas: [
			{
				id: `${screenCode}__area0`,
				version: "0.1.0",
				metadata: { title: "Header area", author: "fake-smoke" },
				layout: "layout.area.areaAppBar",
				type: "area.static",
				props: { name: "Header area", sourceRefs: sourceRefsByRegion.header },
				children: [{ kind: "component", id: "fake-appbar" }],
			},
			{
				id: `${screenCode}__area1`,
				version: "0.1.0",
				metadata: { title: "Contents area", author: "fake-smoke" },
				layout: "layout.area.accordionList",
				type: "area.static",
				props: { name: "Contents area", sourceRefs: sourceRefsByRegion.contents },
				children: [{ kind: "component", id: "fake-list-cell" }],
			},
			{
				id: `${screenCode}__area999`,
				version: "0.1.0",
				metadata: { title: "Bottom area", author: "fake-smoke" },
				layout: "layout.area.productHeroSummary",
				type: "area.dynamic",
				props: { name: "Bottom area", sourceRefs: sourceRefsByRegion.bottom },
				children: [{ kind: "component", id: "fake-action-button" }],
			},
		],
		components: [
			{
				id: "fake-appbar",
				version: "0.1.0",
				metadata: { title: "App bar", author: "fake-smoke" },
				layout: "layout.composite.componentAppBar",
				type: "AppBar",
				children: [{ component: { type: "AppBar" }, props: { title: screenName } }],
			},
			{
				id: "fake-list-cell",
				version: "0.1.0",
				metadata: { title: "List cell", author: "fake-smoke" },
				layout: "layout.composite.componentListCell",
				type: "list-cell",
				children: [
					{
						component: { type: "list-cell" },
						props: {
							description: "회원 가입을 위해 반드시 동의가 필요합니다.",
							title: "[필수] 서비스 이용약관 동의",
						},
					},
				],
			},
			{
				id: "fake-action-button",
				version: "0.1.0",
				metadata: { title: "Action button", author: "fake-smoke" },
				layout: "layout.composite.componentActionButton",
				type: "ActionButton",
				children: [
					{
						component: { type: "ActionButton" },
						props: { fullWidth: true, label: "다음", variant: "primary" },
					},
				],
			},
		],
	};
}

function resolveSourceRefsByRegion(agentInput: ScreenGenerationAgentInput): {
	bottom: string[];
	contents: string[];
	header: string[];
} {
	const sections = readCompositionPlanSections(agentInput.context.compositionPlan);

	return {
		bottom: sections
			.filter((section) => section.targetRegion === "bottom")
			.flatMap((section) => section.sourceRefs),
		contents: sections
			.filter((section) => section.targetRegion === "contents")
			.flatMap((section) => section.sourceRefs),
		header: sections
			.filter((section) => section.targetRegion === "header")
			.flatMap((section) => section.sourceRefs),
	};
}

function readCompositionPlanSections(input: unknown): Array<{
	sourceRefs: string[];
	targetRegion: string;
}> {
	if (!input || typeof input !== "object" || !("sections" in input)) return [];
	const sections = (input as { sections?: unknown }).sections;
	if (!Array.isArray(sections)) return [];

	return sections.flatMap((section) => {
		if (!section || typeof section !== "object") return [];
		const candidate = section as { sourceRefs?: unknown; targetRegion?: unknown };
		if (!Array.isArray(candidate.sourceRefs) || typeof candidate.targetRegion !== "string") {
			return [];
		}

		return [
			{
				sourceRefs: candidate.sourceRefs.filter((sourceRef) => typeof sourceRef === "string"),
				targetRegion: candidate.targetRegion,
			},
		];
	});
}

function toLayoutId(target: "area" | "composite" | "region" | "screen", id: string) {
	return `layout.${target}.${id.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase())}`;
}

function tableRegion(
	type: "Screen.Bottom" | "Screen.Contents" | "Screen.Header",
	layoutId: string,
	children: Array<{ kind: "area" | "component"; id: string }>,
) {
	return {
		type,
		metadata: { title: type },
		layout: toLayoutId("region", layoutId),
		children,
	};
}
