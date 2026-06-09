import { collectionSectionDefaults, createCollectionArea } from "./CollectionArea";

export const OptionListSectionArea = createCollectionArea({
	...collectionSectionDefaults,
	flow: "stack",
	gap: 8,
	titleGap: 12,
});
