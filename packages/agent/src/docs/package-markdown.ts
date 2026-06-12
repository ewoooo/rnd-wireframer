import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type AgentMarkdownDocument = {
	body: string;
	frontmatter: Record<string, unknown>;
	sourceRef: string;
};

export function readAgentMarkdownDocument(sourceRef: string): AgentMarkdownDocument {
	const body = readAgentPackageMarkdown(sourceRef);
	return {
		body,
		frontmatter: parseMarkdownFrontmatter(body),
		sourceRef,
	};
}

export function readAgentPackageMarkdown(sourceRef: string): string {
	return readFileSync(resolveAgentPackagePath(sourceRef), "utf8");
}

function resolveAgentPackagePath(sourceRef: string): string {
	const currentDir = path.dirname(fileURLToPath(import.meta.url));
	return path.resolve(currentDir, "..", sourceRef);
}

function parseMarkdownFrontmatter(body: string): Record<string, unknown> {
	if (!body.startsWith("---\n")) return {};
	const end = body.indexOf("\n---", 4);
	if (end < 0) return {};

	const frontmatter: Record<string, unknown> = {};
	let currentListKey: string | undefined;
	for (const rawLine of body.slice(4, end).split("\n")) {
		const line = rawLine.trimEnd();
		if (!line.trim()) continue;
		if (line.trimStart().startsWith("- ") && currentListKey) {
			const items = Array.isArray(frontmatter[currentListKey])
				? (frontmatter[currentListKey] as string[])
				: [];
			items.push(line.trimStart().slice(2).trim());
			frontmatter[currentListKey] = items;
			continue;
		}

		currentListKey = undefined;
		const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
		if (!match) continue;
		const [, key, value] = match;
		if (value.length === 0) {
			frontmatter[key] = [];
			currentListKey = key;
			continue;
		}
		frontmatter[key] = value.replace(/^["']|["']$/g, "");
	}
	return frontmatter;
}
