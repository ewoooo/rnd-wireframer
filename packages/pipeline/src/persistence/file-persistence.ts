import path from "node:path";

import type {
	PipelineAdapters,
	PipelinePersistenceAdapter,
	PipelineRunEvent,
	PipelineRunStatus,
} from "../public/types";

export type CreateFilePipelinePersistenceAdapterInput = {
	adapters: PipelineAdapters;
	eventsFileName?: string;
	runDir: string;
	statusFileName?: string;
};

export function createFilePipelinePersistenceAdapter(
	input: CreateFilePipelinePersistenceAdapterInput,
): PipelinePersistenceAdapter {
	const statusPath = path.join(input.runDir, input.statusFileName ?? "pipeline-status.json");
	const eventsPath = path.join(input.runDir, input.eventsFileName ?? "pipeline-events.ndjson");

	return {
		async appendEvent(event: PipelineRunEvent) {
			const line = `${JSON.stringify(event)}\n`;
			if (input.adapters.fs.appendText) {
				await input.adapters.fs.appendText(eventsPath, line);
				return;
			}
			const existing = (await input.adapters.fs.exists(eventsPath))
				? await input.adapters.fs.readText(eventsPath)
				: "";
			await input.adapters.fs.ensureDir(path.dirname(eventsPath));
			await input.adapters.fs.writeText(eventsPath, `${existing}${line}`);
		},
		async readStatus() {
			if (!(await input.adapters.fs.exists(statusPath))) return undefined;
			return JSON.parse(await input.adapters.fs.readText(statusPath)) as PipelineRunStatus;
		},
		async writeStatus(status: PipelineRunStatus) {
			await input.adapters.fs.ensureDir(path.dirname(statusPath));
			await input.adapters.fs.writeText(statusPath, `${JSON.stringify(status, null, 2)}\n`);
		},
	};
}
