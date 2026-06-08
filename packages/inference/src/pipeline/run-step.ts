import { validateJsonSchema } from "@cx/validation";
import type { InferenceStepDefinition, StepExecution, StepRunContext } from "../contracts";

const MAX_ATTEMPTS = 2; // initial attempt + one retry

type StepResolvedContext = Pick<
	StepExecution,
	"inputs" | "references" | "outputContract" | "prompt"
>;

type StepFailure = {
	code: string;
	message: string;
	raw?: unknown;
	contextWrites?: Record<string, unknown>;
};

type AttemptResult =
	| { kind: "succeeded"; execution: StepExecution }
	| { kind: "failed"; execution: StepExecution }
	| { kind: "retry"; failure: StepFailure };

export async function runStep(
	step: InferenceStepDefinition,
	context: StepRunContext,
): Promise<StepExecution> {
	const inputs = await resolveInputs(step, context);
	const references = await resolveReferences(step, context);
	const outputContract = await context.resolveOutputContract(step.output.contractRef);
	const engine = context.engines[step.engine];
	const prompt = step.prompt;
	const resolved = { inputs, references, outputContract, prompt };
	let lastFailure: StepFailure = createInitialFailure();

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
		const result = await runAttempt(step, engine, resolved);
		if (result.kind !== "retry") return result.execution;
		lastFailure = result.failure;
	}

	return createFailedExecution(resolved, lastFailure);
}

async function runAttempt(
	step: InferenceStepDefinition,
	engine: StepRunContext["engines"][InferenceStepDefinition["engine"]],
	resolved: StepResolvedContext,
): Promise<AttemptResult> {
	try {
		const result = await engine.execute({
			prompt: resolved.prompt,
			run: step.run,
			inputs: resolved.inputs,
			references: resolved.references,
			outputContract: resolved.outputContract,
		});
		const raw = result.raw;
		const contextWrites = createContextWrites(step, raw);
		const contractFailure = validateOutputContract(resolved, raw);

		if (contractFailure) {
			return { kind: "retry", failure: contractFailure };
		}

		if (shouldFailForValidationErrors(step, raw)) {
			return {
				kind: "failed",
				execution: createFailedExecution(resolved, {
					code: "deterministic_validation_failed",
					message: "Deterministic validation still has errors after one revision attempt.",
					contextWrites,
					raw,
				}),
			};
		}

		return {
			kind: "succeeded",
			execution: createSucceededExecution(resolved, raw, contextWrites),
		};
	} catch (error: unknown) {
		return {
			kind: "retry",
			failure: normalizeEngineError(error),
		};
	}
}

function validateOutputContract(
	resolved: StepResolvedContext,
	raw: unknown,
): StepFailure | undefined {
	const report = validateJsonSchema(resolved.outputContract.data.jsonSchema, raw);
	if (report.ok) return undefined;
	return {
		code: "output_contract_validation_failed",
		message: report.issues.map((issue) => issue.message).join("; "),
		raw,
	};
}

function shouldFailForValidationErrors(step: InferenceStepDefinition, raw: unknown): boolean {
	return (
		step.output.failJobWhenValidationReportHasErrors === true && readValidationErrorCount(raw) > 0
	);
}

function createSucceededExecution(
	resolved: StepResolvedContext,
	raw: unknown,
	contextWrites: Record<string, unknown> | undefined,
): StepExecution {
	return {
		status: "succeeded",
		...resolved,
		raw,
		contextWrites,
	};
}

function createFailedExecution(resolved: StepResolvedContext, failure: StepFailure): StepExecution {
	return {
		status: "failed",
		...resolved,
		raw: failure.raw,
		contextWrites: failure.contextWrites,
		error: {
			code: failure.code,
			message: failure.message,
		},
	};
}

function createContextWrites(
	step: InferenceStepDefinition,
	raw: unknown,
): Record<string, unknown> | undefined {
	return step.output.writeToContext ? { [step.output.writeToContext]: raw } : undefined;
}

function createInitialFailure(): StepFailure {
	return {
		code: "engine_execution_failed",
		message: "engine did not run",
	};
}

function normalizeEngineError(error: unknown): StepFailure {
	if (error && typeof error === "object" && "code" in error && "message" in error) {
		return error as { code: string; message: string };
	}
	return {
		code: "engine_execution_failed",
		message: error instanceof Error ? error.message : String(error),
	};
}

function readValidationErrorCount(input: unknown): number {
	if (!input || typeof input !== "object" || Array.isArray(input)) return 0;
	const summary = (input as Record<string, unknown>).summary;
	if (!summary || typeof summary !== "object" || Array.isArray(summary)) return 0;
	const errorCount = (summary as Record<string, unknown>).errorCount;
	return typeof errorCount === "number" ? errorCount : 0;
}

async function resolveInputs(step: InferenceStepDefinition, context: StepRunContext) {
	const resolved: Record<string, unknown> = {};
	for (const [name, ref] of Object.entries(step.inputs ?? {})) {
		resolved[name] = await context.resolveInput(ref);
	}
	return resolved;
}

async function resolveReferences(step: InferenceStepDefinition, context: StepRunContext) {
	const resolved: StepExecution["references"] = {};
	for (const [name, ref] of Object.entries(step.references ?? {})) {
		resolved[name] = await context.resolveReference(ref);
	}
	return resolved;
}
