import { collectionSectionDefaults, createCollectionArea } from "./CollectionArea";

export const MapCardInfoListArea = createCollectionArea({
	...collectionSectionDefaults,
	flow: "stack",
	gap: 8,
	mapHeight: 172,
});
