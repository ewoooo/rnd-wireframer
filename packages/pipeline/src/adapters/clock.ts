import type { PipelineClockAdapter } from "../public/types";

export function createSystemClockAdapter(): PipelineClockAdapter {
	return {
		now() {
			return new Date().toISOString();
		},
	};
}
