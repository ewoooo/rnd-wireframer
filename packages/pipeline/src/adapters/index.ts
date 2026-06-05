import type { PipelineAdapters } from "../public/types";
import { createSystemClockAdapter } from "./clock";
import { createRandomIdAdapter } from "./id";
import { createNodeFileSystemAdapter } from "./node-fs";

export function createNodePipelineAdapters(): PipelineAdapters {
	return {
		clock: createSystemClockAdapter(),
		fs: createNodeFileSystemAdapter(),
		id: createRandomIdAdapter(),
	};
}

export { createSystemClockAdapter } from "./clock";
export { createRandomIdAdapter } from "./id";
export { createNodeFileSystemAdapter } from "./node-fs";
