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
	| "version.incompatible"
	// ── AI Composition (Schema B / Validator #1) ─────────────
	| "composition.mode.mismatch"
	| "composition.source-ref.unknown-area"
	| "composition.source-ref.unknown-component"
	| "composition.source-refs.empty"
	| "composition.target.unknown-area"
	| "composition.area.merge.insufficient-sources"
	| "composition.area.split.duplicate-target-missing"
	| "composition.area.synthesize.missing-reason"
	| "composition.screen.strategy.invalid"
	| "composition.screen.archetype.mismatch"
	| "composition.completeness.missing-block"
	| "composition.visual-hierarchy.missing"
	| "composition.proposed.reference-missing"
	| "composition.gap.reference-missing"
	| "composition.primitive.unknown"
	| "composition.primitive.variant.unknown"
	| "composition.component-pattern.unknown"
	| "composition.prop-contract.violation"
	| "composition.token-role.violation"
	| "composition.design-refs.missing"
	// ── ComponentPattern (Schema C) ──────────────────────────
	| "component-pattern.propose.incomplete"
	| "component-pattern.propose.scope-violation"
	| "component-pattern.cycle"
	// ── LayoutPattern (Schema B draft / Validator #2) ────────
	| "layout-pattern.draft.missing"
	| "layout-pattern.draft.unknown"
	| "layout-pattern.variant.unknown"
	| "layout-pattern.node-kind.incompatible"
	| "layout-pattern.tree.mutated"
	| "layout-pattern.verification.reasons-missing"
	| "layout-pattern.verification.change-unjustified"
	// ── GapReport (Schema D) ─────────────────────────────────
	| "gap-report.incomplete"
	// ── Resolver / cross-cutting ─────────────────────────────
	| "resolver.variant.duplicate-resolve"
	| "cross-table.invariant.mismatch";

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

export const issuesByCode = (result: ValidationResult, code: ValidationCode): ValidationIssue[] =>
	result.issues.filter((issue) => issue.code === code);

export const issuesByLayer = (
	result: ValidationResult,
	layer: ValidationLayer,
): ValidationIssue[] => result.issues.filter((issue) => issue.layer === layer);
