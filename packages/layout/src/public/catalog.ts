import { type LayoutCatalogObject, SSOT_OBJECT_SCHEMA_VERSION } from "@cx/schema";
import { patternCatalogSets } from "../pattern-internal/data";
import { layoutPatternCatalogSchema, patternStoreSchema } from "../pattern-internal/schema";
import {
	findPattern,
	listPatternSummaries,
	listPatterns,
	loadPatternStore,
} from "../pattern-internal/store";
import type {
	ChildrenLayoutPreset,
	CreateLayoutCandidateInput,
	LayoutCatalogListOptions,
	LayoutPatternCatalog,
	LayoutPatternCatalogEntry,
	PatternStoreIssue,
	PatternStoreMutationResult,
	PatternStoreTarget,
} from "./types";

export type { PatternSummary } from "../pattern-internal/store";
export type {
	CreateLayoutCandidateInput,
	LayoutCatalogListOptions,
	LayoutPatternCatalogEntry,
} from "./types";
export { findPattern, listPatternSummaries, listPatterns, loadPatternStore };

export function createCandidate(input: CreateLayoutCandidateInput): PatternStoreMutationResult {
	const patterns = [...listCatalog(), input.entry];
	const parsedCatalog = layoutPatternCatalogSchema.safeParse({ patterns });
	if (!parsedCatalog.success)
		return { ok: false, issues: toPatternStoreIssues(parsedCatalog.error) };

	const parsedStore = patternStoreSchema.safeParse(parsedCatalog.data);
	if (!parsedStore.success) return { ok: false, issues: toPatternStoreIssues(parsedStore.error) };

	const pattern = parsedStore.data.patterns[parsedStore.data.patterns.length - 1];
	return {
		ok: true,
		store: parsedStore.data,
		pattern,
		changes: pattern
			? [
					{
						type: "create",
						id: pattern.id,
						target: pattern.target,
						after: pattern,
					},
				]
			: [],
	};
}

export function getEntry(
	id: string,
	options: Pick<LayoutCatalogListOptions, "target"> = {},
): LayoutPatternCatalogEntry | undefined {
	return listCatalog(options).find((entry) => entry.id === id);
}

export function listCatalog(options: LayoutCatalogListOptions = {}): LayoutPatternCatalogEntry[] {
	return loadLayoutPatternCatalog().patterns.filter((entry) => {
		if (options.target && entry.target !== options.target) return false;
		if (options.status && entry.status !== options.status) return false;
		return true;
	});
}

export function listCatalogIds(options: LayoutCatalogListOptions = {}): string[] {
	return listCatalog(options)
		.map((entry) => entry.id)
		.sort();
}

export function getPatternPreset<TTarget extends PatternStoreTarget>(
	patternId: string | undefined,
	patternVariant: string | undefined,
	target: TTarget,
): ChildrenLayoutPreset | undefined {
	if (!patternId) return undefined;

	const pattern = findPattern(patternId, target);
	if (!pattern) return undefined;

	const variant = patternVariant ?? pattern.defaultVariant;
	return pattern.variants[variant];
}

export function resolveLayoutCatalogForInference(): LayoutCatalogObject {
	return {
		kind: "layout-catalog",
		id: "default",
		owner: "@cx/layout",
		sourceRef: "catalog",
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			screen: listCatalog({ target: "screen" }),
			region: listCatalog({ target: "region" }),
			area: listCatalog({ target: "area" }),
			composite: listCatalog({ target: "composite" }),
		},
	};
}

function loadLayoutPatternCatalog() {
	return layoutPatternCatalogSchema.parse({
		patterns: patternCatalogSets.flatMap((set) => (set as { patterns: unknown[] }).patterns),
	}) as LayoutPatternCatalog;
}

function toPatternStoreIssues(error: { issues: Array<{ message: string; path: unknown[] }> }) {
	return error.issues.map(
		(issue): PatternStoreIssue => ({
			code: "schema-invalid",
			message: issue.message,
			path: issue.path.filter((segment): segment is string | number => {
				return typeof segment === "string" || typeof segment === "number";
			}),
		}),
	);
}
