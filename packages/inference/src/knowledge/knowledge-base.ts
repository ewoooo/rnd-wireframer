import {
	resolvePromptCatalogForInference,
	resolveSkillForInference,
	resolveStageSkillsetForInference,
} from "@cx/agent";
import { resolveComponentCatalogForInference } from "@cx/external/resolver";
import { resolveLayoutCatalogForInference } from "@cx/layout/resolver";
import { resolveOutputContractForInference } from "@cx/schema";
import { resolveTokenCatalogForInference } from "@cx/tokens";
import type { KnowledgeBase, KnowledgeRef, KnowledgeValue } from "../contracts";

type KnowledgeResolver = {
	requiresId?: boolean;
	resolve: (ref: KnowledgeRef) => KnowledgeValue | Promise<KnowledgeValue>;
};

const KNOWLEDGE_RESOLVERS = {
	"component-catalog": {
		requiresId: false,
		resolve: () => resolveComponentCatalogForInference(),
	},
	"layout-catalog": {
		requiresId: false,
		resolve: () => resolveLayoutCatalogForInference(),
	},
	"prompt-catalog": {
		requiresId: true,
		resolve: (ref) => resolvePromptCatalogForInference(readRequiredKnowledgeId(ref)),
	},
	skill: {
		requiresId: true,
		resolve: (ref) => resolveSkillForInference(readRequiredKnowledgeId(ref)),
	},
	"stage-skillset": {
		requiresId: true,
		resolve: (ref) => resolveStageSkillsetForInference(readRequiredKnowledgeId(ref)),
	},
	"token-catalog": {
		requiresId: false,
		resolve: () => resolveTokenCatalogForInference(),
	},
} as const satisfies Record<KnowledgeRef["source"], KnowledgeResolver>;

export function createInferenceKnowledgeBase(): KnowledgeBase {
	return {
		async resolve(ref) {
			const resolver = KNOWLEDGE_RESOLVERS[ref.source];
			if (resolver.requiresId) readRequiredKnowledgeId(ref);
			return resolver.resolve(ref);
		},

		async resolveOutputContract(ref) {
			return resolveOutputContractForInference(ref.id);
		},
	};
}

function readRequiredKnowledgeId(ref: KnowledgeRef): string {
	if (ref.id) return ref.id;
	throw new Error(`Unsupported knowledge reference for MVP: ${ref.source}:missing-id`);
}
