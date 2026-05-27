export const orchestrationBoundary = {
	name: "pure-orchestration-boundary",
	packageName: "@cx/orchestration",
	owns: [
		"stage-input-build",
		"stage-output-routing",
		"next-action-decision",
		"workflow-state-transition",
	],
	rejects: [
		"file-system-write",
		"claude-agent-run",
		"validation-rule-judgement",
		"render-tree-react-render",
		"catalog-value-ownership",
	],
} as const;
