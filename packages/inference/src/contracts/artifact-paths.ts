export const INFERENCE_ARTIFACT_PATH = {
	events: "events.ndjson",
	job: "job.json",
	contextJson: (key: string) => `context/${key}.json`,
	contextText: (key: string) => `context/${key}`,
	step: {
		inputs: (stepId: string) => `steps/${stepId}/inputs.json`,
		output: (stepId: string) => `steps/${stepId}/output.json`,
		outputContract: (stepId: string) => `steps/${stepId}/output-contract.json`,
		prompt: (stepId: string) => `steps/${stepId}/prompt.json`,
		rawResponse: (stepId: string) => `steps/${stepId}/raw-response.json`,
		references: (stepId: string) => `steps/${stepId}/references.json`,
		state: (stepId: string) => `steps/${stepId}/step.json`,
	},
} as const;
