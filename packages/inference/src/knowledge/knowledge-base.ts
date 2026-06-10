import {
	resolvePromptCatalogForInference,
	resolveReferenceForInference,
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
} as const satisfies Record<
	Exclude<KnowledgeRef["source"], `reference-${string}`>,
	KnowledgeResolver
>;

export function createInferenceKnowledgeBase(): KnowledgeBase {
	return {
		async resolve(ref) {
			const reference = parseReferenceSource(ref.source);
			if (reference) {
				return resolveReferenceForInference(reference.category, reference.mode);
			}
			const resolver = KNOWLEDGE_RESOLVERS[ref.source as keyof typeof KNOWLEDGE_RESOLVERS];
			if (!resolver) throw new Error(`Unknown knowledge source: ${ref.source}`);
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

function parseReferenceSource(
	source: string,
): { category: string; mode: "catalog" | "index" } | undefined {
	const m = /^reference-(.+)-(index|catalog)$/.exec(source);
	if (!m) return undefined;
	return { category: m[1], mode: m[2] as "catalog" | "index" };
}
