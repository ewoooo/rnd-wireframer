import type { StageSkillsetDocument, StageSkillsetObject } from "@cx/schema";
import { SSOT_OBJECT_SCHEMA_VERSION } from "@cx/schema";
import { readAgentMarkdownDocument } from "../docs/package-markdown";

type StageSkillsetCatalogEntry = {
	stage: StageSkillsetDocument["stage"];
	task: string;
	documents: Array<{
		kind: StageSkillsetDocument["kind"];
		sourceRef: string;
	}>;
};

export const AGENT_STAGE_SKILLSET_CATALOG = {
	"understand.screen-intent": {
		stage: "understand",
		task: "screen-intent",
		documents: [
			{
				kind: "prompt",
				sourceRef: "../docs/prompts/screen-intent.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/review-skills/source-fidelity-review/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/review-skills/state-coverage-review/README.md",
			},
		],
	},
	"compose.composition-planning": {
		stage: "compose",
		task: "composition-planning",
		documents: [
			{
				kind: "skill",
				sourceRef: "../docs/skills/compose-skills/pagestack-section-unit/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/review-skills/pattern-fit-review/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/review-skills/visual-hierarchy-review/README.md",
			},
		],
	},
	"compose.screen-generation": {
		stage: "compose",
		task: "screen-generation",
		documents: [
			{
				kind: "skill",
				sourceRef: "../docs/skills/generate-skills/section-divider-rhythm/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/generate-skills/bottom-fixed-cta/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/generate-skills/text-field-states/README.md",
			},
		],
	},
	"revise.screen-revision": {
		stage: "revise",
		task: "screen-revision",
		documents: [
			{
				kind: "skill",
				sourceRef: "../docs/skills/revision-skills/fix-invalid-layout-id/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/revision-skills/fix-source-ref-loss/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/revision-skills/fix-state-coverage-gap/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/revision-skills/fix-section-rhythm/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/revision-skills/fix-bottom-cta-gating/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/revision-skills/fix-component-contract-violation/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/revision-skills/fix-density-overload/README.md",
			},
		],
	},
	"revise.quality-review": {
		stage: "revise",
		task: "quality-review",
		documents: [
			{
				kind: "skill",
				sourceRef: "../docs/skills/quality-review/checklist.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/review-skills/visual-hierarchy-review/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/review-skills/source-fidelity-review/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/review-skills/pattern-fit-review/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/review-skills/action-clarity-review/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/review-skills/density-fit-review/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/review-skills/state-coverage-review/README.md",
			},
			{
				kind: "skill",
				sourceRef: "../docs/skills/review-skills/anti-slop-review/README.md",
			},
		],
	},
} as const satisfies Record<string, StageSkillsetCatalogEntry>;

export type AgentStageSkillsetId = keyof typeof AGENT_STAGE_SKILLSET_CATALOG;

export function resolveStageSkillsetForInference(id: string): StageSkillsetObject {
	const entry = AGENT_STAGE_SKILLSET_CATALOG[id as AgentStageSkillsetId];
	if (!entry) throw new Error(`Unknown stage skillset: ${id}`);

	return {
		kind: "stage-skillset",
		id,
		owner: "@cx/agent",
		sourceRef: `../docs/skills/stage-skillsets/${id}`,
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			stage: entry.stage,
			task: entry.task,
			documents: entry.documents.map((document) =>
				readStageSkillsetDocument({
					...document,
					stage: entry.stage,
					task: entry.task,
				}),
			),
		},
	};
}

function readStageSkillsetDocument(document: {
	kind: StageSkillsetDocument["kind"];
	sourceRef: string;
	stage: StageSkillsetDocument["stage"];
	task: string;
}): StageSkillsetDocument {
	const markdown = readAgentMarkdownDocument(document.sourceRef);
	const frontmatter = markdown.frontmatter;
	const id = readString(frontmatter.id) ?? inferIdFromSourceRef(document.sourceRef);
	return {
		body: markdown.body,
		frontmatter,
		id,
		kind: document.kind,
		priority: readPriority(frontmatter.priority),
		role: readString(frontmatter.role),
		sourceRef: document.sourceRef,
		stage: readStage(frontmatter.stage) ?? document.stage,
		task: readString(frontmatter.task) ?? document.task,
	};
}

function inferIdFromSourceRef(sourceRef: string): string {
	const normalized = sourceRef.replace(/\/README\.md$/, "");
	return normalized.slice(normalized.lastIndexOf("/") + 1).replace(/\.md$/, "");
}

function readString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readPriority(value: unknown): StageSkillsetDocument["priority"] | undefined {
	return value === "optional" || value === "recommended" || value === "required"
		? value
		: undefined;
}

function readStage(value: unknown): StageSkillsetDocument["stage"] | undefined {
	return value === "compose" || value === "revise" || value === "understand" ? value : undefined;
}
