import { collectionSectionDefaults, createCollectionArea } from "./CollectionArea";

export const NearbyStoreListArea = createCollectionArea({
	...collectionSectionDefaults,
	flow: "stack",
	gap: 8,
	mapHeight: 172,
	titleGap: 16,
});
