/**
 * Reads a required server-side environment variable.
 * Throws when the variable is missing or empty.
 */
export function readRequiredEnv(key: string): string {
	const value = process.env[key];
	if (!value) throw new Error(`Missing required server env: ${key}`);
	return value;
}
