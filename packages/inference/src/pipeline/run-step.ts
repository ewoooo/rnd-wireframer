import { validateJsonSchema } from "@cx/validation";
import type { InferenceStepDefinition, StepExecution, StepRunContext } from "../contracts";
import { evaluateStepOutputPolicy } from "../policies/inference-policy";

const MAX_ATTEMPTS = 2; // initial attempt + one retry

type StepResolvedContext = Pick<StepExecution, "inputs" | "references" | "outputContract">;

type StepFailure = {
	code: string;
	message: string;
	raw?: unknown;
	prompt?: unknown;
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
	const engine = context.engines[step.run ? "function" : "claude"];
	const resolved = { inputs, references, outputContract };
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
	engine: StepRunContext["engines"]["claude" | "function"],
	resolved: StepResolvedContext,
): Promise<AttemptResult> {
	try {
		const result = await engine.execute({
			task: step.task,
			run: step.run,
			inputs: resolved.inputs,
			references: resolved.references,
			outputContract: resolved.outputContract,
		});
		const { raw, prompt } = result;
		const contextWrites = createContextWrites(step, raw);
		const contractFailure = validateOutputContract(resolved, raw);

		if (contractFailure) {
			return { kind: "retry", failure: { ...contractFailure, prompt } };
		}

		const policyFailure = evaluateStepOutputPolicy(step, raw);
		if (policyFailure) {
			return {
				kind: "failed",
				execution: createFailedExecution(resolved, {
					code: policyFailure.code,
					message: policyFailure.message,
					contextWrites,
					prompt,
					raw,
				}),
			};
		}

		return {
			kind: "succeeded",
			execution: { status: "succeeded", ...resolved, prompt, raw, contextWrites },
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

function createFailedExecution(resolved: StepResolvedContext, failure: StepFailure): StepExecution {
	return {
		status: "failed",
		...resolved,
		prompt: failure.prompt,
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
	if (step.output.writeToContext === false) return undefined;
	const key = step.output.writeToContext ?? step.output.contractRef.id;
	return { [key]: raw };
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

async function resolveInputs(step: InferenceStepDefinition, context: StepRunContext) {
	const resolved: Record<string, unknown> = {};
	for (const [name, ref] of Object.entries(step.inputs ?? {})) {
		resolved[name] = await context.resolveInput(ref);
	}
	return resolved;
}

async function resolveReferences(step: InferenceStepDefinition, context: StepRunContext) {
	const resolved: StepExecution["references"] = {};
	// A claude step implicitly loads the skillset named after its task; an explicit
	// references.skillset declaration overrides the convention.
	if (step.task && !step.references?.skillset) {
		resolved.skillset = await context.resolveReference({ source: "skillset", id: step.task });
	}
	for (const [name, ref] of Object.entries(step.references ?? {})) {
		resolved[name] = await context.resolveReference(ref);
	}
	return resolved;
}
