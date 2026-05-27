import { getComponentCatalogEntry } from "@cx/components/catalog";
import type { DatabasePatternRef } from "@cx/types/database-tables";
import type { ScreenRegionType } from "@cx/types/node-types";
import type { ChildrenLayoutPreset, PatternResolutionSignals, PatternStorePattern, PatternStoreTarget } from "@cx/types/pattern-store";
import { findPattern, listPatterns } from "./store";

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

export function componentSignals(type: string): Set<string> {
	const entry = getComponentCatalogEntry(type);
	const signals = new Set<string>([type, type.toLowerCase(), toKebabCase(type)]);

	if (entry) {
		signals.add(entry.type);
		signals.add(entry.type.toLowerCase());
		signals.add(toKebabCase(entry.type));
		if (entry.kind) signals.add(entry.kind);
		for (const alias of entry.aliases ?? []) {
			signals.add(alias);
			signals.add(alias.toLowerCase());
			signals.add(toKebabCase(alias));
		}
	}

	return signals;
}

export function scorePatternSignals(
	resolution: PatternResolutionSignals | undefined,
	signals: ReadonlySet<string>,
): number {
	const matcher = resolution?.componentTypes;
	if (!matcher) return 0;
	if (matcher.noneOf?.some((signal) => hasSignal(signals, signal))) return 0;
	if (matcher.allOf?.length && !matcher.allOf.every((signal) => hasSignal(signals, signal))) {
		return 0;
	}

	let score = 0;
	if (matcher.allOf?.length) score += matcher.allOf.length * 20;
	if (matcher.anyOf?.length) {
		const matched = matcher.anyOf.filter((signal) => hasSignal(signals, signal));
		if (matched.length === 0 && !matcher.allOf?.length) return 0;
		score += matched.length * 10;
	}
	return score;
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

function hasSignal(signals: ReadonlySet<string>, value: string): boolean {
	return signals.has(value) || signals.has(value.toLowerCase()) || signals.has(toKebabCase(value));
}

function arrayOfRecords(value: unknown): Array<Record<string, unknown>> {
	return Array.isArray(value)
		? value.filter((entry): entry is Record<string, unknown> => isRecord(entry))
		: [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toKebabCase(value: string): string {
	return value
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[^a-zA-Z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
}

export function indexPatternsById(
	patterns: readonly PatternStorePattern[],
): Map<string, PatternStorePattern> {
	return new Map(patterns.map((pattern) => [pattern.id, pattern]));
}
