export type PromptContext = {
	query: string;
	context?: unknown;
	previousResult?: unknown;
};

export function createPromptContext(input: PromptContext): PromptContext {
	return input;
}
