import { readFileSync } from "node:fs";
import { type PromptCatalogObject, type SkillObject, SSOT_OBJECT_SCHEMA_VERSION } from "@cx/schema";

const SKILL_DOCS = {
	"component-proposal": "../docs/component-proposal/checklist.md",
	"detail-confirmation-screen": "../docs/design-skills/detail-confirmation-screen.md",
	"form-entry-screen": "../docs/design-skills/form-entry-screen.md",
	"list-selection-screen": "../docs/design-skills/list-selection-screen.md",
	"quality-review": "../docs/quality-review/checklist.md",
	"screen-generation": "../docs/screen-generation/checklist.md",
} as const;

const PROMPT_DOCS = {
	"component-proposal": "../docs/component-proposal/prompt-contract.md",
	"quality-review": "../docs/quality-review/prompt-contract.md",
	"screen-generation": "../docs/screen-generation/prompt-contract.md",
} as const;

export type AgentSkillId = keyof typeof SKILL_DOCS;
export type AgentPromptCatalogId = keyof typeof PROMPT_DOCS;

export function resolveSkillForInference(id: string): SkillObject {
	const sourceRef = readKnownRef(SKILL_DOCS, id, "skill");
	const body = readPackageMarkdown(sourceRef);
	return {
		kind: "skill",
		id,
		owner: "@cx/agent",
		sourceRef,
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			format: "markdown",
			body,
			frontmatter: parseFrontmatter(body),
		},
	};
}

export function resolvePromptCatalogForInference(id: string): PromptCatalogObject {
	const sourceRef = readKnownRef(PROMPT_DOCS, id, "prompt catalog");
	return {
		kind: "prompt-catalog",
		id,
		owner: "@cx/agent",
		sourceRef,
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			template: readPackageMarkdown(sourceRef),
			variables: {},
		},
	};
}

function readKnownRef<T extends Record<string, string>>(
	refs: T,
	id: string,
	label: string,
): T[keyof T] {
	if (id in refs) return refs[id as keyof T];
	throw new Error(`Unknown ${label}: ${id}`);
}

function readPackageMarkdown(sourceRef: string): string {
	return readFileSync(new URL(sourceRef, import.meta.url), "utf8");
}

function parseFrontmatter(body: string): Record<string, unknown> | undefined {
	if (!body.startsWith("---\n")) return undefined;
	const end = body.indexOf("\n---", 4);
	if (end < 0) return undefined;
	const entries = body
		.slice(4, end)
		.split("\n")
		.map((line) => line.split(":").map((part) => part.trim()))
		.filter((parts): parts is [string, string] => parts.length >= 2 && parts[0].length > 0);
	return Object.fromEntries(entries);
}
