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
	const prompt = step.prompt
		? { messages: [{ role: "user", content: JSON.stringify({ inputs, references }) }] }
		: undefined;
	const result = await engine.execute({
		prompt,
		run: step.run,
		inputs,
		references,
		outputContract,
	});

	const report = validateJsonSchema(outputContract.data.jsonSchema, result.raw);
	if (!report.ok) {
		return {
			status: "failed",
			inputs,
			references,
			outputContract,
			prompt,
			raw: result.raw,
			error: {
				code: "output_contract_validation_failed",
				message: report.issues.map((issue) => issue.message).join("; "),
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
		output: result.raw,
		contextWrites: step.output.writeToContext
			? { [step.output.writeToContext]: result.raw }
			: undefined,
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
	for (const [name, ref] of Object.entries(step.references ?? {})) {
		resolved[name] = await context.resolveReference(ref);
	}
	return resolved;
}
