import { existsSync } from "node:fs";
import path from "node:path";

export function getDatabaseDir() {
	const candidates = [
		path.join(process.cwd(), "database"),
		path.join(process.cwd(), "..", "database"),
		path.join(process.cwd(), "..", "..", "database"),
	];

	const databaseDir = candidates.find((candidate) => existsSync(candidate));
	return databaseDir ?? candidates[0];
}
