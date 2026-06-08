import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PromptCatalogObject } from "@cx/schema";
import { SSOT_OBJECT_SCHEMA_VERSION } from "@cx/schema";

export const AGENT_PROMPT_CATALOG = {
	"component-proposal": "../docs/prompts/component-proposal.md",
	"composition-planning": "../docs/prompts/composition-planning.md",
	"pattern-selection": "../docs/prompts/pattern-selection.md",
	"quality-review": "../docs/prompts/quality-review.md",
	"screen-generation": "../docs/prompts/screen-generation.md",
	"screen-intent": "../docs/prompts/screen-intent.md",
	"screen-revision": "../docs/prompts/screen-revision.md",
} as const;

export type AgentPromptCatalogId = keyof typeof AGENT_PROMPT_CATALOG;

export function resolvePromptCatalogForInference(id: string): PromptCatalogObject {
	const sourceRef = AGENT_PROMPT_CATALOG[id as AgentPromptCatalogId];
	if (!sourceRef) throw new Error(`Unknown prompt catalog: ${id}`);

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

function readPackageMarkdown(sourceRef: string): string {
	const currentDir = path.dirname(fileURLToPath(import.meta.url));
	return readFileSync(path.resolve(currentDir, "..", sourceRef), "utf8");
}
