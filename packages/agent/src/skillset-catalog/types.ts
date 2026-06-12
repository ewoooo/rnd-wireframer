import type { SkillsetDocument } from "@cx/schema";

export type SkillsetCatalogEntry = {
	documents: Array<{
		kind: SkillsetDocument["kind"];
		sourceRef: string;
	}>;
};
