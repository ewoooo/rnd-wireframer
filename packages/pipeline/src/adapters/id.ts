import { randomUUID } from "node:crypto";

import type { PipelineIdAdapter } from "../public/types";

export function createRandomIdAdapter(): PipelineIdAdapter {
	return {
		createId(prefix) {
			return `${prefix}-${randomUUID()}`;
		},
	};
}
