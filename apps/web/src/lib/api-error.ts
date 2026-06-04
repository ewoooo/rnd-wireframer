/**
 * Reads a human-readable message from an unknown thrown value.
 * Falls back to the provided message when the value is not an Error.
 */
export function readErrorMessage(error: unknown, fallback: string): string {
	return error instanceof Error ? error.message : fallback;
}
