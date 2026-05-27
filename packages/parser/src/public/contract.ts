export const parserBoundary = {
	name: "pure-source-parser-boundary",
	packageName: "@cx/parser",
	owns: ["markdown-source-parse", "source-spec-build", "source-metadata-extract"],
	rejects: [
		"file-system-read",
		"file-system-write",
		"claude-agent-run",
		"draft-candidate-generation",
		"render-tree-build",
		"render-tree-react-render",
		"validation-rule-judgement",
	],
} as const;
