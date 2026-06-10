import { collectionSectionDefaults, createCollectionArea } from "./CollectionArea";

export const BenefitBrandListArea = createCollectionArea({
	...collectionSectionDefaults,
	flow: "stack",
	gap: 12,
	titleGap: 16,
});
