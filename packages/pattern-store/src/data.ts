import areaPatternSet from "./catalog/area-patterns.json" with { type: "json" };
import compositePatternSet from "./catalog/composite-patterns.json" with { type: "json" };
import regionPatternSet from "./catalog/region-patterns.json" with { type: "json" };
import screenPatternSet from "./catalog/screen-patterns.json" with { type: "json" };

export { areaPatternSet, compositePatternSet, regionPatternSet, screenPatternSet };

export const patternCatalogSets = [
	regionPatternSet,
	areaPatternSet,
	compositePatternSet,
	screenPatternSet,
] as const;
