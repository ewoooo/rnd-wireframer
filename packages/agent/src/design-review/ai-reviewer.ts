import { componentCatalog, getComponentCatalogTypes } from "@cx/renderer";
import {
	runClaudeQuery,
	type RunClaudeQueryInput,
	type RunClaudeQueryOptions,
	type RunClaudeQueryResult,
} from "../llm";
import { listPatterns } from "../pattern/pattern-store";
import type { DecoratedNodeTree, DecoratedScreenNode } from "../types";
import { DESIGN_REFERENCE_PATHS, REGION_SLOTS } from "./design-review-contracts";
import {
	type DesignReview,
	type DesignReviewOperation,
	designReviewSchema,
} from "./design-review-schema";

/** 테스트·시뮬레이터 주입용 runner. 기본은 `runClaudeQuery`. */
export type AiReviewRunner = (
	input: RunClaudeQueryInput,
	options: RunClaudeQueryOptions,
) => Promise<RunClaudeQueryResult>;

/**
 * Design review AI source.
 *
 * Decorator까지 끝난 풍부한 트리(`DecoratedNodeTree`)를 입력으로 받아
 * AI가 만든 `DesignReviewOperation` 나열을 반환한다. 적용은 기존
 * `applyDesignReview`가 담당. deterministic rules 결과와 합쳐서 사용.
 *
 * 첫 슬라이스 범위:
 *  - chrome 누락 합성 (createComponent → screenRegion=header)
 *  - 화면 CTA 재슬롯 (moveComponent → screenRegion=bottom)
 *
 * Area-level operation (splitArea, mergeAreas 등) 및 prompt cache는
 * 다음 슬라이스에서 추가한다.
 */

export interface AiReviewDesignTreeOptions extends RunClaudeQueryOptions {
	/** 검토 대상 screen ID. 비우면 전체. */
	screenIds?: string[];
	/** 리뷰어 이름 (artifact의 `reviewer` 필드). */
	reviewer?: string;
	/** LLM 호출 runner 교체용. 미지정 시 실제 Claude 호출. */
	runner?: AiReviewRunner;
}

export interface AiReviewDesignTreeResult {
	designReview: DesignReview;
	sessionId?: string;
	warnings: string[];
	skippedOperations: Array<{ index: number; reason: string }>;
}

export async function aiReviewDesignTree(
	decorated: DecoratedNodeTree,
	options: AiReviewDesignTreeOptions = {},
): Promise<AiReviewDesignTreeResult> {
	const targets = pickScreens(decorated, options.screenIds);
	const warnings: string[] = [];

	if (targets.length === 0) {
		return {
			designReview: emptyDesignReview(options.reviewer),
			warnings: ["aiReviewDesignTree: no screens to review"],
			skippedOperations: [],
		};
	}

	const prompt = buildPrompt(decorated, targets);
	const runner: AiReviewRunner = options.runner ?? runClaudeQuery;
	const queryResult = await runner(
		{ prompt, jsonSchema: aiReviewOutputJsonSchema },
		options,
	);

	const { operations, skipped, parseWarnings } = parseStructuredOperations(queryResult.structured);
	warnings.push(...parseWarnings);

	const designReview: DesignReview = designReviewSchema.parse({
		reviewer: options.reviewer ?? "design-review-agent",
		scope: {
			treeStage: "decorated",
			screenIds: targets.map((screen) => screen.id),
		},
		operations,
		warnings,
	});

	return {
		designReview,
		sessionId: queryResult.sessionId,
		warnings,
		skippedOperations: skipped,
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickScreens(
	decorated: DecoratedNodeTree,
	screenIds: string[] | undefined,
): DecoratedScreenNode[] {
	if (!screenIds || screenIds.length === 0) return decorated.screens;
	const allowed = new Set(screenIds);
	return decorated.screens.filter((screen) => allowed.has(screen.id));
}

function emptyDesignReview(reviewer: string | undefined): DesignReview {
	return designReviewSchema.parse({
		reviewer: reviewer ?? "design-review-agent",
		scope: { treeStage: "decorated", screenIds: [] },
		operations: [],
		warnings: [],
	});
}

function parseStructuredOperations(structured: unknown): {
	operations: DesignReviewOperation[];
	skipped: Array<{ index: number; reason: string }>;
	parseWarnings: string[];
} {
	const skipped: Array<{ index: number; reason: string }> = [];
	const parseWarnings: string[] = [];
	const root =
		typeof structured === "string" ? safeJsonParse(structured, parseWarnings) : structured;
	if (!root || typeof root !== "object") {
		parseWarnings.push("aiReviewDesignTree: structured output was not an object");
		return { operations: [], skipped, parseWarnings };
	}
	const rawOps = (root as { operations?: unknown }).operations;
	if (!Array.isArray(rawOps)) {
		parseWarnings.push("aiReviewDesignTree: 'operations' missing or not an array");
		return { operations: [], skipped, parseWarnings };
	}

	const operations: DesignReviewOperation[] = [];
	for (const [index, candidate] of rawOps.entries()) {
		const parsed = safeOperationParse(candidate);
		if (parsed.ok === true) {
			operations.push(parsed.value);
		} else {
			skipped.push({ index, reason: parsed.reason });
		}
	}
	return { operations, skipped, parseWarnings };
}

function safeOperationParse(
	candidate: unknown,
): { ok: true; value: DesignReviewOperation } | { ok: false; reason: string } {
	try {
		const oneOp = designReviewSchema.parse({
			reviewer: "design-review-agent",
			scope: { treeStage: "decorated", screenIds: [] },
			operations: [candidate],
		}).operations[0];
		return { ok: true, value: oneOp };
	} catch (error) {
		return {
			ok: false,
			reason: error instanceof Error ? error.message : String(error),
		};
	}
}

function safeJsonParse(value: string, warnings: string[]): unknown {
	try {
		return JSON.parse(value);
	} catch (error) {
		warnings.push(
			`aiReviewDesignTree: failed to JSON.parse structured output — ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
		return undefined;
	}
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(decorated: DecoratedNodeTree, screens: DecoratedScreenNode[]): string {
	const componentTypes = getComponentCatalogTypes();
	const componentSummaries = componentTypes
		.map((type) => {
			const entry = componentCatalog[type];
			const role = entry.source;
			return `- ${type} (${role})`;
		})
		.join("\n");

	const patternSummaries = listPatterns()
		.map((p) => `- ${p.id} [${p.target}]: ${p.description ?? p.name}`)
		.join("\n");

	const treeJson = JSON.stringify(
		{ screens, areas: decorated.areas, components: decorated.components },
		null,
		2,
	);

	const referencePathsList = DESIGN_REFERENCE_PATHS.map((p) => `  - ${p}`).join("\n");

	return [
		"You are the Design Review AI for a screen generator pipeline.",
		"",
		"You receive a *decorated* tree (Register → Compose → Decorate already complete) and emit",
		"`DesignReviewOperation` items that refine the tree's structure, props, and patterns.",
		"A separate deterministic engine will apply the operations, so produce structurally correct",
		"operations rather than rewriting the tree.",
		"",
		"## First-slice focus",
		"This pass focuses on two recurring gaps in client-import sourced screens:",
		"  1. Chrome missing — `screenRegion=header` has no AppBar/StatusBar.",
		"     Emit `createComponent` inserting an `app-bar` (and `status-bar` if applicable) into header.",
		"  2. Screen CTA buried inside a content organism — components whose type or id implies a",
		"     primary action (e.g. `action-area`, `action-button`, type `action-area`, name contains `다음`,",
		"     `확인`, `완료`, hook action `navigate`) belong to `screenRegion=bottom`.",
		"     Emit `moveComponent` with `to.screenRegion=\"bottom\"`.",
		"",
		"Do nothing for screens that already have chrome and a CTA in the correct slot.",
		"",
		"## Operation kinds",
		"- moveComponent — move a component to another component-destination.",
		"- createComponent — insert a new component (use for chrome synthesis).",
		"- updatePattern — set a pattern reference on screen/region/area/component/composite.",
		"- createNewPattern — propose a new pattern (applyTo optional).",
		"- createComposite — bundle ≥2 components into a composite with a pattern.",
		"- setDisplay — set when/stateRole.",
		"- updateComponentProps — update props (merge or replace).",
		"",
		"## Required per operation",
		"Each operation needs: `id` (unique string), `priority` ∈ {P0,P1,P2,P3}, `rationale` (≥1 char),",
		"`designReferences` (≥1 item with {path, rationale}; path must be one of):",
		referencePathsList,
		"",
		"Optional: `confidence` (0..1).",
		"",
		"## Locations",
		`Region slots: ${REGION_SLOTS.map((s) => `"${s}"`).join(", ")}.`,
		"componentLocation/componentDestination must include at least one of:",
		"areaId, componentId, compositeId, screenRegion (with screenId).",
		"Destinations also allow `placement` ∈ {first,last,before,after,replace} (default `last`).",
		"",
		"## Component catalog (synthesizable types)",
		componentSummaries,
		"",
		"## Pattern store (existing patterns)",
		patternSummaries,
		"",
		"## Decorated tree",
		"```json",
		treeJson,
		"```",
		"",
		"## Examples",
		"",
		"### createComponent — synthesize AppBar into Screen.Header",
		"```json",
		JSON.stringify(
			{
				operation: "createComponent",
				id: "op-create-appbar-screen-x",
				priority: "P1",
				rationale: "Header region empty; page surface requires AppBar.",
				designReferences: [
					{
						path: "docs/design/COMPOSITION_LAYERS.md",
						rationale: "Page screens must expose chrome region.",
					},
				],
				component: {
					id: "appbar-screen-x",
					name: "Screen X AppBar",
					type: "AppBar",
					props: { title: "Screen X", showBack: true },
					pattern: { id: "screen-header-chrome", variant: "default" },
				},
				insertInto: {
					screenId: "screen-x",
					screenRegion: "header",
					placement: "last",
				},
				source: "tree-context",
			},
			null,
			2,
		),
		"```",
		"",
		"### moveComponent — relocate buried screen CTA into Screen.Bottom",
		"```json",
		JSON.stringify(
			{
				operation: "moveComponent",
				id: "op-move-cta-screen-x",
				priority: "P0",
				rationale: "action-area component inside content organism is a screen CTA.",
				designReferences: [
					{
						path: "docs/design/INTERACTION_PATTERNS.md",
						section: "CTA",
						rationale: "Primary actions belong to the screen bottom slot.",
					},
				],
				componentId: "action-area-next",
				from: { areaId: "ogn-x-form", componentId: "action-area-next" },
				to: {
					screenId: "screen-x",
					screenRegion: "bottom",
					placement: "last",
				},
			},
			null,
			2,
		),
		"```",
		"",
		"## Output",
		"Return JSON `{ \"operations\": [...] }`. Each item MUST match the example shape for its",
		"operation kind — include all nested objects (`component`, `insertInto`, `from`, `to`, etc.).",
		"Operations missing required nested objects WILL be rejected.",
		"If nothing needs to change, return `{ \"operations\": [] }`.",
	].join("\n");
}

// ---------------------------------------------------------------------------
// JSON schema for structured output
// ---------------------------------------------------------------------------

/**
 * Permissive output schema — schema validation에서는 operation 분기까지 강제하지 않고
 * 사후에 `designReviewSchema`로 strict-parse한다. Claude가 enum operation 값과
 * 최소 필드만 지키도록 강제.
 */
const aiReviewOutputJsonSchema = {
	type: "object",
	required: ["operations"],
	properties: {
		operations: {
			type: "array",
			items: {
				type: "object",
				required: ["operation", "id", "rationale", "designReferences"],
				properties: {
					operation: {
						type: "string",
						enum: [
							"moveComponent",
							"createComponent",
							"updatePattern",
							"createNewPattern",
							"createComposite",
							"setDisplay",
							"updateComponentProps",
						],
					},
					id: { type: "string", minLength: 1 },
					priority: { type: "string", enum: ["P0", "P1", "P2", "P3"] },
					confidence: { type: "number", minimum: 0, maximum: 1 },
					rationale: { type: "string", minLength: 1 },
					designReferences: {
						type: "array",
						minItems: 1,
						items: {
							type: "object",
							required: ["path", "rationale"],
							properties: {
								path: { type: "string", enum: [...DESIGN_REFERENCE_PATHS] },
								section: { type: "string" },
								rationale: { type: "string", minLength: 1 },
							},
						},
					},
				},
			},
		},
	},
} as const;
