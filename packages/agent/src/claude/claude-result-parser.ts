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
	return extractBalancedJson(rawText.trim());
}

function extractBalancedJson(rawText: string): string {
	const start = findJsonStart(rawText);
	if (start === -1) return rawText;

	const stack: string[] = [];
	let inString = false;
	let escaped = false;

	for (let index = start; index < rawText.length; index += 1) {
		const char = rawText[index];

		if (escaped) {
			escaped = false;
			continue;
		}
		if (char === "\\") {
			escaped = inString;
			continue;
		}
		if (char === '"') {
			inString = !inString;
			continue;
		}
		if (inString) continue;

		if (char === "{" || char === "[") {
			stack.push(char === "{" ? "}" : "]");
			continue;
		}
		if (char !== "}" && char !== "]") continue;

		const expected = stack.pop();
		if (expected !== char) return rawText;
		if (stack.length === 0) return rawText.slice(start, index + 1);
	}

	return rawText;
}

function findJsonStart(rawText: string): number {
	const objectStart = rawText.indexOf("{");
	const arrayStart = rawText.indexOf("[");
	if (objectStart === -1) return arrayStart;
	if (arrayStart === -1) return objectStart;
	return Math.min(objectStart, arrayStart);
}
