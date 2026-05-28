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
	return {
		children: [
			{
				children: [
					screenRegion("Screen.Header", "screen-header"),
					{
						children: [],
						componentVersion: "0.1.0",
						metadata: { id: "screen-contents", title: "Contents" },
						pattern: areaPattern("product-hero-summary"),
						props: {
							layout: { direction: "column" },
							scroll: true,
						},
						type: "Screen.Contents",
					},
					screenRegion("Screen.Bottom", "screen-bottom"),
				],
				componentVersion: "0.1.0",
				metadata: {
					id: agentInput.context.sourceSummary.screenCode,
					title: agentInput.context.sourceSummary.screenName,
				},
				pattern: screenPattern("commerce-detail-screen"),
				type: "Screen",
			},
		],
		metadata: { id: agentInput.context.sourceSummary.screenCode },
		version: agentInput.context.targetArtifact.schemaVersion,
	};
}

function createFakeTableGenerationResult(agentInput: ScreenGenerationAgentInput) {
	const { screenCode, screenName } = agentInput.context.sourceSummary;

	return {
		schemaVersion: agentInput.context.intermediateArtifact.schemaVersion,
		screen: {
			id: screenCode,
			version: "0.1.0",
			metadata: { title: screenName, author: "fake-smoke" },
			screenVariantId: screenCode,
			minRendererVersion: "0.1.0",
			pattern: screenPattern("commerce-detail-screen"),
			screen: {
				type: "screen.page",
				regions: {
					header: tableRegion("Screen.Header", "plain-stack", [
						{ kind: "area", id: `${screenCode}__area0` },
					]),
					contents: tableRegion("Screen.Contents", "subscription-detail-rich-content", [
						{ kind: "area", id: `${screenCode}__area1` },
					]),
					bottom: tableRegion("Screen.Bottom", "commerce-detail-bottom-action", []),
				},
			},
		},
		areas: [
			{
				id: `${screenCode}__area0`,
				version: "0.1.0",
				metadata: { title: "Header area", author: "fake-smoke" },
				pattern: areaPattern("area-app-bar"),
				type: "area.dynamic",
				props: { name: "Header area" },
				children: [{ kind: "component", id: "fake-appbar" }],
			},
			{
				id: `${screenCode}__area1`,
				version: "0.1.0",
				metadata: { title: "Contents area", author: "fake-smoke" },
				pattern: areaPattern("product-hero-summary"),
				type: "area.dynamic",
				props: { name: "Contents area" },
				children: [{ kind: "component", id: "fake-summary" }],
			},
		],
		components: [
			{
				id: "fake-appbar",
				version: "0.1.0",
				metadata: { title: "App bar", author: "fake-smoke" },
				pattern: componentPattern("component-app-bar"),
				type: "AppBar",
				children: [{ component: { type: "AppBar" }, props: { title: screenName } }],
			},
			{
				id: "fake-summary",
				version: "0.1.0",
				metadata: { title: "Summary", author: "fake-smoke" },
				pattern: componentPattern("component-card-summary"),
				type: "CardSummary",
				children: [
					{
						component: { type: "CardSummary" },
						props: { title: "iPhone 16 Pro", subText: "Apple / 스마트폰 / 월 50,000원" },
					},
				],
			},
		],
	};
}

function screenRegion(type: "Screen.Header" | "Screen.Bottom", id: string) {
	return {
		children: [],
		componentVersion: "0.1.0",
		metadata: { id, title: id },
		pattern: type === "Screen.Header" ? areaPattern("area-app-bar") : screenPattern("plain-stack"),
		props: {
			layout: { direction: "column" },
			position: "static",
		},
		type,
	};
}

function screenPattern(targetRef: string) {
	return {
		id: targetRef,
		variant: "default",
	};
}

function areaPattern(targetRef: string) {
	return {
		id: targetRef,
		variant: "default",
	};
}

function componentPattern(targetRef: string) {
	return {
		id: targetRef,
		variant: "default",
	};
}

function tableRegion(
	type: "Screen.Bottom" | "Screen.Contents" | "Screen.Header",
	patternId: string,
	children: Array<{ kind: "area" | "component"; id: string }>,
) {
	return {
		type,
		metadata: { title: type },
		pattern: { id: patternId, variant: "default" },
		children,
	};
}
