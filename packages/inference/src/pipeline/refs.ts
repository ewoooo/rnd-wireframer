import type {
	KnowledgeRef,
	OutputContractRef,
	StepInputRef,
	StepOutputFailurePolicy,
	StepRunCondition,
} from "../contracts";

export const jobInput = (path?: string): StepInputRef => ({ kind: "job-input", path });
export const context = (key: string): StepInputRef => ({ kind: "context", key });

/** camelCase(key) → context(key) for each key, e.g. contexts("source-spec") → { sourceSpec: … }. */
export const contexts = (...keys: string[]): Record<string, StepInputRef> =>
	Object.fromEntries(keys.map((key) => [camelCase(key), context(key)]));

export const knowledge = (source: KnowledgeRef["source"], id?: string): KnowledgeRef => ({
	source,
	id,
});

export const skillset = (task: string): KnowledgeRef => ({ source: "skillset", id: task });

export const referenceIndex = (category: string): KnowledgeRef => ({
	source: `reference-${category}-index`,
});

export const referenceCatalog = (category: string): KnowledgeRef => ({
	source: `reference-${category}-catalog`,
});

/**
 * Reference catalog narrowed at run time to the ids an upstream step adopted,
 * e.g. referenceSelection("area", "composition-plan", ["designTrace", "usedReferenceIds"]).
 */
export const referenceSelection = (
	category: string,
	contextKey: string,
	path: string[],
): KnowledgeRef => ({
	source: `reference-${category}-catalog`,
	selectFromContext: { contextKey, path },
});

export const outputContractRef = (id: string): OutputContractRef => ({
	source: "output-contract",
	id,
});

export const onValidationReportErrors = (contextKey: string): StepRunCondition => ({
	contextKey,
	kind: "context-validation-report-has-errors",
});

export const onQualityRevisionDirectives = (contextKey: string): StepRunCondition => ({
	contextKey,
	kind: "context-quality-has-revision-directives",
});

export const failOnValidationReportErrors: StepOutputFailurePolicy = {
	kind: "validation-report-has-errors",
};

function camelCase(key: string): string {
	return key.replace(/-([a-z0-9])/g, (_, ch: string) => ch.toUpperCase());
}
