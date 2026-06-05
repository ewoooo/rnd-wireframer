export type NormalizedAgentError = {
	name: string;
	message: string;
};

export function normalizeAgentError(error: unknown): NormalizedAgentError {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
		};
	}

	return {
		name: "UnknownAgentError",
		message: String(error),
	};
}
