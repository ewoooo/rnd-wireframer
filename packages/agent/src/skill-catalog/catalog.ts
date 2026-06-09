import type { SkillObject } from "@cx/schema";
import { SSOT_OBJECT_SCHEMA_VERSION } from "@cx/schema";
import { readAgentMarkdownDocument } from "../docs/package-markdown";

export const AGENT_SKILL_CATALOG = {
	"component-proposal": {
		sets: {
			checklist: "../docs/skills/component-proposal/checklist.md",
			"output-contract": "../docs/skills/component-proposal/output-contract.md",
		},
	},
	"detail-confirmation-screen": {
		sets: {
			skill: "../docs/skills/design-skills/detail-confirmation-screen/README.md",
		},
	},
	"form-entry-screen": {
		sets: {
			skill: "../docs/skills/design-skills/form-entry-screen/README.md",
		},
	},
	"list-selection-screen": {
		sets: {
			skill: "../docs/skills/design-skills/list-selection-screen/README.md",
		},
	},
	"quality-review": {
		sets: {
			checklist: "../docs/skills/quality-review/checklist.md",
			"output-contract": "../docs/skills/quality-review/output-contract.md",
		},
	},
	"screen-generation": {
		sets: {
			checklist: "../docs/skills/screen-generation/checklist.md",
			"output-contract": "../docs/skills/screen-generation/output-contract.md",
		},
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
		sourceRef: readPrimarySkillSourceRef(entry.sets),
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			format: "json",
			sets: Object.fromEntries(
				Object.entries(entry.sets).map(([name, sourceRef]) => {
					const document = readAgentMarkdownDocument(sourceRef);
					return [
						name,
						{
							format: "markdown",
							body: document.body,
							frontmatter:
								Object.keys(document.frontmatter).length > 0 ? document.frontmatter : undefined,
							sourceRef: document.sourceRef,
						},
					];
				}),
			),
		},
	};
}

function readPrimarySkillSourceRef(sets: Readonly<Record<string, string>>): string {
	const [sourceRef] = Object.values(sets);
	if (!sourceRef) throw new Error("Skill catalog entry requires at least one set.");
	return sourceRef;
}
