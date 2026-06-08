import { resolvePromptCatalogForInference, resolveSkillForInference } from "@cx/agent";
import { resolveComponentCatalogForInference } from "@cx/components/catalog";
import { resolveLayoutCatalogForInference } from "@cx/layout/catalog";
import { resolveOutputContractForInference } from "@cx/schema";
import { resolveTokenCatalogForInference } from "@cx/tokens";
import type { KnowledgeBase } from "../contracts";

export function createInferenceKnowledgeBase(): KnowledgeBase {
	return {
		async resolve(ref) {
			if (ref.source === "component-catalog") {
				return resolveComponentCatalogForInference();
			}
			if (ref.source === "layout-catalog") {
				return resolveLayoutCatalogForInference();
			}
			if (ref.source === "skill" && ref.id) {
				return resolveSkillForInference(ref.id);
			}
			if (ref.source === "prompt-catalog" && ref.id) {
				return resolvePromptCatalogForInference(ref.id);
			}
			if (ref.source === "token-catalog") {
				return resolveTokenCatalogForInference();
			}
			throw new Error(
				`Unsupported knowledge reference for MVP: ${ref.source}:${ref.id ?? "missing-id"}`,
			);
		},

		async resolveOutputContract(ref) {
			return resolveOutputContractForInference(ref.id);
		},
	};
}
