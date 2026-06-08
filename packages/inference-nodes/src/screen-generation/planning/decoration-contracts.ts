import type { DecorationAreaPatternRole, DecorationAreaRole, SourceSpec } from "@cx/schema";

export type DecorationContractArea = {
	componentTypes: string[];
	displayTitle: string;
	layoutIntent: DecorationAreaPatternRole;
	role: DecorationAreaRole;
};

export type DecorationContract = {
	areas: DecorationContractArea[];
	id: string;
	match: {
		componentTypesAll?: string[];
		sourceKeywordsAny?: string[];
	};
};

export const DECORATION_CONTRACTS = [
	{
		areas: [
			{
				componentTypes: ["ListText"],
				displayTitle: "약관 목록 조회",
				layoutIntent: "list-stack",
				role: "content-list",
			},
			{
				componentTypes: ["Checkbox"],
				displayTitle: "약관 동의",
				layoutIntent: "checkbox-stack",
				role: "agreement-controls",
			},
		],
		id: "terms-agreement-flow",
		match: {
			componentTypesAll: ["ListText", "Checkbox"],
			sourceKeywordsAny: ["약관", "동의"],
		},
	},
] as const satisfies readonly DecorationContract[];

export function findDecorationContractForArea(
	area: SourceSpec["sourceShape"]["screen"]["regions"][number]["children"][number],
): DecorationContract | undefined {
	const sourceText = JSON.stringify(area);
	const componentTypes = new Set(
		area.children.map((component) => component.componentType ?? component.sourceComponentId),
	);

	return DECORATION_CONTRACTS.find((contract) => {
		const hasRequiredComponents = (contract.match.componentTypesAll ?? []).every((componentType) =>
			componentTypes.has(componentType),
		);
		const sourceKeywords = contract.match.sourceKeywordsAny as readonly string[] | undefined;
		const hasKeyword =
			!sourceKeywords ||
			sourceKeywords.length === 0 ||
			sourceKeywords.some((keyword) => sourceText.includes(keyword));

		return hasRequiredComponents && hasKeyword;
	});
}
