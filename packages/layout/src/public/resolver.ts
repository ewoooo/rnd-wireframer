import { isRecord } from "@cx/types/guards";
import type { LayoutPatternComponent, LayoutPatternComponentProps } from "../components/patterns/types";
import { componentSignals, scorePatternSignals } from "../pattern-internal/matcher";
import { findPattern, listPatterns } from "../pattern-internal/store";
import type {
	DatabasePatternRef,
	LayoutPatternCatalogEntry,
	PatternStorePattern,
	PatternStoreTarget,
	ScreenRegionType,
} from "./types";

export type PatternResolveIssueCode = "missing-pattern" | "missing-component";

export type PatternResolveIssue = {
	code: PatternResolveIssueCode;
	message: string;
	path?: Array<string | number>;
};

export type ResolvePatternComponentInput = {
	layoutId?: string;
	patternId?: string;
	props?: Record<string, unknown>;
	target?: PatternStoreTarget;
};

export type ResolvedPatternComponent = {
	Component: LayoutPatternComponent;
	componentProps: LayoutPatternComponentProps;
	issues: PatternResolveIssue[];
	pattern: LayoutPatternCatalogEntry;
};

export function resolvePatternComponent(
	input: ResolvePatternComponentInput,
): ResolvedPatternComponent | undefined {
	throw new Error(
		`resolvePatternComponent requires @cx/layout/components. Use the components subpath for render-time layout resolution. Received ${input.layoutId ?? input.patternId ?? "missing layout id"}.`,
	);
}

export function resolveCompositePatternByComponentType(
	type: string,
): DatabasePatternRef | undefined {
	const signals = componentSignals(type);
	const scored = listPatterns("composite")
		.map((pattern) => ({
			pattern,
			score: scorePatternSignals(pattern.resolution, signals),
		}))
		.filter((entry) => entry.score > 0)
		.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
	const selected = scored[0]?.pattern;
	return selected ? { id: selected.id, variant: selected.defaultVariant } : undefined;
}

export function resolveCompositeLayoutByComponentType(type: string): string | undefined {
	const pattern = resolveCompositePatternByComponentType(type);
	return pattern ? `layout.composite.${pattern.id}` : undefined;
}

export function resolveContentsRegionPatternFromScreenPattern(args: {
	compositionText: string;
	fallback: DatabasePatternRef;
	screenPattern: DatabasePatternRef;
}): DatabasePatternRef {
	const screenPattern = findPattern(args.screenPattern.id, "screen");
	const variant =
		screenPattern?.variants[args.screenPattern.variant ?? screenPattern.defaultVariant];
	const resolved = findRegionPatternFromScreenLayoutProps(
		variant?.layoutProps,
		args.compositionText.toLowerCase(),
	);
	return resolved ?? args.fallback;
}

export function resolveRegionPatternFromScreenPattern(args: {
	compositionText: string;
	fallbackByType: Record<ScreenRegionType, DatabasePatternRef>;
	screenPattern: DatabasePatternRef;
	type: ScreenRegionType;
}): DatabasePatternRef {
	if (args.type !== "Screen.Contents") return args.fallbackByType[args.type];
	return resolveContentsRegionPatternFromScreenPattern({
		compositionText: args.compositionText,
		fallback: args.fallbackByType[args.type],
		screenPattern: args.screenPattern,
	});
}

export function resolveRegionLayoutFromScreenLayout(args: {
	compositionText: string;
	fallbackByType: Record<ScreenRegionType, string>;
	screenLayout: string;
	type: ScreenRegionType;
}): string {
	return args.fallbackByType[args.type];
}

function findRegionPatternFromScreenLayoutProps(
	layoutProps: Record<string, unknown> | undefined,
	textSignals: string,
): DatabasePatternRef | undefined {
	if (!layoutProps) return undefined;
	const variants = [
		...arrayOfRecords(layoutProps.contentSubtypePatterns),
		...arrayOfRecords(layoutProps.variants),
	];
	if (variants.length === 0) return undefined;

	const selected =
		variants.find((entry) => {
			const name = String(entry.name ?? entry.variant ?? "");
			return name.length > 0 && textSignals.includes(name.toLowerCase());
		}) ?? variants[0];
	const patternId = selected.regionPatternId ?? selected.contentsPattern;
	return typeof patternId === "string" ? { id: patternId, variant: "default" } : undefined;
}

function arrayOfRecords(value: unknown): Array<Record<string, unknown>> {
	return Array.isArray(value)
		? value.filter((entry): entry is Record<string, unknown> => isRecord(entry))
		: [];
}
export function indexPatternsById(
	patterns: readonly PatternStorePattern[],
): Map<string, PatternStorePattern> {
	return new Map(patterns.map((pattern) => [pattern.id, pattern]));
}
