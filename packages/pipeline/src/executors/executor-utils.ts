export function stringifyArtifactContent(content: unknown): string {
	if (typeof content === "string") return content;
	return `${JSON.stringify(content, null, 2)}\n`;
}

export function getParentPath(path: string): string {
	const normalized = path.replaceAll("\\", "/");
	const index = normalized.lastIndexOf("/");
	if (index <= 0) return ".";
	return normalized.slice(0, index);
}
