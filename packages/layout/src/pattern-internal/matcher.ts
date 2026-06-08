import { getComponentCatalogEntry } from "@cx/components/catalog";
import type { PatternResolutionSignals } from "../public/types";

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

function hasSignal(signals: ReadonlySet<string>, value: string): boolean {
	return signals.has(value) || signals.has(value.toLowerCase()) || signals.has(toKebabCase(value));
}

function toKebabCase(value: string): string {
	return value
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[^a-zA-Z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
}
