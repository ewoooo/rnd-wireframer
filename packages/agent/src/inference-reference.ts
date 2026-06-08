import type { PromptCatalogObject, SkillObject } from "@cx/schema";
import {
	type AgentPromptCatalogId,
	resolvePromptCatalogForInference as resolvePromptCatalogObject,
} from "./prompt-catalog/catalog";
import {
	type AgentSkillId,
	resolveSkillForInference as resolveSkillObject,
} from "./skill-catalog/catalog";

export type { AgentPromptCatalogId, AgentSkillId };

export function resolveSkillForInference(id: string): SkillObject {
	return resolveSkillObject(id);
}

export function resolvePromptCatalogForInference(id: string): PromptCatalogObject {
	return resolvePromptCatalogObject(id);
}
