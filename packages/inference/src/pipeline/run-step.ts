import { validateJsonSchema } from "@cx/validation";
import type { InferenceStepDefinition, StepExecution, StepRunContext } from "../contracts";

export async function runStep(
	step: InferenceStepDefinition,
	context: StepRunContext,
): Promise<StepExecution> {
	const inputs = await resolveInputs(step, context);
	const references = await resolveReferences(step, context);
	const outputContract = await context.resolveOutputContract(step.output.contractRef);
	const engine = context.engines[step.engine];
	const prompt = step.prompt;
	const MAX_ATTEMPTS = 2; // 1 retry

	let lastError: { code: string; message: string } = {
		code: "engine_execution_failed",
		message: "engine did not run",
	};
	let lastRaw: unknown;

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
		try {
			const result = await engine.execute({
				prompt,
				run: step.run,
				inputs,
				references,
				outputContract,
			});
			lastRaw = result.raw;

			const report = validateJsonSchema(outputContract.data.jsonSchema, result.raw);
			if (!report.ok) {
				lastError = {
					code: "output_contract_validation_failed",
					message: report.issues.map((issue) => issue.message).join("; "),
				};
				continue;
			}

			if (
				step.output.failJobWhenValidationReportHasErrors &&
				readValidationErrorCount(result.raw) > 0
			) {
				return {
					status: "failed",
					inputs,
					references,
					outputContract,
					prompt,
					raw: result.raw,
					contextWrites: step.output.writeToContext
						? { [step.output.writeToContext]: result.raw }
						: undefined,
					error: {
						code: "deterministic_validation_failed",
						message: "Deterministic validation still has errors after one revision attempt.",
					},
				};
			}

			return {
				status: "succeeded",
				inputs,
				references,
				outputContract,
				prompt,
				raw: result.raw,
				contextWrites: step.output.writeToContext
					? { [step.output.writeToContext]: result.raw }
					: undefined,
			};
		} catch (error: unknown) {
			lastRaw = undefined;
			lastError = normalizeEngineError(error);
		}
	}

	return {
		status: "failed",
		inputs,
		references,
		outputContract,
		prompt,
		raw: lastRaw,
		error: lastError,
	};
}

function normalizeEngineError(error: unknown): { code: string; message: string } {
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
