import { query, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { findPattern } from "../pattern-store";
import type {
	Consumer,
	MarketplaceConfidence,
	MarketplaceDecision,
	MarketplaceProposal,
	MarketplaceRequest,
} from "./types";

export interface AiConsumerOptions {
	primary?: Consumer;
	confidenceShortCircuit?: MarketplaceConfidence;
	claudeExecutablePath?: string;
	cwd?: string;
	model?: string;
	maxTurns?: number;
	debug?: boolean;
	logger?: Pick<Console, "error" | "info" | "warn">;
}

const aiDecisionSchema = {
	type: "object",
	additionalProperties: false,
	required: ["kind", "reasons"],
	properties: {
		kind: { type: "string", enum: ["accept", "reject"] },
		reasons: { type: "array", items: { type: "string" } },
	},
} as const;

export function createAiConsumer(options: AiConsumerOptions = {}): Consumer {
	const primary = options.primary;
	const shortCircuit = options.confidenceShortCircuit ?? "high";
	const debug = options.debug ?? false;
	const logger = options.logger ?? console;

	return {
		async evaluate(
			proposal: MarketplaceProposal,
			request: MarketplaceRequest,
		): Promise<MarketplaceDecision> {
			if (confidenceRank(proposal.confidence) >= confidenceRank(shortCircuit)) {
				if (primary) return await primary.evaluate(proposal, request);
				return { kind: "accept", reasons: proposal.reasons };
			}
			if (debug) logger.info("[ai-consumer] evaluating proposal with AI", proposal);
			return await askAi(proposal, request, options);
		},
	};
}

async function askAi(
	proposal: MarketplaceProposal,
	request: MarketplaceRequest,
	options: AiConsumerOptions,
): Promise<MarketplaceDecision> {
	const pattern = findPattern(proposal.patternId, request.target);
	const prompt = buildPrompt(proposal, request, pattern);

	let resultMessage: SDKResultMessage | undefined;
	for await (const message of query({
		prompt,
		options: {
			disallowedTools: ["Bash", "Edit", "Write", "NotebookEdit", "WebFetch", "WebSearch"],
			cwd: options.cwd,
			maxTurns: options.maxTurns ?? 3,
			model: options.model,
			outputFormat: { type: "json_schema", schema: aiDecisionSchema },
			pathToClaudeCodeExecutable: options.claudeExecutablePath,
			permissionMode: "dontAsk",
		},
	})) {
		if (message.type === "result") resultMessage = message;
	}

	if (!resultMessage || resultMessage.subtype !== "success") {
		return { kind: "reject", reason: "AI consumer failed to respond" };
	}
	const raw = resultMessage.structured_output ?? resultMessage.result;
	const parsed = typeof raw === "string" ? safeParse(raw) : (raw as AiDecisionResponse | undefined);
	if (!parsed) {
		return { kind: "reject", reason: "AI consumer returned unparseable output" };
	}
	if (parsed.kind === "accept") return { kind: "accept", reasons: parsed.reasons ?? [] };
	return { kind: "reject", reason: (parsed.reasons ?? []).join("; ") || "rejected by AI consumer" };
}

interface AiDecisionResponse {
	kind: "accept" | "reject";
	reasons?: string[];
}

function safeParse(text: string): AiDecisionResponse | undefined {
	try {
		const trimmed = text.trim();
		const json = trimmed.startsWith("{")
			? trimmed
			: (trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]?.trim() ?? trimmed);
		return JSON.parse(json) as AiDecisionResponse;
	} catch {
		return undefined;
	}
}

function buildPrompt(
	proposal: MarketplaceProposal,
	request: MarketplaceRequest,
	pattern: ReturnType<typeof findPattern>,
): string {
	const ctx = request.context;
	const expectsLine =
		pattern?.target === "screen"
			? pattern.expects?.contents?.organismPatterns?.join(", ")
			: pattern?.target === "organism"
				? pattern.expects?.composites?.types?.join(", ")
				: undefined;

	return [
		"You are a pattern marketplace consumer.",
		"Decide whether to accept or reject the vendor's proposal.",
		"Reject if the pattern is semantically wrong for the consumer's context",
		"(e.g. layout mismatch, missing required organisms, wrong domain).",
		"",
		`<consumer_request target="${request.target}">`,
		`id: ${ctx.id}`,
		ctx.name ? `name: ${ctx.name}` : "",
		ctx.description ? `description: ${ctx.description}` : "",
		ctx.organismPatternIds?.length
			? `organism patternIds present: ${ctx.organismPatternIds.join(", ")}`
			: "",
		ctx.compositeTypes?.length ? `composite types present: ${ctx.compositeTypes.join(", ")}` : "",
		"</consumer_request>",
		"",
		"<vendor_proposal>",
		`patternId: ${proposal.patternId}`,
		`variantId: ${proposal.variantId}`,
		`confidence: ${proposal.confidence}`,
		`vendor reasons: ${proposal.reasons.join("; ")}`,
		pattern?.description ? `pattern description: ${pattern.description}` : "",
		expectsLine ? `pattern expects: ${expectsLine}` : "",
		"</vendor_proposal>",
		"",
		"Output a JSON object matching the schema with kind and reasons.",
	]
		.filter(Boolean)
		.join("\n");
}

function confidenceRank(level: MarketplaceConfidence): number {
	if (level === "high") return 2;
	if (level === "medium") return 1;
	return 0;
}
