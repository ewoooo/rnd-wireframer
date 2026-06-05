import { appendFile, copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { PipelineFileSystemAdapter } from "../public/types";

export function createNodeFileSystemAdapter(): PipelineFileSystemAdapter {
	return {
		async appendText(targetPath, content) {
			await mkdir(path.dirname(targetPath), { recursive: true });
			await appendFile(targetPath, content, "utf8");
		},
		async copyFile(from, to) {
			await copyFile(from, to);
		},
		async ensureDir(path) {
			await mkdir(path, { recursive: true });
		},
		async exists(path) {
			try {
				await stat(path);
				return true;
			} catch {
				return false;
			}
		},
		async readText(path) {
			return readFile(path, "utf8");
		},
		async writeText(path, content) {
			await writeFile(path, content, "utf8");
		},
	};
}
