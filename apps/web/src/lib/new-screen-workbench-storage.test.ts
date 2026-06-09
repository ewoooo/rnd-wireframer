import { afterEach, describe, expect, it } from "vitest";
import type { NewScreenRunItem } from "@/components/workbench/new-screen/NewScreenSourcePanel";
import {
	mergeNewScreenRuns,
	readNewScreenWorkbenchState,
	writeNewScreenWorkbenchState,
} from "@/lib/new-screen-workbench-storage";

const baseRun: NewScreenRunItem = {
	id: "job-1",
	runId: "job-1",
	screenId: "S-1",
	sourcePath: "a.md",
	status: "running",
};

afterEach(() => window.localStorage.clear());

describe("new-screen-workbench-storage", () => {
	it("round-trips selectedRunId and runs through localStorage", () => {
		writeNewScreenWorkbenchState({ runs: [baseRun], selectedRunId: "job-1" });
		const state = readNewScreenWorkbenchState();
		expect(state.selectedRunId).toBe("job-1");
		expect(state.runs).toHaveLength(1);
		expect(state.runs[0].runId).toBe("job-1");
	});

	it("drops invalid runs on read", () => {
		window.localStorage.setItem(
			"cx.new-screen.workbench.v0.1",
			JSON.stringify({
				runs: [{ id: 1, runId: "job-1", screenId: "S-1" }],
				selectedRunId: "job-1",
			}),
		);
		expect(readNewScreenWorkbenchState().runs).toHaveLength(0);
	});

	it("keeps pending uploads when server runs are refreshed", () => {
		const current = [{ ...baseRun, id: "source:a.md", runId: undefined }];
		const server = [{ ...baseRun }];
		const merged = mergeNewScreenRuns(current, server);
		expect(merged.map((run) => run.id)).toEqual(["job-1", "source:a.md"]);
	});
});
