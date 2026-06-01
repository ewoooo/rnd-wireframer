import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Convert a shell-style glob (`*`, `?`) to an anchored RegExp.
 * Every other character is treated as a literal and regex-escaped.
 */
export function globToRegExp(pattern: string): RegExp {
	let body = "";
	for (const char of pattern) {
		if (char === "*") {
			body += ".*";
		} else if (char === "?") {
			body += ".";
		} else {
			body += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
		}
	}
	return new RegExp(`^${body}$`);
}

/**
 * Collect markdown files in `dir` as sorted absolute paths.
 * When `glob` is provided, filter by matching it against the file basename.
 * A missing or unreadable directory yields an empty list.
 */
export async function resolveBatchTargets(dir: string, glob?: string): Promise<string[]> {
	const matcher = glob ? globToRegExp(glob) : undefined;

	let entries: Awaited<ReturnType<typeof readdir>>;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return [];
	}

	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
		.filter((entry) => (matcher ? matcher.test(entry.name) : true))
		.map((entry) => entry.name)
		.sort((left, right) => left.localeCompare(right))
		.map((name) => path.join(dir, name));
}
