import { execFileSync } from "node:child_process";
import { query, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { GeneratedNodeTree } from "../types";

export interface ClaudeAssetMarkdownFile {
	name: string;
	content: string;
}

export interface ClaudeAssetGeneratorInput {
	importId: string;
	areaFiles: ClaudeAssetMarkdownFile[];
	screenFiles: ClaudeAssetMarkdownFile[];
}

export interface ClaudeAssetGeneratorOptions {
	claudeExecutablePath?: string;
	continueSession?: boolean;
	cwd?: string;
	debug?: boolean;
	logger?: Pick<Console, "error" | "info" | "warn">;
	maxTurns?: number;
	model?: string;
}

export interface ClaudeAssetGeneratorOutput {
	generated: GeneratedNodeTree;
	rawResult: string;
	sessionId?: string;
}

const assetRefSchema = z.object({
	order: z.number().optional(),
});

const componentRawSchema = z.object({
	description: z.string().optional(),
	variant: z.string().optional(),
	note: z.string().optional(),
	hooks: z
		.array(
			z.object({
				trigger: z.string().min(1),
				action: z.string().min(1),
				target: z.string().optional(),
				params: z.record(z.string(), z.unknown()).optional(),
			}),
		)
		.optional(),
});

const componentSchema = z.object({
	id: z.string().min(1),
	name: z.string().optional(),
	order: z.number().optional(),
	description: z.string().optional(),
	type: z.string().optional(),
	props: z.record(z.string(), z.unknown()).optional(),
	raw: componentRawSchema.optional(),
});

const areaSchema = z.object({
	id: z.string().min(1),
	name: z.string().optional(),
	order: z.number().optional(),
	description: z.string().optional(),
	layout: z.string().optional(),
	children: z
		.array(
			assetRefSchema.extend({
				componentId: z.string().min(1),
			}),
		)
		.optional(),
});

const screenSchema = z.object({
	id: z.string().min(1),
	name: z.string().optional(),
	order: z.number().optional(),
	description: z.string().optional(),
	surface: z.string().optional(),
	areas: z
		.array(
			assetRefSchema.extend({
				areaId: z.string().min(1),
			}),
		)
		.optional(),
});

const registerAssetsInputSchema = z.object({
	routes: z
		.array(
			z.object({
				id: z.string().min(1),
				name: z.string().optional(),
				order: z.number().optional(),
				description: z.string().optional(),
				variants: z.array(
					z.object({
						id: z.string().min(1),
						name: z.string().optional(),
						order: z.number().optional(),
						description: z.string().optional(),
						screens: z.array(screenSchema),
					}),
				),
			}),
		)
		.min(1),
	areas: z.array(areaSchema).optional(),
	components: z.array(componentSchema).optional(),
}) satisfies z.ZodType<GeneratedNodeTree>;

export async function generateAssetsWithLocalClaude(
	input: ClaudeAssetGeneratorInput,
	options: ClaudeAssetGeneratorOptions = {},
): Promise<ClaudeAssetGeneratorOutput> {
	let resultMessage: SDKResultMessage | undefined;
	const debug = options.debug ?? false;
	const logger = options.logger ?? console;
	const prompt = buildPrompt(input);
	const claudeExecutablePath = options.claudeExecutablePath ?? resolveClaudeExecutablePath();
	const continueSession = options.continueSession ?? false;
	const maxTurns = options.maxTurns ?? 5;
	const startedAt = Date.now();
	let lastMessageAt = startedAt;
	const messageCounts = new Map<string, number>();

	logDebug(logger, debug, "input", {
		importId: input.importId,
		areaFiles: summarizeFiles(input.areaFiles),
		promptLength: prompt.length,
		screenFiles: summarizeFiles(input.screenFiles),
	});
	logDebug(logger, debug, "query-options", {
		continueSession,
		cwd: options.cwd,
		hasClaudeExecutablePath: Boolean(claudeExecutablePath),
		maxTurns,
		model: options.model ?? "default",
	});

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
				schema: registerAssetsJsonSchema,
			},
			pathToClaudeCodeExecutable: claudeExecutablePath,
			permissionMode: "dontAsk",
			tools: [],
		},
	})) {
		const now = Date.now();
		const messageSummary = summarizeSdkMessage(message);
		recordMessageCount(messageCounts, messageSummary);
		logDebug(logger, debug, "sdk-message", {
			...messageSummary,
			elapsedMs: now - startedAt,
			messageCounts: Object.fromEntries(messageCounts),
			sinceLastMs: now - lastMessageAt,
		});
		lastMessageAt = now;
		if (message.type === "result") {
			resultMessage = message;
		}
	}

	if (!resultMessage) {
		logDebug(logger, debug, "error", {
			elapsedMs: Date.now() - startedAt,
			messageCounts: Object.fromEntries(messageCounts),
			message: "Claude Agent SDK finished without a result message.",
		});
		throw new Error("Claude Agent SDK finished without a result message.");
	}

	if (resultMessage.subtype !== "success" || resultMessage.is_error) {
		logDebug(logger, debug, "error", {
			elapsedMs: Date.now() - startedAt,
			errors: "errors" in resultMessage ? resultMessage.errors : undefined,
			isError: resultMessage.is_error,
			messageCounts: Object.fromEntries(messageCounts),
			numTurns: resultMessage.num_turns,
			rawResultLength: "result" in resultMessage ? resultMessage.result.length : undefined,
			subtype: resultMessage.subtype,
		});
		throw new Error(`Claude Agent SDK failed: ${resultMessage.subtype}`);
	}

	const structuredOutput = resultMessage.structured_output ?? resultMessage.result;
	const generated = parseClaudeRegisterOutput(structuredOutput);
	logDebug(logger, debug, "parsed-output", {
		componentCount: generated.components?.length ?? 0,
		elapsedMs: Date.now() - startedAt,
		messageCounts: Object.fromEntries(messageCounts),
		numTurns: resultMessage.num_turns,
		areaCount: generated.areas?.length ?? 0,
		rawResultLength: resultMessage.result.length,
		routeCount: generated.routes.length,
		screenCount: generated.routes.reduce((count, route) => {
			return count + route.variants.reduce((sum, variant) => sum + variant.screens.length, 0);
		}, 0),
		sessionId: resultMessage.session_id,
		structuredOutputType: typeof resultMessage.structured_output,
	});

	return {
		generated,
		rawResult: resultMessage.result,
		sessionId: resultMessage.session_id,
	};
}

function logDebug(
	logger: Pick<Console, "error" | "info" | "warn">,
	enabled: boolean,
	event: string,
	payload: unknown,
) {
	if (!enabled) return;
	logger.info(`[cx-agent:claude] ${event}`, payload);
}

function summarizeFiles(files: ClaudeAssetMarkdownFile[]) {
	return files.map((file) => ({
		name: file.name,
		characters: file.content.length,
		lines: file.content.split("\n").length,
	}));
}

function summarizeSdkMessage(message: unknown) {
	if (!message || typeof message !== "object") {
		return { type: typeof message };
	}

	const record = message as Record<string, unknown>;
	return {
		type: record.type,
		subtype: record.subtype,
		isError: record.is_error,
		sessionId: record.session_id,
		hasResult: typeof record.result === "string" && record.result.length > 0,
		resultLength: typeof record.result === "string" ? record.result.length : undefined,
		hasStructuredOutput: record.structured_output !== undefined,
	};
}

function recordMessageCount(
	messageCounts: Map<string, number>,
	summary: ReturnType<typeof summarizeSdkMessage>,
) {
	const type = typeof summary.type === "string" ? summary.type : "unknown";
	const subtype = typeof summary.subtype === "string" ? summary.subtype : "";
	const key = subtype ? `${type}:${subtype}` : type;
	messageCounts.set(key, (messageCounts.get(key) ?? 0) + 1);
}

function parseClaudeRegisterOutput(output: unknown): GeneratedNodeTree {
	const parsed = typeof output === "string" ? JSON.parse(extractJson(output)) : output;
	return registerAssetsInputSchema.parse(parsed);
}

function extractJson(output: string) {
	const trimmed = output.trim();
	if (trimmed.startsWith("{")) return trimmed;

	const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
	if (fenced?.[1]) return fenced[1].trim();

	return trimmed;
}

function buildPrompt(input: ClaudeAssetGeneratorInput) {
	return [
		"You are the Claude Generation Agent for RND Screen Generator.",
		"Convert the uploaded client import markdown files into GeneratedNodeTree JSON.",
		"Return only data matching the provided JSON schema.",
		"",
		"Phase 1 scope:",
		"- Register one Screen Route covering all provided screens.",
		"- Register one Screen Variant per main-flow screen markdown file.",
		'  The variant id is the main screen\'s base id with the trailing "-0" stripped',
		"  (e.g. file NOVA-MBR-FP-001-0.md → variant id NOVA-MBR-FP-001).",
		"  The variant name and description come from the main screen's 화면 명 / 화면 설명.",
		"- Under each variant, register the main screen first, then its edge screens.",
		"  Main screen: use the file's full id (e.g. NOVA-MBR-FP-001-0).",
		'  Edge screens: read the "## 케이스 분기" table in that same file and',
		"  register every row as a screen under the same variant using the row's",
		"  화면 ID (e.g. NOVA-MBR-FP-001-E1) as the screen id and 화면 명 / 화면 설명",
		"  as name / description. Edge-case screens have no areas unless the",
		"  markdown explicitly lists them.",
		"- Order screens within a variant: main screen first (order 1),",
		"  then edge screens in the order they appear in 케이스 분기 (order 2, 3, ...).",
		"- Register Areas and Components referenced by the screens.",
		"- For each area, put referenced components under area.children.",
		"- Do not create area.raw or area.components.",
		"- Preserve IDs from the source markdown whenever present.",
		"- Do not invent screens that are not declared in the markdown.",
		"- Do not invent copy text that is not needed for registration.",
		"",
		"Component identity (required):",
		'- For each component row in an area\'s "## 컴포넌트 상세" table:',
		'    component.id   = "컴포넌트 명" cell verbatim (e.g. text-field-auth-code)',
		'    component.type = "컴포넌트 ID" cell verbatim (e.g. text-field, section-message, button,',
		"                     action-area, list-cell, accordion, checkbox). This is the component",
		"                     vocabulary key, NOT the row identifier. Always populate it.",
		"",
		"Raw field extraction (verbatim, no interpretation):",
		'- For each component (a row in an area\'s "## 컴포넌트 상세" table),',
		"  populate component.raw with the table cells:",
		'    raw.description = "컴포넌트 설명" cell verbatim',
		'    raw.variant     = "variant" cell verbatim (use empty string or omit if "-")',
		'    raw.note        = "비고" cell verbatim',
		'    raw.hooks       = parse "이벤트" / "액션" / "액션 파라미터" cells into NodeHook objects',
		"                    [{ trigger, action, target?, params? }].",
		'                    Use trigger = "이벤트", action = "액션", target = "액션 파라미터".',
		'                    Also set params.parameter to the same "액션 파라미터" value when present.',
		'  Do NOT translate, summarize, or guess. Leave a field omitted if the cell is empty or "-".',
		'- For each screen, populate screen.description with the screen markdown\'s "화면 설명" verbatim.',
		"- Do not create screen.raw.",
		'  Do not copy "## 화면 전환" or "## 케이스 분기" tables into any raw field.',
		"  Screen cases must be represented as concrete screens in the variant.screens array.",
		"- component.props and screen-level computed fields should remain empty;",
		"  Composer (a later stage) will fill them from raw.",
		"",
		`Import ID: ${input.importId}`,
		"",
		"<screen_files>",
		...input.screenFiles.map(formatMarkdownFile),
		"</screen_files>",
		"",
		"<area_files>",
		...input.areaFiles.map(formatMarkdownFile),
		"</area_files>",
	].join("\n");
}

function formatMarkdownFile(file: ClaudeAssetMarkdownFile) {
	return [
		`<file name="${escapeAttribute(file.name)}">`,
		"```md",
		file.content,
		"```",
		"</file>",
	].join("\n");
}

function escapeAttribute(value: string) {
	return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
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

const registerAssetsJsonSchema = {
	type: "object",
	additionalProperties: false,
	required: ["routes"],
	properties: {
		routes: {
			type: "array",
			minItems: 1,
			items: {
				type: "object",
				additionalProperties: false,
				required: ["id", "variants"],
				properties: {
					id: { type: "string", minLength: 1 },
					name: { type: "string" },
					order: { type: "number" },
					description: { type: "string" },
					variants: {
						type: "array",
						items: {
							type: "object",
							additionalProperties: false,
							required: ["id", "screens"],
							properties: {
								id: { type: "string", minLength: 1 },
								name: { type: "string" },
								order: { type: "number" },
								description: { type: "string" },
								screens: {
									type: "array",
									items: {
										type: "object",
										additionalProperties: false,
										required: ["id"],
										properties: {
											id: { type: "string", minLength: 1 },
											name: { type: "string" },
											order: { type: "number" },
											description: { type: "string" },
											surface: { type: "string" },
											areas: {
												type: "array",
												items: {
													type: "object",
													additionalProperties: false,
													required: ["areaId"],
													properties: {
														areaId: { type: "string", minLength: 1 },
														order: { type: "number" },
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
		areas: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				required: ["id"],
				properties: {
					id: { type: "string", minLength: 1 },
					name: { type: "string" },
					order: { type: "number" },
					description: { type: "string" },
					layout: { type: "string" },
					children: {
						type: "array",
						items: {
							type: "object",
							additionalProperties: false,
							required: ["componentId"],
							properties: {
								componentId: { type: "string", minLength: 1 },
								order: { type: "number" },
							},
						},
					},
				},
			},
		},
		components: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				required: ["id"],
				properties: {
					id: { type: "string", minLength: 1 },
					name: { type: "string" },
					order: { type: "number" },
					description: { type: "string" },
					type: { type: "string" },
					props: { type: "object" },
					raw: {
						type: "object",
						additionalProperties: false,
						properties: {
							description: { type: "string" },
							variant: { type: "string" },
							note: { type: "string" },
							hooks: {
								type: "array",
								items: {
									type: "object",
									additionalProperties: false,
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
