import type { PipelineAdapters } from "../public/types";
import { createMemoryFileSystemAdapter } from "./memory-fs";

export function createTestPipelineAdapters(initialFiles?: Record<string, string>): {
	adapters: PipelineAdapters;
	files: Map<string, string>;
} {
	const memory = createMemoryFileSystemAdapter(initialFiles);

	return {
		adapters: {
			clock: {
				now: () => "2026-05-27T00:00:00.000Z",
			},
			fs: memory.fs,
			id: {
				createId: (prefix) => `${prefix}-test-id`,
			},
		},
		files: memory.files,
	};
}
