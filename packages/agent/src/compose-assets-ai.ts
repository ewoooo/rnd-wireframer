import { execFileSync } from "node:child_process";
import { query, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

import type { ComponentAssetInput, OrganismAssetInput, RegisterAssetsInput } from "./types";

export interface ComposeAIProposal {
	componentId: string;
	props: Record<string, unknown>;
}

export interface ComposeAIGap {
	componentId: string;
	type: string;
	missing: string[];
	hasRaw: boolean;
}

export interface ComposeAIRunnerInput {
	prompt: string;
}

export interface ComposeAIRunnerOutput {
	proposals: ComposeAIProposal[];
	sessionId?: string;
}

export type ComposeAIRunner = (input: ComposeAIRunnerInput) => Promise<ComposeAIRunnerOutput>;

export interface ComposeAssetContentsWithAIOptions {
	runner?: ComposeAIRunner;
	claudeExecutablePath?: string;
	continueSession?: boolean;
	cwd?: string;
	debug?: boolean;
	logger?: Pick<Console, "error" | "info" | "warn">;
	maxTurns?: number;
	model?: string;
}

export interface ComposeAssetContentsWithAIResult {
	composed: RegisterAssetsInput;
	proposals: ComposeAIProposal[];
	gaps: ComposeAIGap[];
	mergedComponentIds: string[];
	skippedProposals: Array<{ componentId: string; reason: string }>;
	warnings: string[];
	sessionId?: string;
}

const TYPE_REQUIRED_KEYS: Record<string, string[]> = {
	"text-field": ["label"],
	"text-area": ["label"],
	"list-cell": ["title"],
	accordion: ["title"],
	"section-message": ["message"],
	"action-area": ["label"],
	button: ["label"],
};

const TYPE_OPTIONAL_KEYS: Record<string, string[]> = {
	"text-field": ["placeholder", "helperText"],
	"text-area": ["placeholder", "helperText"],
	"list-cell": ["description"],
	accordion: ["description"],
	"section-message": ["variant"],
	"action-area": [],
	button: [],
};

export async function composeAssetContentsWithAI(
	composed: RegisterAssetsInput,
	options: ComposeAssetContentsWithAIOptions = {},
): Promise<ComposeAssetContentsWithAIResult> {
	const gaps = identifyGaps(composed);

	if (gaps.length === 0) {
		return {
			composed,
			proposals: [],
			gaps: [],
			mergedComponentIds: [],
			skippedProposals: [],
			warnings: [],
		};
	}

	const organismIndex = buildOrganismIndex(composed);
	const prompt = buildPrompt(composed, gaps, organismIndex);
	const runner = options.runner ?? createDefaultRunner(options);

	const { proposals, sessionId } = await runner({ prompt });

	const merge = mergeProposals(composed, proposals);

	return {
		composed: merge.composed,
		proposals,
		gaps,
		mergedComponentIds: merge.mergedComponentIds,
		skippedProposals: merge.skipped,
		warnings: merge.warnings,
		sessionId,
	};
}

export function identifyGaps(composed: RegisterAssetsInput): ComposeAIGap[] {
	const gaps: ComposeAIGap[] = [];
	for (const component of composed.components ?? []) {
		const type = (component.type ?? "").toLowerCase();
		const props = component.props ?? {};
		const required = TYPE_REQUIRED_KEYS[type] ?? [];
		const optional = TYPE_OPTIONAL_KEYS[type] ?? [];
		const candidateKeys = [...required, ...optional];

		const missing: string[] = [];
		if (Object.keys(props).length === 0) {
			missing.push(...required, ...optional);
		} else {
			for (const key of candidateKeys) {
				if (props[key] === undefined) missing.push(key);
			}
		}

		if (missing.length === 0) continue;

		gaps.push({
			componentId: component.id,
			type: component.type ?? "Unknown",
			missing,
			hasRaw: Boolean(component.raw),
		});
	}
	return gaps;
}

function buildOrganismIndex(composed: RegisterAssetsInput): Map<string, OrganismAssetInput[]> {
	const index = new Map<string, OrganismAssetInput[]>();
	for (const organism of composed.organisms ?? []) {
		for (const ref of organism.components ?? []) {
			const list = index.get(ref.componentId) ?? [];
			list.push(organism);
			index.set(ref.componentId, list);
		}
	}
	return index;
}

function buildPrompt(
	composed: RegisterAssetsInput,
	gaps: ComposeAIGap[],
	organismIndex: Map<string, OrganismAssetInput[]>,
): string {
	const componentsById = new Map(
		(composed.components ?? []).map((component) => [component.id, component]),
	);

	const lines = [
		"You are the Composer Inspector Agent for RND Screen Generator.",
		"For each listed component, propose values ONLY for the keys in `missing`.",
		"Do NOT propose values for keys not listed in `missing`.",
		"Do NOT propose values that overwrite existing props.",
		"Keep the language and tone consistent with the surrounding organism context.",
		"If you cannot reasonably propose a value, omit that key from your response.",
		"",
		"Return JSON: { proposals: [{ componentId, props }] }",
		"",
		"<components>",
	];

	for (const gap of gaps) {
		const component = componentsById.get(gap.componentId);
		if (!component) continue;
		const organisms = organismIndex.get(gap.componentId) ?? [];
		lines.push(serializeGap(component, gap, organisms));
	}

	lines.push("</components>");
	return lines.join("\n");
}

function serializeGap(
	component: ComponentAssetInput,
	gap: ComposeAIGap,
	organisms: OrganismAssetInput[],
): string {
	const raw = component.raw ?? {};
	const props = component.props ?? {};
	return [
		`  <component id="${escapeAttribute(component.id)}" type="${escapeAttribute(component.type ?? "Unknown")}">`,
		`    <missing>${gap.missing.join(", ")}</missing>`,
		`    <current_props>${JSON.stringify(props)}</current_props>`,
		`    <raw>${JSON.stringify(raw)}</raw>`,
		...organisms.map(
			(o) =>
				`    <organism id="${escapeAttribute(o.id)}" name="${escapeAttribute(o.name ?? "")}" description="${escapeAttribute(o.description ?? "")}" layout="${escapeAttribute(o.layout ?? "")}" />`,
		),
		"  </component>",
	].join("\n");
}

function escapeAttribute(value: string) {
	return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

export interface MergeProposalsResult {
	composed: RegisterAssetsInput;
	mergedComponentIds: string[];
	skipped: Array<{ componentId: string; reason: string }>;
	warnings: string[];
}

export function mergeProposals(
	composed: RegisterAssetsInput,
	proposals: ComposeAIProposal[],
): MergeProposalsResult {
	const componentsById = new Map(
		(composed.components ?? []).map((component) => [component.id, component]),
	);
	const proposalById = new Map(proposals.map((p) => [p.componentId, p]));
	const mergedComponentIds: string[] = [];
	const skipped: Array<{ componentId: string; reason: string }> = [];
	const warnings: string[] = [];

	const components = (composed.components ?? []).map((component) => {
		const proposal = proposalById.get(component.id);
		if (!proposal) return component;

		const existing = component.props ?? {};
		const additions: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(proposal.props)) {
			if (existing[key] !== undefined) continue;
			if (value === null || value === undefined || value === "") continue;
			additions[key] = value;
		}

		if (Object.keys(additions).length === 0) {
			skipped.push({ componentId: component.id, reason: "no novel keys" });
			return component;
		}

		mergedComponentIds.push(component.id);
		return { ...component, props: { ...existing, ...additions } };
	});

	for (const proposal of proposals) {
		if (!componentsById.has(proposal.componentId)) {
			warnings.push(`Proposal for unknown component: ${proposal.componentId}`);
		}
	}

	return {
		composed: { ...composed, components },
		mergedComponentIds,
		skipped,
		warnings,
	};
}

const proposalSchema = z.object({
	proposals: z.array(
		z.object({
			componentId: z.string().min(1),
			props: z.record(z.string(), z.unknown()),
		}),
	),
});

const proposalJsonSchema = {
	type: "object",
	additionalProperties: false,
	required: ["proposals"],
	properties: {
		proposals: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				required: ["componentId", "props"],
				properties: {
					componentId: { type: "string", minLength: 1 },
					props: { type: "object" },
				},
			},
		},
	},
} as const;

function createDefaultRunner(options: ComposeAssetContentsWithAIOptions): ComposeAIRunner {
	return async ({ prompt }) => {
		const claudeExecutablePath = options.claudeExecutablePath ?? resolveClaudeExecutablePath();
		const debug = options.debug ?? false;
		const logger = options.logger ?? console;
		const continueSession = options.continueSession ?? false;
		const maxTurns = options.maxTurns ?? 5;
		const startedAt = Date.now();
		let resultMessage: SDKResultMessage | undefined;

		if (debug) {
			logger.info("[cx-agent:compose-ai] start", {
				promptLength: prompt.length,
				maxTurns,
			});
		}

		for await (const message of query({
			prompt,
			options: {
				continue: continueSession,
				cwd: options.cwd,
				disallowedTools: ["Bash", "Edit", "Write", "NotebookEdit", "WebFetch", "WebSearch"],
				maxTurns,
				model: options.model,
				outputFormat: {
					type: "json_schema",
					schema: proposalJsonSchema,
				},
				pathToClaudeCodeExecutable: claudeExecutablePath,
				permissionMode: "dontAsk",
				tools: [],
			},
		})) {
			if (message.type === "result") {
				resultMessage = message;
			}
		}

		if (!resultMessage) {
			throw new Error("Claude Agent SDK finished without a result message.");
		}
		if (resultMessage.subtype !== "success" || resultMessage.is_error) {
			throw new Error(`Claude Agent SDK failed: ${resultMessage.subtype}`);
		}

		const structuredOutput = resultMessage.structured_output ?? resultMessage.result;
		const parsed = parseProposalOutput(structuredOutput);

		if (debug) {
			logger.info("[cx-agent:compose-ai] done", {
				elapsedMs: Date.now() - startedAt,
				proposalCount: parsed.proposals.length,
			});
		}

		return {
			proposals: parsed.proposals,
			sessionId: resultMessage.session_id,
		};
	};
}

function parseProposalOutput(output: unknown) {
	const parsed = typeof output === "string" ? JSON.parse(extractJson(output)) : output;
	return proposalSchema.parse(parsed);
}

function extractJson(output: string) {
	const trimmed = output.trim();
	if (trimmed.startsWith("{")) return trimmed;
	const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
	if (fenced?.[1]) return fenced[1].trim();
	return trimmed;
}

function resolveClaudeExecutablePath() {
	if (process.env.CLAUDE_CODE_PATH) return process.env.CLAUDE_CODE_PATH;
	try {
		return execFileSync("command -v claude", {
			encoding: "utf8",
			shell: true,
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return undefined;
	}
}
