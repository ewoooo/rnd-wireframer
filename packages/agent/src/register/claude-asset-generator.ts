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
	displayText: z.string().optional(),
	binding: z.string().optional(),
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
	key: z.number().optional(),
	areaType: z.enum(["static", "dynamic"]).optional(),
	visibility: z.string().optional(),
	serverControl: z.string().optional(),
	minCount: z.number().optional(),
	maxCount: z.number().optional(),
	priority: z.number().optional(),
	errorPolicy: z.string().optional(),
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
		"Convert the uploaded PRDD screen markdown files into GeneratedNodeTree JSON.",
		"Return only data matching the provided JSON schema.",
		"",
		"Input shape:",
		'- Each <screen_files> entry is one PRDD screen markdown with frontmatter ("화면 ID", "화면 명", "화면 설명", ...).',
		"- Each screen markdown contains two tables you MUST walk row-by-row:",
		'  - "## 화면 구성"     → area definitions for this screen',
		'  - "## 컴포넌트 상세" → component rows, each tagged with the area it belongs to via the "영역" column (= 화면 구성 row\'s "no.")',
		'- A "## 화면 흐름" table may also exist — only its "케이스 분기" rows are used to register edge screens.',
		"",
		"Routes & variants (base screen files only by default):",
		"- Register exactly one Screen Route covering all provided screens. route.id = importId.",
		'- A base screen file ends with "-0" (e.g. NOVA-PRDD-PG-001-0.md). For each such file:',
		'    variant.id = base screen id with trailing "-0" stripped (e.g. NOVA-PRDD-PG-001)',
		'    variant.name        = base screen\'s "화면 명"',
		'    variant.description = base screen\'s "화면 설명"',
		"- Under each variant, register screens in this order:",
		"    1) the base screen (order 1) using the file's full 화면 ID (e.g. NOVA-PRDD-PG-001-0)",
		'    2) every row of that file\'s "## 화면 흐름 → 케이스 분기" rows (order 2, 3, …),',
		"       using the row's 화면 ID as the screen id and 화면 명 / 화면 설명 as name / description.",
		'- Local PRDD imports keep non "-0" markdown files (e.g. -1, -2, -E1) under PRDD/variants/',
		"  as deferred source references. Do not expand those files into generated screens unless they",
		"  are explicitly included in <screen_files> for a retry or variant-focused generation run.",
		"",
		"Area extraction (screen-embedded, one set per screen):",
		'- For every row in a screen\'s "## 화면 구성" table, emit ONE area:',
		"    area.id     = `${screenId}-area-${no}`   (screenId = the file's full 화면 ID; no = the row's `no.` cell verbatim)",
		"    area.key    = the `no.` cell parsed as integer",
		'    area.name   = the "영역 설명" cell verbatim',
		"    area.description = same as name (omit if identical and you prefer one)",
		'    area.layout = the "영역 레이아웃" cell verbatim (e.g. "vertical")',
		'    area.areaType = "static" or "dynamic" — value of the "영역 유형" cell verbatim',
		'    area.visibility   = "노출 조건" cell verbatim',
		'    area.serverControl = "서버 제어 항목" cell verbatim (omit if "-")',
		'    area.minCount  = "노출 개수 (최소)" cell parsed as integer (omit if "-")',
		'    area.maxCount  = "노출 개수 (최대)" cell parsed as integer (omit if "-")',
		'    area.priority  = "노출 우선순위" cell parsed as integer (omit if "-")',
		'    area.errorPolicy = "오류 처리 방식" cell verbatim (omit if "-")',
		"- Attach the screen's areas via screen.areas = [{ areaId, order }] preserving 화면 구성 order.",
		"- Edge screens (from 케이스 분기) have no areas unless they ship their own 화면 구성 table.",
		"",
		"Component extraction (screen-embedded, one set per screen):",
		'- For every row in a screen\'s "## 컴포넌트 상세" table:',
		'    component.id   = "컴포넌트 명" cell verbatim (e.g. AppBarHeader, CardSummaryProductSummary).',
		"                     This is the instance identity within the screen.",
		'    component.type = "컴포넌트 ID" cell verbatim (e.g. AppBar, CardSummary). This is the design-system',
		"                     vocabulary key — always populate.",
		'    component.raw.description = "컴포넌트 설명" cell verbatim',
		'    component.raw.variant     = "variant" cell verbatim (omit or empty string if "-")',
		'    component.raw.note        = "비고" cell verbatim (omit if "-")',
		'    component.raw.displayText = "표시 텍스트" cell verbatim — preserve newlines / "<br>" markers',
		'    component.raw.binding     = "바인딩(소스)" cell verbatim — preserve newlines',
		'    component.raw.hooks       = parse "이벤트" / "액션" / "액션 파라미터" cells into NodeHook objects',
		"                                [{ trigger, action, target?, params? }].",
		'                                Use trigger = "이벤트", action = "액션", target = "액션 파라미터".',
		'                                Also set params.parameter to the same "액션 파라미터" value when present.',
		'                                Omit hooks entirely if 이벤트 / 액션 are both "-".',
		"- Attach each component to its area via that area's children:",
		"    Find the area whose `key` equals the row's `영역` cell.",
		"    Push `{ componentId: <component.id>, order: <row index within that area, starting at 1> }` to area.children.",
		'- Components defined in different screens but sharing the same "컴포넌트 명" are still distinct',
		"  instances — emit them per screen with screen-scoped order. Do NOT deduplicate across screens.",
		"",
		"Hard constraints:",
		"- Do NOT translate, summarize, or guess any cell content. Leave a field omitted if the cell is empty or just '-'.",
		"- Do NOT invent screens, areas, or components that are not present in the markdown.",
		"- component.props and screen-level computed fields stay empty — Composer (a later stage) fills them from raw.",
		"- Empty area.children is a bug when the screen has a 컴포넌트 상세 table with rows targeting that area.",
		"",
		`Import ID: ${input.importId}`,
		"",
		"<screen_files>",
		...input.screenFiles.map(formatMarkdownFile),
		"</screen_files>",
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
					key: { type: "number" },
					areaType: { type: "string", enum: ["static", "dynamic"] },
					visibility: { type: "string" },
					serverControl: { type: "string" },
					minCount: { type: "number" },
					maxCount: { type: "number" },
					priority: { type: "number" },
					errorPolicy: { type: "string" },
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
							displayText: { type: "string" },
							binding: { type: "string" },
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
