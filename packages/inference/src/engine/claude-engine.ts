import type { AgentPromptArtifact, AgentRuntime } from "@cx/agent";
import {
	type SkillsetDocument,
	type SkillsetObject,
	toStructuredOutputJsonSchema,
} from "@cx/schema";
import type { Engine, EngineRequest, KnowledgeValue } from "../contracts";

/**
 * Assembles the prompt artifact and runs it via @cx/agent. Owns prompt-block
 * assembly only — no domain mapping. Skillset prompt documents become the
 * system prompt and skill documents become user blocks, so instructions are
 * not buried inside the Context JSON; catalogs and inputs stay in Context JSON.
 */
export function createClaudeEngine(agentRuntime: AgentRuntime): Engine {
	return {
		async execute({ task, inputs, references, outputContract }) {
			if (!task) throw new Error("claude engine requires step.task");
			const { promptDocuments, skillDocuments, knowledgeReferences } = splitReferences(references);
			const query = assembleUserPrompt({
				task,
				dtoName: outputContract.data.dtoName,
				contractId: outputContract.id,
				skillDocuments,
				knowledgeReferences,
			});
			const context = {
				inputs,
				references: knowledgeReferences,
				// CLI structured output은 재귀 $ref를 거부한다. 생성 시점 제약에는
				// depth-bounded 변형을 쓰고, 산출물 검증은 원본 재귀 계약이 담당한다.
				jsonSchema: toStructuredOutputJsonSchema(outputContract.data.jsonSchema),
			};
			const prompt: AgentPromptArtifact = {
				system: assembleSystemPrompt(task, promptDocuments),
				user: query,
				metadata: { context, taskKind: task },
			};
			const result = await agentRuntime.run({
				taskKind: task,
				input: { query, context },
				prompt,
				session: { mode: "new" },
			});
			return { raw: result.payload, prompt };
		},
	};
}

const HARD_CONSTRAINTS = [
	"`context.inputs.sourceSpec` (when present) is the source of truth. Keep every source-specified item represented with the same cardinality: if the spec lists two checkboxes, the output keeps exactly two. Never add, drop, or merge spec items.",
	"Use only component types, props, layout ids, and source refs that exist in the mounted catalogs and inputs. Never invent identifiers or metrics.",
	"When mounted design guidance conflicts with source evidence or schema/catalog contracts, source evidence and contracts win.",
	"Return exactly one JSON object — no prose, no markdown fences, no fields outside the output schema.",
] as const;

function assembleSystemPrompt(task: string, promptDocuments: SkillsetDocument[]): string {
	const sections = [
		`You are the Claude ${task} agent for RND Screen Generator.`,
		...promptDocuments.map((document) => document.body.trim()),
	];
	return sections.join("\n\n");
}

function assembleUserPrompt(options: {
	task: string;
	dtoName: string;
	contractId: string;
	skillDocuments: SkillsetDocument[];
	knowledgeReferences: Record<string, KnowledgeValue | KnowledgeValue[]>;
}): string {
	const blocks = [
		"## Stage Objective",
		`Execute the "${options.task}" stage of the screen-generation pipeline. Produce ${options.dtoName} (${options.contractId}) from the provided context.`,
		"",
		"## Hard Constraints",
		...HARD_CONSTRAINTS.map((constraint, index) => `${index + 1}. ${constraint}`),
	];
	if (options.skillDocuments.length > 0) {
		blocks.push("", "## Mounted Skills");
		for (const document of options.skillDocuments) {
			blocks.push("", `### skill:${document.id}`, "", document.body.trim());
		}
	}
	const mountSummaries = describeKnowledgeMounts(options.knowledgeReferences);
	if (mountSummaries.length > 0) {
		blocks.push(
			"",
			"## Knowledge Mounts",
			"The Context JSON below carries these mounts. Treat them as the only allowed vocabulary and evidence:",
			...mountSummaries.map((summary) => `- ${summary}`),
		);
	}
	blocks.push(
		"",
		"## Output Contract",
		`Return one JSON object matching the ${options.dtoName} JSON Schema provided in \`context.jsonSchema\`.`,
	);
	return blocks.join("\n");
}

function describeKnowledgeMounts(
	references: Record<string, KnowledgeValue | KnowledgeValue[]>,
): string[] {
	return Object.entries(references).map(([name, value]) => {
		const items = Array.isArray(value) ? value : [value];
		const labels = items.map((item) => `${item.kind}:${item.id}`).join(", ");
		return `\`context.references.${name}\` — ${labels}`;
	});
}

function splitReferences(references: EngineRequest["references"]): {
	promptDocuments: SkillsetDocument[];
	skillDocuments: SkillsetDocument[];
	knowledgeReferences: Record<string, KnowledgeValue | KnowledgeValue[]>;
} {
	const promptDocuments: SkillsetDocument[] = [];
	const skillDocuments: SkillsetDocument[] = [];
	const knowledgeReferences: Record<string, KnowledgeValue | KnowledgeValue[]> = {};
	for (const [name, value] of Object.entries(references)) {
		if (!Array.isArray(value) && isSkillset(value)) {
			for (const document of value.data.documents) {
				(document.kind === "prompt" ? promptDocuments : skillDocuments).push(document);
			}
			// Bodies are promoted into the prompt; keep a body-less manifest in
			// context so the model can cite document ids/sourceRefs (usedSkills).
			knowledgeReferences[name] = {
				...value,
				data: {
					...value.data,
					documents: value.data.documents.map(({ body, ...rest }) => {
						void body;
						return rest;
					}),
				},
			} as KnowledgeValue;
			continue;
		}
		knowledgeReferences[name] = value;
	}
	return { promptDocuments, skillDocuments, knowledgeReferences };
}

function isSkillset(value: KnowledgeValue): value is SkillsetObject {
	return value.kind === "skillset";
}
