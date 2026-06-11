import type { SkillsetDocument, SkillsetObject } from "@cx/schema";
import { SSOT_OBJECT_SCHEMA_VERSION } from "@cx/schema";
import { readAgentMarkdownDocument } from "../docs/package-markdown";
import { AGENT_SKILLSET_CATALOG } from "./catalog.generated";

export { AGENT_SKILLSET_CATALOG };

export type AgentSkillsetId = keyof typeof AGENT_SKILLSET_CATALOG;

export function resolveSkillsetForInference(task: string): SkillsetObject {
	const entry = AGENT_SKILLSET_CATALOG[task as AgentSkillsetId];
	if (!entry) throw new Error(`Unknown skillset: ${task}`);

	return {
		kind: "skillset",
		id: task,
		owner: "@cx/agent",
		sourceRef: `../docs/skills/skillsets/${task}.md`,
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			task,
			documents: entry.documents.map((document) => readSkillsetDocument({ ...document, task })),
		},
	};
}

function readSkillsetDocument(document: {
	kind: SkillsetDocument["kind"];
	sourceRef: string;
	task: string;
}): SkillsetDocument {
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

function readPriority(value: unknown): SkillsetDocument["priority"] | undefined {
	return value === "optional" || value === "recommended" || value === "required"
		? value
		: undefined;
}
