export type ClaudeParsedResult = {
	payload: unknown;
};

export function parseClaudeJsonResult(rawText: string): ClaudeParsedResult {
	const jsonText = extractFirstJsonBlock(rawText);
	return {
		payload: JSON.parse(jsonText) as unknown,
	};
}

function extractFirstJsonBlock(rawText: string): string {
	const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
	if (fenced?.[1]) return fenced[1].trim();
	return rawText.trim();
}
