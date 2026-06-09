import type {
	KnowledgeRef,
	OutputContractRef,
	StepInputRef,
	StepOutputFailurePolicy,
	StepRunCondition,
} from "../contracts";

export const jobInput = (path?: string): StepInputRef => ({ kind: "job-input", path });
export const context = (key: string): StepInputRef => ({ kind: "context", key });

export const knowledge = (
	source: KnowledgeRef["source"],
	id?: string,
	version?: string,
): KnowledgeRef => ({
	source,
	id,
	version,
});

export const outputContractRef = (id: string, version?: string): OutputContractRef => ({
	source: "output-contract",
	id,
	version,
});

export const onValidationReportErrors = (contextKey: string): StepRunCondition => ({
	contextKey,
	kind: "context-validation-report-has-errors",
});

export const failOnValidationReportErrors: StepOutputFailurePolicy = {
	kind: "validation-report-has-errors",
};
