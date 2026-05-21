import { execFileSync } from "node:child_process";
import { query, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { RegisterAssetsInput } from "./types";

export interface ClaudeAssetMarkdownFile {
	name: string;
	content: string;
}

export interface ClaudeAssetGeneratorInput {
	importId: string;
	organismFiles: ClaudeAssetMarkdownFile[];
	screenFiles: ClaudeAssetMarkdownFile[];
}

export interface ClaudeAssetGeneratorOptions {
	claudeExecutablePath?: string;
	continueSession?: boolean;
	cwd?: string;
	maxTurns?: number;
	model?: string;
}

export interface ClaudeAssetGeneratorOutput {
	generated: RegisterAssetsInput;
	rawResult: string;
	sessionId?: string;
}

const assetRefSchema = z.object({
	order: z.number().optional(),
});

const componentSchema = z.object({
	id: z.string().min(1),
	name: z.string().optional(),
	order: z.number().optional(),
	description: z.string().optional(),
	type: z.string().optional(),
	props: z.record(z.string(), z.unknown()).optional(),
});

const organismSchema = z.object({
	id: z.string().min(1),
	name: z.string().optional(),
	order: z.number().optional(),
	description: z.string().optional(),
	layout: z.string().optional(),
	components: z
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
	organisms: z
		.array(
			assetRefSchema.extend({
				organismId: z.string().min(1),
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
	organisms: z.array(organismSchema).optional(),
	components: z.array(componentSchema).optional(),
}) satisfies z.ZodType<RegisterAssetsInput>;

export async function generateAssetsWithLocalClaude(
	input: ClaudeAssetGeneratorInput,
	options: ClaudeAssetGeneratorOptions = {},
): Promise<ClaudeAssetGeneratorOutput> {
	let resultMessage: SDKResultMessage | undefined;

	for await (const message of query({
		prompt: buildPrompt(input),
		options: {
			continue: options.continueSession ?? true,
			cwd: options.cwd,
			disallowedTools: ["Bash", "Edit", "Write", "NotebookEdit", "WebFetch", "WebSearch"],
			maxTurns: options.maxTurns ?? 1,
			model: options.model,
			outputFormat: {
				type: "json_schema",
				schema: registerAssetsJsonSchema,
			},
			pathToClaudeCodeExecutable: options.claudeExecutablePath ?? resolveClaudeExecutablePath(),
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
	const generated = parseClaudeRegisterOutput(structuredOutput);

	return {
		generated,
		rawResult: resultMessage.result,
		sessionId: resultMessage.session_id,
	};
}

function parseClaudeRegisterOutput(output: unknown): RegisterAssetsInput {
	const parsed = typeof output === "string" ? JSON.parse(extractJson(output)) : output;
	return registerAssetsInputSchema.parse(parsed);
}

function extractJson(output: string) {
	const trimmed = output.trim();
	if (trimmed.startsWith("{")) return trimmed;

	const fenced = trimmed.match(/```(?:json)?\s*(?<json>[\s\S]*?)```/);
	if (fenced?.groups?.json) return fenced.groups.json.trim();

	return trimmed;
}

function buildPrompt(input: ClaudeAssetGeneratorInput) {
	return [
		"You are the Claude Generation Agent for RND Screen Generator.",
		"Convert the uploaded client import markdown files into RegisterAssetsInput JSON.",
		"Return only data matching the provided JSON schema.",
		"",
		"Phase 1 scope:",
		"- Register Screen Route and Screen Variant.",
		"- Register Screens under the variant in screen order.",
		"- Register Organisms and Components.",
		"- Preserve IDs from the source markdown whenever present.",
		"- Do not generate mock screen data, visual decoration, or table rows.",
		"- Do not invent copy text that is not needed for registration.",
		"",
		`Import ID: ${input.importId}`,
		"",
		"<screen_files>",
		...input.screenFiles.map(formatMarkdownFile),
		"</screen_files>",
		"",
		"<organism_files>",
		...input.organismFiles.map(formatMarkdownFile),
		"</organism_files>",
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
											organisms: {
												type: "array",
												items: {
													type: "object",
													additionalProperties: false,
													required: ["organismId"],
													properties: {
														organismId: { type: "string", minLength: 1 },
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
		organisms: {
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
					components: {
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
				},
			},
		},
	},
} as const;
