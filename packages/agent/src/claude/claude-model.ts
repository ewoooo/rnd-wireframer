export const DEFAULT_CLAUDE_GENERATION_MODEL = "claude-opus-4-7";

export function resolveClaudeGenerationModel(model?: string): string {
	const explicitModel = model?.trim();
	if (explicitModel) return explicitModel;

	const envModel = process.env.CLAUDE_GENERATION_MODEL?.trim();
	if (envModel) return envModel;

	return DEFAULT_CLAUDE_GENERATION_MODEL;
}
