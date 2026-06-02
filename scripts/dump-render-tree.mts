// One-off: project the local sample tables into a RenderTree and dump it.
// Run: npx tsx scripts/dump-render-tree.mts
import { loadPatternStore } from "@cx/agent/pattern-store";
import { tablesToRenderTrees } from "../apps/web/src/adapters/tables-to-render-tree";
import compositeSampleSet from "../database/tables/components.json";
import areaSampleSet from "../database/tables/areas.json";
import screenMockDataSet from "../database/tables/screen_mock_data.json";
import screenSampleSet from "../database/tables/screens.json";

const areas = (areaSampleSet as any).areas;
const composites = (compositeSampleSet as any).components;
const screens = (screenSampleSet as any).screens;
const mockData = new Map(
	((screenMockDataSet as any).screenMockData ?? [])
		.filter((e: any) => e.scenario === "default")
		.map((e: any) => [e.screenId, e.data]),
);

const trees = tablesToRenderTrees({
	screens: screens.map((s: any) => ({ ...s, data: s.id ? mockData.get(s.id) : undefined })),
	areas,
	composites,
	patternStore: loadPatternStore(),
});

process.stdout.write(JSON.stringify(trees[0], null, 2));
