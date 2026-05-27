const ARRAY_INDEX_PATTERN = /\[(\d+)\]/g;

export function getByPath(source: unknown, path: string): unknown {
	if (!path) return source;

	const segments = path
		.replace(ARRAY_INDEX_PATTERN, ".$1")
		.split(".")
		.map((segment) => segment.trim())
		.filter(Boolean);

	let current = source;
	for (const segment of segments) {
		if (current === null || current === undefined) return undefined;

		if (Array.isArray(current)) {
			const index = Number(segment);
			if (!Number.isInteger(index)) return undefined;
			current = current[index];
			continue;
		}

		if (typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[segment];
	}

	return current;
}
