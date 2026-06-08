import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StageSkillsetDocument, StageSkillsetObject } from "@cx/schema";
import { SSOT_OBJECT_SCHEMA_VERSION } from "@cx/schema";

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
	const body = readPackageMarkdown(document.sourceRef);
	const frontmatter = parseFrontmatter(body);
	const id = readString(frontmatter.id) ?? inferIdFromSourceRef(document.sourceRef);
	return {
		body,
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

function readPackageMarkdown(sourceRef: string): string {
	const currentDir = path.dirname(fileURLToPath(import.meta.url));
	return readFileSync(path.resolve(currentDir, "..", sourceRef), "utf8");
}

function parseFrontmatter(body: string): Record<string, unknown> {
	if (!body.startsWith("---\n")) return {};
	const end = body.indexOf("\n---", 4);
	if (end < 0) return {};

	const frontmatter: Record<string, unknown> = {};
	let currentListKey: string | undefined;
	for (const rawLine of body.slice(4, end).split("\n")) {
		const line = rawLine.trimEnd();
		if (!line.trim()) continue;
		if (line.trimStart().startsWith("- ") && currentListKey) {
			const items = Array.isArray(frontmatter[currentListKey])
				? (frontmatter[currentListKey] as string[])
				: [];
			items.push(line.trimStart().slice(2).trim());
			frontmatter[currentListKey] = items;
			continue;
		}

		currentListKey = undefined;
		const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
		if (!match) continue;
		const [, key, value] = match;
		if (value.length === 0) {
			frontmatter[key] = [];
			currentListKey = key;
			continue;
		}
		frontmatter[key] = value.replace(/^["']|["']$/g, "");
	}
	return frontmatter;
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
