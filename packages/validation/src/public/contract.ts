export const validationBoundary = {
	name: "pure-validation-boundary",
	packageName: "@cx/validation",
	owns: [
		"dto-contract-check",
		"component-reference-check",
		"layout-pattern-reference-check",
		"token-reference-check",
		"validation-report-build",
	],
	rejects: [
		"file-system-write",
		"claude-agent-run",
		"retry-policy-decision",
		"workflow-state-transition",
		"render-tree-react-render",
		"catalog-value-mutation",
	],
} as const;
