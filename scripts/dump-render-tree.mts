// One-off: project the local sample tables into a RenderTree and dump it.
// Run: npx tsx scripts/dump-render-tree.mts
import { loadPatternStore } from "@cx/agent/pattern-store";
import { tablesToRenderTrees } from "../apps/web/src/adapters/tables-to-render-tree";
import compositeSampleSet from "../database/tables/components.json";
import areaSampleSet from "../database/tables/areas.json";
import screenMockDataSet from "../database/tables/screen_mock_data.json";
import screenSampleSet from "../database/tables/screens.json";

type JsonRecord = Record<string, unknown>;
type FixtureSet = Record<string, JsonRecord[] | undefined>;
type ScreenMockDataEntry = {
	data?: unknown;
	scenario?: string;
	screenId?: string;
};
type ScreenRow = JsonRecord & {
	data?: unknown;
	id?: string;
};

const areas = (areaSampleSet as FixtureSet).areas ?? [];
const composites = (compositeSampleSet as FixtureSet).components ?? [];
const screens = ((screenSampleSet as FixtureSet).screens ?? []) as ScreenRow[];
const mockData = new Map(
	(((screenMockDataSet as FixtureSet).screenMockData ?? []) as ScreenMockDataEntry[])
		.filter((entry) => entry.scenario === "default" && entry.screenId)
		.map((entry) => [entry.screenId, entry.data]),
);

const trees = tablesToRenderTrees({
	screens: screens.map((screen) => ({
		...screen,
		data: screen.id ? mockData.get(screen.id) : undefined,
	})),
	areas,
	composites,
	patternStore: loadPatternStore(),
});

process.stdout.write(JSON.stringify(trees[0], null, 2));
