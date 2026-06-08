import { afterEach, describe, expect, it } from "vitest";
import type { NewScreenSourceItem } from "@/components/workbench/new-screen/NewScreenSourcePanel";
import {
	mergeNewScreenSources,
	readNewScreenWorkbenchState,
	writeNewScreenWorkbenchState,
} from "@/lib/new-screen-workbench-storage";

const baseSource: NewScreenSourceItem = {
	batchId: "b1",
	importId: "web-upload",
	path: "a.md",
	screenId: "S-1",
};

afterEach(() => window.localStorage.clear());

describe("new-screen-workbench-storage", () => {
	it("round-trips selectedSourcePath and sources through localStorage", () => {
		writeNewScreenWorkbenchState({ selectedSourcePath: "a.md", sources: [baseSource] });
		const state = readNewScreenWorkbenchState();
		expect(state.selectedSourcePath).toBe("a.md");
		expect(state.sources).toHaveLength(1);
		expect(state.sources[0].path).toBe("a.md");
	});

	it("drops non-web-upload sources on read", () => {
		const foreign = { ...baseSource, importId: "cli", path: "b.md" };
		window.localStorage.setItem(
			"cx.new-screen.workbench.v0.1",
			JSON.stringify({ selectedSourcePath: "b.md", sources: [foreign] }),
		);
		expect(readNewScreenWorkbenchState().sources).toHaveLength(0);
	});

	it("prefers latestRunId from current when server source lacks it", () => {
		const current = [{ ...baseSource, latestRunId: "run-1" }];
		const server = [{ ...baseSource }];
		const merged = mergeNewScreenSources(current, server);
		expect(merged[0].latestRunId).toBe("run-1");
	});
});
