import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SkillObject } from "@cx/schema";
import { SSOT_OBJECT_SCHEMA_VERSION } from "@cx/schema";

export const AGENT_SKILL_CATALOG = {
	"component-proposal": {
		checklist: "../docs/skills/component-proposal/checklist.md",
		"output-contract": "../docs/skills/component-proposal/output-contract.md",
	},
	"detail-confirmation-screen": {
		skill: "../docs/skills/design-skills/detail-confirmation-screen/README.md",
	},
	"form-entry-screen": {
		skill: "../docs/skills/design-skills/form-entry-screen/README.md",
	},
	"list-selection-screen": {
		skill: "../docs/skills/design-skills/list-selection-screen/README.md",
	},
	"quality-review": {
		checklist: "../docs/skills/quality-review/checklist.md",
		"output-contract": "../docs/skills/quality-review/output-contract.md",
	},
	"screen-generation": {
		checklist: "../docs/skills/screen-generation/checklist.md",
		"output-contract": "../docs/skills/screen-generation/output-contract.md",
	},
} as const;

export type AgentSkillId = keyof typeof AGENT_SKILL_CATALOG;

export function resolveSkillForInference(id: string): SkillObject {
	const entry = AGENT_SKILL_CATALOG[id as AgentSkillId];
	if (!entry) throw new Error(`Unknown skill: ${id}`);

	return {
		kind: "skill",
		id,
		owner: "@cx/agent",
		sourceRef: `../docs/skills/${id}`,
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			format: "json",
			sets: Object.fromEntries(
				Object.entries(entry).map(([name, sourceRef]) => {
					const body = readPackageMarkdown(sourceRef);
					return [
						name,
						{
							format: "markdown",
							body,
							frontmatter: parseFrontmatter(body),
							sourceRef,
						},
					];
				}),
			),
		},
	};
}

function readPackageMarkdown(sourceRef: string): string {
	const currentDir = path.dirname(fileURLToPath(import.meta.url));
	return readFileSync(path.resolve(currentDir, "..", sourceRef), "utf8");
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
