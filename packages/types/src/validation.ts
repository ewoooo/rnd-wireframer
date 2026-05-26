export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationLayer =
	| "schema"
	| "node-type"
	| "contract"
	| "reference"
	| "tokens"
	| "version";

export type ValidationCode =
	| "schema.invalid"
	| "node-type.unknown"
	| "node-type.unregistered"
	| "contract.screen.missing"
	| "contract.screen.duplicate"
	| "contract.screen.order"
	| "contract.screen.invalid-child"
	| "contract.region.invalid-child"
	| "reference.duplicate-id"
	| "reference.missing-area"
	| "reference.missing-pattern"
	| "tokens.untokenized-spacing"
	| "tokens.value-outside-scale"
	| "tokens.unknown-token-role"
	| "version.invalid"
	| "version.incompatible";

export interface ValidationIssue {
	code: ValidationCode;
	severity: ValidationSeverity;
	layer: ValidationLayer;
	message: string;
	path?: ReadonlyArray<string | number>;
	nodeId?: string;
	nodeType?: string;
	data?: Record<string, unknown>;
}

export interface ValidationStats {
	totalNodes: number;
	maxDepth: number;
	componentTypes: string[];
	fallbackTypes: string[];
	rendererKinds: string[];
}

export interface ValidationResult<TData = unknown> {
	ok: boolean;
	issues: ValidationIssue[];
	data?: TData;
	stats?: ValidationStats;
}

export const errorsOf = (result: ValidationResult): ValidationIssue[] =>
	result.issues.filter((issue) => issue.severity === "error");

export const warningsOf = (result: ValidationResult): ValidationIssue[] =>
	result.issues.filter((issue) => issue.severity === "warning");

export const issuesByCode = (
	result: ValidationResult,
	code: ValidationCode,
): ValidationIssue[] => result.issues.filter((issue) => issue.code === code);

export const issuesByLayer = (
	result: ValidationResult,
	layer: ValidationLayer,
): ValidationIssue[] => result.issues.filter((issue) => issue.layer === layer);
