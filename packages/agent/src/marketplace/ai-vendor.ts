import { query, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { listPatterns, type PatternStoreTarget } from "../pattern-store";
import type { Pattern } from "../pattern-schema";
import type {
	MarketplaceProposal,
	MarketplaceRequest,
	Vendor,
} from "./types";

export interface AiVendorOptions {
	primary?: Vendor;
	patterns?: Pattern[];
	claudeExecutablePath?: string;
	cwd?: string;
	model?: string;
	maxTurns?: number;
	debug?: boolean;
	logger?: Pick<Console, "error" | "info" | "warn">;
}

const aiProposalSchema = {
	type: "object",
	additionalProperties: false,
	required: ["patternId", "confidence", "reasons"],
	properties: {
		patternId: { type: ["string", "null"] },
		variantId: { type: "string" },
		reasons: { type: "array", items: { type: "string" } },
		alternatives: { type: "array", items: { type: "string" } },
		confidence: { type: "string", enum: ["high", "medium", "low"] },
	},
} as const;

export function createAiVendor(options: AiVendorOptions = {}): Vendor {
	const primary = options.primary;
	const debug = options.debug ?? false;
	const logger = options.logger ?? console;

	return {
		async propose(request: MarketplaceRequest): Promise<MarketplaceProposal | undefined> {
			if (primary) {
				const ruleProposal = await primary.propose(request);
				if (ruleProposal && ruleProposal.confidence === "high") return ruleProposal;
				if (ruleProposal) {
					if (debug) logger.info("[ai-vendor] low/medium rule proposal, escalating to AI", ruleProposal);
				} else if (debug) logger.info("[ai-vendor] no rule proposal, escalating to AI");
			}

			return await askAi(request, options);
		},
	};
}

async function askAi(
	request: MarketplaceRequest,
	options: AiVendorOptions,
): Promise<MarketplaceProposal | undefined> {
	const allPatterns = options.patterns ?? listPatterns();
	const candidates = allPatterns
		.filter((p) => p.target === request.target)
		.filter((p) => !(request.rejectedPatterns ?? []).includes(p.id));

	if (candidates.length === 0) return undefined;

	const prompt = buildPrompt(request, candidates);

	let resultMessage: SDKResultMessage | undefined;
	for await (const message of query({
		prompt,
		options: {
			disallowedTools: ["Bash", "Edit", "Write", "NotebookEdit", "WebFetch", "WebSearch"],
			cwd: options.cwd,
			maxTurns: options.maxTurns ?? 3,
			model: options.model,
			outputFormat: { type: "json_schema", schema: aiProposalSchema },
			pathToClaudeCodeExecutable: options.claudeExecutablePath,
			permissionMode: "dontAsk",
		},
	})) {
		if (message.type === "result") resultMessage = message;
	}

	if (!resultMessage || resultMessage.subtype !== "success") return undefined;
	const raw = resultMessage.structured_output ?? resultMessage.result;
	const parsed = typeof raw === "string" ? safeParse(raw) : (raw as AiProposalResponse | undefined);
	if (!parsed || parsed.patternId == null) return undefined;
	if (!candidates.some((c) => c.id === parsed.patternId)) return undefined;

	const winner = candidates.find((c) => c.id === parsed.patternId);
	return {
		patternId: parsed.patternId,
		variantId: parsed.variantId ?? winner?.defaultVariant ?? "default",
		reasons: parsed.reasons ?? [],
		alternatives: parsed.alternatives ?? [],
		confidence: parsed.confidence ?? "medium",
		score: 0,
	};
}

interface AiProposalResponse {
	patternId: string | null;
	variantId?: string;
	reasons?: string[];
	alternatives?: string[];
	confidence?: "high" | "medium" | "low";
}

function safeParse(text: string): AiProposalResponse | undefined {
	try {
		const trimmed = text.trim();
		const json = trimmed.startsWith("{")
			? trimmed
			: (trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]?.trim() ?? trimmed);
		return JSON.parse(json) as AiProposalResponse;
	} catch {
		return undefined;
	}
}

function buildPrompt(request: MarketplaceRequest, candidates: Pattern[]): string {
	const candidateLines = candidates.map((p) => describePattern(p)).join("\n\n");
	const ctx = request.context;
	const rejected = request.rejectedPatterns?.length
		? `\nPreviously rejected: ${request.rejectedPatterns.join(", ")}`
		: "";
	return [
		"You are a pattern marketplace vendor.",
		`Select the best matching ${request.target} pattern from the catalog below for the consumer request.`,
		"Return null patternId if no candidate fits well.",
		"",
		`<consumer_request target="${request.target}">`,
		`id: ${ctx.id}`,
		ctx.name ? `name: ${ctx.name}` : "",
		ctx.description ? `description: ${ctx.description}` : "",
		ctx.organismPatternIds?.length
			? `organism patternIds present: ${ctx.organismPatternIds.join(", ")}`
			: "",
		ctx.compositeTypes?.length ? `composite types present: ${ctx.compositeTypes.join(", ")}` : "",
		rejected,
		"</consumer_request>",
		"",
		"<catalog>",
		candidateLines,
		"</catalog>",
		"",
		"Output a JSON object matching the provided schema.",
		"reasons[] must explain WHY this pattern fits or null was chosen.",
	]
		.filter(Boolean)
		.join("\n");
}

function describePattern(pattern: Pattern): string {
	const lines = [
		`- id: ${pattern.id}`,
		`  name: ${pattern.name}`,
		pattern.description ? `  description: ${pattern.description}` : "",
		pattern.target === "screen" && pattern.expects?.contents?.organismPatterns?.length
			? `  expects organism patterns: ${pattern.expects.contents.organismPatterns.join(", ")}`
			: "",
		pattern.target === "organism" && pattern.expects?.composites?.types?.length
			? `  expects composite types: ${pattern.expects.composites.types.join(", ")}`
			: "",
		pattern.resolution?.nameKeywords?.length
			? `  keywords: ${pattern.resolution.nameKeywords.join(", ")}`
			: "",
	];
	return lines.filter(Boolean).join("\n");
}

export type { PatternStoreTarget };
