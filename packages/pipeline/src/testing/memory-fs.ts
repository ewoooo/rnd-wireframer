import type { PipelineFileSystemAdapter } from "../public/types";

export function createMemoryFileSystemAdapter(initialFiles?: Record<string, string>): {
	files: Map<string, string>;
	fs: PipelineFileSystemAdapter;
} {
	const files = new Map(Object.entries(initialFiles ?? {}));

	return {
		files,
		fs: {
			async copyFile(from, to) {
				const content = files.get(from);
				if (content === undefined) throw new Error(`Missing memory file: ${from}`);
				files.set(to, content);
			},
			async ensureDir() {},
			async exists(path) {
				return files.has(path);
			},
			async readText(path) {
				const content = files.get(path);
				if (content === undefined) throw new Error(`Missing memory file: ${path}`);
				return content;
			},
			async writeText(path, content) {
				files.set(path, content);
			},
		},
	};
}
