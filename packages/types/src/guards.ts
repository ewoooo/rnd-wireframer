/**
 * Shared runtime type guards. Kept dependency-free so every package can import
 * them without widening its dependency graph.
 */

/** Narrows to a plain object (excludes null and arrays). */
export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
