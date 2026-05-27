import { componentCatalog, getComponentCatalogTypes } from "@cx/components/catalog";
import {
	type RunClaudeQueryInput,
	type RunClaudeQueryOptions,
	type RunClaudeQueryResult,
	runClaudeQuery,
} from "../llm";
import type {
	ComposedComponentNode,
	ComposedNodeTree,
	ComposedScreenNode,
	NodeHook,
	RegionSlot,
} from "../types";

/**
 * Composer-AI: 화면 의도로부터 누락 component를 합성한다.
 *
 * Decorator가 layout에 짜맞추는 단계이고, 그 입력으로 들어갈 component를 갖춰주는 게
 * Composer의 책임. 표에 명시되지 않았지만 절차상 있어야 하는 chrome(AppBar)과
 * 화면 CTA를 여기서 감지·생성한다.
 *
 * 출력: 원본 ComposedNodeTree에 합성 component가 `components[]`로 추가된 트리.
 *       각 합성 component는 `synthesized: { screenId, region }` 메타를 갖고,
 *       Decorator 단계가 이를 보고 region/area에 배치한다.
 */

export type SynthesizeComposeRunner = (
	input: RunClaudeQueryInput,
	options: RunClaudeQueryOptions,
) => Promise<RunClaudeQueryResult>;

export interface SynthesizeComposeOptions extends RunClaudeQueryOptions {
	runner?: SynthesizeComposeRunner;
	screenIds?: string[];
}

export interface SynthesisProposal {
	screenId: string;
	component: {
		id: string;
		name: string;
		type: string;
		props?: Record<string, unknown>;
		hooks?: NodeHook[];
	};
	region: RegionSlot;
	rationale: string;
}

export interface SynthesizeComposeResult {
	composed: ComposedNodeTree;
	proposals: SynthesisProposal[];
	skipped: Array<{ index: number; reason: string }>;
	warnings: string[];
	sessionId?: string;
}

export async function composeSynthesizeWithAI(
	composed: ComposedNodeTree,
	options: SynthesizeComposeOptions = {},
): Promise<SynthesizeComposeResult> {
	const screens = pickScreens(composed, options.screenIds);
	if (screens.length === 0) {
		return { composed, proposals: [], skipped: [], warnings: ["no screens to synthesize"] };
	}

	const prompt = buildPrompt(composed, screens);
	const runner = options.runner ?? runClaudeQuery;
	const queryResult = await runner({ prompt, jsonSchema: synthesizeOutputJsonSchema }, options);

	const { proposals, skipped, warnings } = parseProposals(queryResult.structured);
	const nextComposed = applyProposals(composed, proposals);

	return {
		composed: nextComposed,
		proposals,
		skipped,
		warnings,
		sessionId: queryResult.sessionId,
	};
}

// ---------------------------------------------------------------------------
// Apply (deterministic)
// ---------------------------------------------------------------------------

function applyProposals(
	composed: ComposedNodeTree,
	proposals: SynthesisProposal[],
): ComposedNodeTree {
	if (proposals.length === 0) return composed;
	const existingIds = new Set((composed.components ?? []).map((c) => c.id));
	const baseOrder = (composed.components ?? []).length;
	const additions: ComposedComponentNode[] = [];

	for (const [index, proposal] of proposals.entries()) {
		if (existingIds.has(proposal.component.id)) continue;
		additions.push({
			id: proposal.component.id,
			name: proposal.component.name,
			order: baseOrder + index + 1,
			type: proposal.component.type,
			props: proposal.component.props ?? {},
			hooks: proposal.component.hooks ?? [],
			synthesized: { screenId: proposal.screenId, region: proposal.region },
		});
		existingIds.add(proposal.component.id);
	}

	if (additions.length === 0) return composed;
	return {
		...composed,
		components: [...(composed.components ?? []), ...additions],
	};
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseProposals(structured: unknown): {
	proposals: SynthesisProposal[];
	skipped: Array<{ index: number; reason: string }>;
	warnings: string[];
} {
	const warnings: string[] = [];
	const skipped: Array<{ index: number; reason: string }> = [];

	const root = typeof structured === "string" ? safeJsonParse(structured, warnings) : structured;
	if (!root || typeof root !== "object") {
		warnings.push("composeSynthesizeWithAI: structured output is not an object");
		return { proposals: [], skipped, warnings };
	}
	const raw = (root as { syntheses?: unknown }).syntheses;
	if (!Array.isArray(raw)) {
		warnings.push("composeSynthesizeWithAI: 'syntheses' missing or not an array");
		return { proposals: [], skipped, warnings };
	}

	const proposals: SynthesisProposal[] = [];
	for (const [index, item] of raw.entries()) {
		const validated = validateProposal(item);
		if (validated.ok === true) proposals.push(validated.value);
		else skipped.push({ index, reason: validated.reason });
	}
	return { proposals, skipped, warnings };
}

function validateProposal(
	candidate: unknown,
): { ok: true; value: SynthesisProposal } | { ok: false; reason: string } {
	if (!candidate || typeof candidate !== "object") {
		return { ok: false, reason: "proposal is not an object" };
	}
	const obj = candidate as Record<string, unknown>;
	const screenId = obj.screenId;
	const region = obj.region;
	const component = obj.component as Record<string, unknown> | undefined;
	const rationale = obj.rationale;

	if (typeof screenId !== "string" || !screenId) return { ok: false, reason: "screenId missing" };
	if (region !== "header" && region !== "contents" && region !== "bottom") {
		return { ok: false, reason: "invalid region" };
	}
	if (!component || typeof component !== "object") {
		return { ok: false, reason: "component missing" };
	}
	const { id, name, type } = component;
	if (typeof id !== "string" || !id) return { ok: false, reason: "component.id missing" };
	if (typeof name !== "string" || !name) return { ok: false, reason: "component.name missing" };
	if (typeof type !== "string" || !type) return { ok: false, reason: "component.type missing" };
	if (typeof rationale !== "string" || !rationale) {
		return { ok: false, reason: "rationale missing" };
	}

	const props = component.props as Record<string, unknown> | undefined;
	const hooks = component.hooks as NodeHook[] | undefined;

	return {
		ok: true,
		value: {
			screenId,
			region,
			component: {
				id,
				name,
				type,
				props: typeof props === "object" && props !== null ? props : undefined,
				hooks: Array.isArray(hooks) ? hooks : undefined,
			},
			rationale,
		},
	};
}

function safeJsonParse(value: string, warnings: string[]): unknown {
	try {
		return JSON.parse(value);
	} catch (error) {
		warnings.push(
			`composeSynthesizeWithAI: JSON.parse failed — ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
		return undefined;
	}
}

function pickScreens(
	composed: ComposedNodeTree,
	screenIds: string[] | undefined,
): ComposedScreenNode[] {
	if (!screenIds || screenIds.length === 0) return composed.screens;
	const allowed = new Set(screenIds);
	return composed.screens.filter((s) => allowed.has(s.id));
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(composed: ComposedNodeTree, screens: ComposedScreenNode[]): string {
	const componentTypes = getComponentCatalogTypes();
	const componentSummaries = componentTypes
		.map((type) => {
			const entry = componentCatalog[type];
			const kind = (entry as { kind?: string }).kind ?? "(no kind)";
			return `- ${type} [kind=${kind}]`;
		})
		.join("\n");

	const variantSequence = summarizeVariantFlow(composed);
	const screenSnapshots = screens
		.map((screen) => serializeScreenForPrompt(screen, composed))
		.join("\n");

	return [
		"You are the Composer Synthesis Agent. Your job is to register components that **should**",
		"exist on each screen even though the client-import markdown didn't enumerate them.",
		"",
		"Pipeline context:",
		"  Register → Compose (this step) → Decorate → DesignReview → Materialize",
		"  Composer registers components; Decorator places them into screen regions.",
		"",
		"## Inference rules",
		"  1. Every page surface screen needs an AppBar in screenRegion=header.",
		'     Use type="AppBar" with props { title, showBack } where showBack=true unless this is',
		"     the first/landing screen.",
		"  2. Procedural screens (one in a variant flow with a next screen, or screen description",
		"     mentions 다음/확인/완료/저장) need a primary CTA Button in screenRegion=bottom.",
		'     Use type="Button" with props { label, variant:"primary", size:"xlarge", fullWidth:true }.',
		'     Add hooks: [{ trigger:"onClick", action:"navigate", target:<next screen id> }] when',
		"     a next screen exists.",
		"  3. Do NOT synthesize a component that already exists for that screen (check the screen's",
		"     existing components in the snapshot below).",
		"  4. Use deterministic ID conventions:",
		'       header AppBar → id = "appbar-<screenId>"',
		'       bottom CTA    → id = "cta-<screenId>"',
		"",
		"## Component catalog (synthesizable types; pick the canonical type, not aliases)",
		componentSummaries,
		"",
		"## Variant flow (for procedural CTA navigation targets)",
		variantSequence,
		"",
		"## Screens",
		screenSnapshots,
		"",
		"## Output",
		'Return JSON: { "syntheses": [ { screenId, region, component: { id, name, type, props, hooks }, rationale } ] }.',
		"Return ONLY synthesized components. If a screen already has everything, omit it.",
	].join("\n");
}

function summarizeVariantFlow(composed: ComposedNodeTree): string {
	const screensByVariant = new Map<string | undefined, ComposedScreenNode[]>();
	for (const screen of composed.screens) {
		const variantId = screen.variantId;
		const list = screensByVariant.get(variantId) ?? [];
		list.push(screen);
		screensByVariant.set(variantId, list);
	}

	const lines: string[] = [];
	for (const variant of composed.variants) {
		const screensInVariant = (screensByVariant.get(variant.id) ?? []).sort(
			(a, b) => (a.order ?? 0) - (b.order ?? 0),
		);
		const ids = screensInVariant.map((s) => s.id).join(" → ");
		lines.push(`- variant ${variant.id} (${variant.name ?? "?"}): ${ids}`);
	}
	if (lines.length === 0) lines.push("- (no variants registered)");
	return lines.join("\n");
}

function serializeScreenForPrompt(screen: ComposedScreenNode, composed: ComposedNodeTree): string {
	const existing: string[] = [];
	const areas = composed.areas ?? [];
	const components = composed.components ?? [];
	const componentById = new Map(components.map((c) => [c.id, c]));

	for (const slot of ["header", "contents", "bottom"] as const) {
		const refs = screen.children[slot] ?? [];
		const refDetails = refs
			.map((ref) => {
				const area = areas.find((a) => a.id === ref.areaId);
				const childTypes = (area?.children ?? [])
					.map((c) => componentById.get(c.componentId)?.type ?? "?")
					.join(",");
				return `${ref.areaId}(${childTypes})`;
			})
			.join(", ");
		existing.push(`    ${slot}: [${refDetails}]`);
	}

	return [
		`  screen ${screen.id}`,
		`    name: ${screen.name ?? "?"}`,
		`    description: ${screen.description ?? "(none)"}`,
		`    screenType: ${screen.screenType ?? "(unknown)"}`,
		...existing,
	].join("\n");
}

// ---------------------------------------------------------------------------
// JSON schema for structured output
// ---------------------------------------------------------------------------

const synthesizeOutputJsonSchema = {
	type: "object",
	required: ["syntheses"],
	properties: {
		syntheses: {
			type: "array",
			items: {
				type: "object",
				required: ["screenId", "region", "component", "rationale"],
				properties: {
					screenId: { type: "string", minLength: 1 },
					region: { type: "string", enum: ["header", "contents", "bottom"] },
					rationale: { type: "string", minLength: 1 },
					component: {
						type: "object",
						required: ["id", "name", "type"],
						properties: {
							id: { type: "string", minLength: 1 },
							name: { type: "string", minLength: 1 },
							type: { type: "string", minLength: 1 },
							props: { type: "object" },
							hooks: {
								type: "array",
								items: {
									type: "object",
									required: ["trigger", "action"],
									properties: {
										trigger: { type: "string", minLength: 1 },
										action: { type: "string", minLength: 1 },
										target: { type: "string" },
										params: { type: "object" },
									},
								},
							},
						},
					},
				},
			},
		},
	},
} as const;
