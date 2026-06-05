import type {
	CreateLayoutPatternInput,
	DeleteLayoutPatternInput,
	PatternStore,
	PatternStoreChange,
	PatternStoreIssue,
	PatternStoreMutationResult,
	PatternStorePattern,
	PatternStoreReadResult,
	ReadLayoutPatternInput,
	UpdateLayoutPatternInput,
	UpsertLayoutPatternInput,
} from "../public/types";
import { patternSchema } from "./schema";

export function readPattern(
	store: PatternStore,
	input: ReadLayoutPatternInput,
): PatternStoreReadResult {
	const pattern = findPatternInStore(store, input);
	if (!pattern) {
		return failure("pattern-not-found", `pattern '${input.id}' was not found`);
	}
	return { ok: true, pattern };
}

export function createPattern(
	store: PatternStore,
	input: CreateLayoutPatternInput,
): PatternStoreMutationResult {
	const parsed = validatePattern(input);
	if (!parsed.ok) return parsed;

	if (store.patterns.some((pattern) => pattern.id === parsed.pattern.id)) {
		return failure("duplicate-pattern-id", `pattern '${parsed.pattern.id}' already exists`);
	}

	const nextStore = { patterns: [...store.patterns, parsed.pattern] };
	return mutationSuccess(nextStore, parsed.pattern, {
		type: "create",
		id: parsed.pattern.id,
		target: parsed.pattern.target,
		after: parsed.pattern,
	});
}

export function updatePattern(
	store: PatternStore,
	input: UpdateLayoutPatternInput,
): PatternStoreMutationResult {
	const index = findPatternIndex(store, input);
	if (index < 0) {
		return failure("pattern-not-found", `pattern '${input.id}' was not found`);
	}

	const before = store.patterns[index];
	const nextPattern = { ...before, ...input.patch, id: before.id };
	const parsed = validatePattern(nextPattern);
	if (!parsed.ok) return parsed;

	const nextStore = {
		patterns: store.patterns.map((pattern, patternIndex) =>
			patternIndex === index ? parsed.pattern : pattern,
		),
	};
	return mutationSuccess(nextStore, parsed.pattern, {
		type: "update",
		id: parsed.pattern.id,
		target: parsed.pattern.target,
		before,
		after: parsed.pattern,
	});
}

export function deletePattern(
	store: PatternStore,
	input: DeleteLayoutPatternInput,
): PatternStoreMutationResult {
	const index = findPatternIndex(store, input);
	if (index < 0) {
		return failure("pattern-not-found", `pattern '${input.id}' was not found`);
	}

	const before = store.patterns[index];
	const nextStore = {
		patterns: store.patterns.filter((_, patternIndex) => patternIndex !== index),
	};
	return mutationSuccess(nextStore, undefined, {
		type: "delete",
		id: before.id,
		target: before.target,
		before,
	});
}

export function upsertPattern(
	store: PatternStore,
	input: UpsertLayoutPatternInput,
): PatternStoreMutationResult {
	const existingIndex = findPatternIndex(store, { id: input.id, target: input.target });
	if (existingIndex < 0) {
		return createPattern(store, input);
	}

	const before = store.patterns[existingIndex];
	const parsed = validatePattern(input);
	if (!parsed.ok) return parsed;

	const nextStore = {
		patterns: store.patterns.map((pattern, patternIndex) =>
			patternIndex === existingIndex ? parsed.pattern : pattern,
		),
	};
	return mutationSuccess(nextStore, parsed.pattern, {
		type: "upsert",
		id: parsed.pattern.id,
		target: parsed.pattern.target,
		before,
		after: parsed.pattern,
	});
}

function findPatternInStore(
	store: PatternStore,
	input: ReadLayoutPatternInput,
): PatternStorePattern | undefined {
	return store.patterns.find(
		(pattern) => pattern.id === input.id && (!input.target || pattern.target === input.target),
	);
}

function findPatternIndex(store: PatternStore, input: ReadLayoutPatternInput): number {
	return store.patterns.findIndex(
		(pattern) => pattern.id === input.id && (!input.target || pattern.target === input.target),
	);
}

function validatePattern(
	pattern: PatternStorePattern,
): { ok: true; pattern: PatternStorePattern } | { ok: false; issues: PatternStoreIssue[] } {
	const parsed = patternSchema.safeParse(pattern);
	if (parsed.success) return { ok: true, pattern: parsed.data };

	return {
		ok: false,
		issues: parsed.error.issues.map((issue) => ({
			code: "schema-invalid",
			message: issue.message,
			path: issue.path.filter((segment): segment is string | number => {
				return typeof segment === "string" || typeof segment === "number";
			}),
		})),
	};
}

function mutationSuccess(
	store: PatternStore,
	pattern: PatternStorePattern | undefined,
	change: PatternStoreChange,
): PatternStoreMutationResult {
	return { ok: true, store, pattern, changes: [change] };
}

function failure<T extends PatternStoreIssue["code"]>(
	code: T,
	message: string,
): { ok: false; issues: PatternStoreIssue[] } {
	return { ok: false, issues: [{ code, message }] };
}
