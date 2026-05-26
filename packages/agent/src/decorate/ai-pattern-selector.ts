import {
	type RunClaudeQueryInput,
	type RunClaudeQueryOptions,
	type RunClaudeQueryResult,
	runClaudeQuery,
} from "../llm";
import { listPatterns } from "../pattern/pattern-store";
import type { ComposedAreaNode, ComposedNodeTree, PatternRef } from "../types";

/**
 * AI Pattern Selector.
 *
 * 결정론적 resolver는 priority 시스템 없이 후보 점수만 매긴다. 다중 매칭일 때
 * 최종 선택은 AI가 한다. 첫 슬라이스 범위는 **area 단위 pattern 선택**.
 * Composite/region/screen/variant/route는 deterministic 결과를 유지한다.
 *
 * 출력: areaId → PatternRef 맵. 비어 있는 areaId는 deterministic 결과 유지.
 */

export type AiPatternSelectorRunner = (
	input: RunClaudeQueryInput,
	options: RunClaudeQueryOptions,
) => Promise<RunClaudeQueryResult>;

export interface AiPatternSelectorOptions extends RunClaudeQueryOptions {
	runner?: AiPatternSelectorRunner;
}

export interface AiPatternSelection {
	areaId: string;
	patternId: string;
	variant?: string;
	rationale: string;
}

export interface AiPatternSelectorResult {
	selections: Map<string, PatternRef>;
	skipped: Array<{ index: number; reason: string }>;
	warnings: string[];
	sessionId?: string;
}

export async function aiSelectPatterns(
	composed: ComposedNodeTree,
	options: AiPatternSelectorOptions = {},
): Promise<AiPatternSelectorResult> {
	const areas = composed.areas ?? [];
	const warnings: string[] = [];
	if (areas.length === 0) {
		return { selections: new Map(), skipped: [], warnings: ["no areas to select"] };
	}

	const prompt = buildPrompt(composed, areas);
	const runner = options.runner ?? runClaudeQuery;
	const queryResult = await runner({ prompt, jsonSchema: outputJsonSchema }, options);

	const { selections, skipped, parseWarnings } = parseSelections(queryResult.structured);
	warnings.push(...parseWarnings);

	const selectionsMap = new Map<string, PatternRef>();
	for (const sel of selections) {
		selectionsMap.set(sel.areaId, {
			id: sel.patternId,
			variant: sel.variant ?? "default",
			reasons: [`ai-selector: ${sel.rationale}`],
		});
	}

	return {
		selections: selectionsMap,
		skipped,
		warnings,
		sessionId: queryResult.sessionId,
	};
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseSelections(structured: unknown): {
	selections: AiPatternSelection[];
	skipped: Array<{ index: number; reason: string }>;
	parseWarnings: string[];
} {
	const parseWarnings: string[] = [];
	const skipped: Array<{ index: number; reason: string }> = [];
	const root =
		typeof structured === "string" ? safeJsonParse(structured, parseWarnings) : structured;
	if (!root || typeof root !== "object") {
		parseWarnings.push("aiSelectPatterns: structured output is not an object");
		return { selections: [], skipped, parseWarnings };
	}
	const raw = (root as { selections?: unknown }).selections;
	if (!Array.isArray(raw)) {
		parseWarnings.push("aiSelectPatterns: 'selections' missing or not an array");
		return { selections: [], skipped, parseWarnings };
	}
	const selections: AiPatternSelection[] = [];
	for (const [index, item] of raw.entries()) {
		const parsed = validate(item);
		if (parsed.ok === true) selections.push(parsed.value);
		else skipped.push({ index, reason: parsed.reason });
	}
	return { selections, skipped, parseWarnings };
}

function validate(
	candidate: unknown,
): { ok: true; value: AiPatternSelection } | { ok: false; reason: string } {
	if (!candidate || typeof candidate !== "object") {
		return { ok: false, reason: "selection is not an object" };
	}
	const obj = candidate as Record<string, unknown>;
	const { areaId, patternId, rationale, variant } = obj;
	if (typeof areaId !== "string" || !areaId) return { ok: false, reason: "areaId missing" };
	if (typeof patternId !== "string" || !patternId) {
		return { ok: false, reason: "patternId missing" };
	}
	if (typeof rationale !== "string" || !rationale) {
		return { ok: false, reason: "rationale missing" };
	}
	return {
		ok: true,
		value: {
			areaId,
			patternId,
			variant: typeof variant === "string" ? variant : undefined,
			rationale,
		},
	};
}

function safeJsonParse(value: string, warnings: string[]): unknown {
	try {
		return JSON.parse(value);
	} catch (error) {
		warnings.push(
			`aiSelectPatterns: JSON.parse failed — ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
		return undefined;
	}
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(composed: ComposedNodeTree, areas: ComposedAreaNode[]): string {
	const areaPatterns = listPatterns("area")
		.map((p) => `- ${p.id}: ${p.description ?? p.name}`)
		.join("\n");

	const components = composed.components ?? [];
	const componentTypeById = new Map(components.map((c) => [c.id, c.type ?? "unknown"]));

	const areaSnapshots = areas
		.map((area) => {
			const childTypes = (area.children ?? [])
				.map((c) => componentTypeById.get(c.componentId) ?? "?")
				.join(", ");
			return [
				`  area ${area.id}`,
				`    name: ${area.name ?? ""}`,
				`    description: ${area.description ?? ""}`,
				`    layout: ${area.layout ?? ""}`,
				`    component types: [${childTypes}]`,
			].join("\n");
		})
		.join("\n");

	return [
		"You are the AI Pattern Selector for the Decorator stage.",
		"For each area below, choose the best area-level pattern from the catalog.",
		"Use the area's name, description, layout, and contained component types as signals.",
		"",
		"## Available area patterns",
		areaPatterns,
		"",
		"## Areas",
		areaSnapshots,
		"",
		"## Output",
		'Return JSON: { "selections": [ { areaId, patternId, variant?, rationale } ] }.',
		"Include EVERY area in the selections array. The rationale must be specific to that area.",
		"If no pattern is a good fit, choose the closest with rationale explaining the trade-off.",
	].join("\n");
}

// ---------------------------------------------------------------------------
// JSON schema
// ---------------------------------------------------------------------------

const outputJsonSchema = {
	type: "object",
	required: ["selections"],
	properties: {
		selections: {
			type: "array",
			items: {
				type: "object",
				required: ["areaId", "patternId", "rationale"],
				properties: {
					areaId: { type: "string", minLength: 1 },
					patternId: { type: "string", minLength: 1 },
					variant: { type: "string", minLength: 1 },
					rationale: { type: "string", minLength: 1 },
				},
			},
		},
	},
} as const;
