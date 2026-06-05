import {
	type DecorationArea,
	type DecorationAreaPatternRole,
	type DecorationAreaRole,
	type DecorationPlanContract,
	type DecorationRepeatedItem,
	SCHEMA_VERSION,
	type SourceSpec,
	type SourceSpecComponentNode,
	type SourceSpecRegionSlot,
} from "@cx/schema";
import { type DecorationContractArea, findDecorationContractForArea } from "./decoration-contracts";

type SourceArea = SourceSpec["sourceShape"]["screen"]["regions"][number]["children"][number];

const REGION_ROLE_BY_SLOT = {
	bottom: "bottom-action",
	contents: "content-list",
	header: "navigation",
	unknown: "content-list",
} as const satisfies Record<SourceSpecRegionSlot, DecorationAreaRole>;

const AREA_PATTERN_ROLE_BY_REGION_ROLE = {
	"agreement-controls": "checkbox-stack",
	"bottom-action": "bottom-action",
	"content-list": "list-stack",
	form: "field-stack",
	message: "message-stack",
	navigation: "app-bar",
} as const satisfies Record<DecorationAreaRole, DecorationAreaPatternRole>;

export function buildDecorationPlan(input: {
	compositionPlan?: unknown;
	sourceSpec: SourceSpec;
}): DecorationPlanContract {
	const screen = input.sourceSpec.sourceShape.screen;
	const diagnostics: DecorationPlanContract["diagnostics"] = [];
	const areas = input.sourceSpec.sourceShape.screen.regions.flatMap((region) =>
		region.children.flatMap((area) => {
			const contract = findDecorationContractForArea(area);
			if (!contract) {
				const role = REGION_ROLE_BY_SLOT[region.slot];
				const decorated = createDecorationArea({
					area,
					components: area.children,
					contractArea: {
						componentTypes: [],
						displayTitle: resolveFallbackDisplayTitle(area, role),
						layoutIntent: AREA_PATTERN_ROLE_BY_REGION_ROLE[role],
						role,
					},
					index: 0,
					split: false,
					targetRegion: toDecorationTargetRegion(region.slot),
				});
				addInternalTitleDiagnostic(decorated, diagnostics);
				return [decorated];
			}

			return contract.areas.map((contractArea, index) => {
				const components = filterComponentsByTypes(area.children, contractArea.componentTypes);
				const decorated = createDecorationArea({
					area,
					components,
					contractArea,
					index,
					split: true,
					targetRegion: toDecorationTargetRegion(region.slot),
				});
				addInternalTitleDiagnostic(decorated, diagnostics);
				return decorated;
			});
		}),
	);

	return {
		areas,
		diagnostics,
		displayRules: {
			hideInternalSourceNames: true,
		},
		schemaVersion: SCHEMA_VERSION.decorationPlan,
		screenId: screen.screenCode,
		sourceScreenRef: screen.screenCode,
	};
}

function createDecorationArea(input: {
	area: SourceArea;
	components: SourceSpecComponentNode[];
	contractArea: DecorationContractArea;
	index: number;
	split: boolean;
	targetRegion: DecorationArea["targetRegion"];
}): DecorationArea {
	const suffix = input.split ? `.${input.contractArea.role}` : "";
	const repeatedItems = buildRepeatedItems(input.area, input.components, input.contractArea);

	return {
		componentRefs: input.components.map(toComponentRef),
		displayTitle: input.contractArea.displayTitle,
		id: `decor.area.${input.area.sourceAreaId}${suffix || `.${input.index}`}`,
		layoutIntent: {
			areaPatternRole: input.contractArea.layoutIntent,
		},
		repeatedItems: repeatedItems.length > 0 ? repeatedItems : undefined,
		role: input.contractArea.role,
		sourceAreaId: input.area.sourceAreaId,
		splitFrom: input.split ? input.area.sourceAreaId : undefined,
		targetRegion: input.targetRegion,
	};
}

function buildRepeatedItems(
	area: SourceArea,
	components: SourceSpecComponentNode[],
	contractArea: DecorationContractArea,
): DecorationRepeatedItem[] {
	if (contractArea.role === "content-list") {
		const sourceComponentRef = toComponentRef(components[0] ?? area.children[0]);
		if (!sourceComponentRef) return [];
		return extractTermLabels(area.children).map((term) => ({
			label: term.label,
			propsHint: {
				showRightItem: true,
				subText: term.label,
			},
			required: term.required,
			sourceComponentRef,
		}));
	}

	if (contractArea.role === "agreement-controls") {
		return components.map((component) => {
			const label = extractConcreteLabel(component) ?? component.description ?? component.label;
			return {
				label,
				propsHint: {
					label,
				},
				required: isRequiredSource(component),
				sourceComponentRef: toComponentRef(component),
			};
		});
	}

	return [];
}

function extractTermLabels(components: SourceSpecComponentNode[]): Array<{
	label: string;
	required?: boolean;
}> {
	const agreementTerms = components.filter(isAgreementSource).flatMap((component) => {
		const label = extractConcreteLabel(component);
		if (!label) return [];
		return [{ label, required: isRequiredSource(component) }];
	});
	if (agreementTerms.length > 0) return dedupeByLabel(agreementTerms);

	const listTerms = components.filter(isListSource).flatMap((component) => {
		const label = extractConcreteLabel(component);
		if (!label) return [];
		return [{ label }];
	});
	return dedupeByLabel(listTerms);
}

function extractConcreteLabel(component: SourceSpecComponentNode): string | undefined {
	const values = [
		...Object.values(component.props ?? {}),
		component.raw?.propsText,
		component.raw?.displayText,
		component.text,
		component.description,
	].filter((value): value is string => typeof value === "string" && value.length > 0);

	for (const value of values) {
		const example = value.match(/예:\s*([^)]+)/)?.[1]?.trim();
		if (example) return normalizeRequiredPrefix(value, example);
		const withoutPlaceholder = value
			.replace(/\{[^}]+\}/g, "")
			.replace(/\([^)]*\)/g, "")
			.trim();
		if (withoutPlaceholder && !withoutPlaceholder.includes(":")) return withoutPlaceholder;
	}

	return undefined;
}

function normalizeRequiredPrefix(source: string, label: string): string {
	if (source.includes("[필수]") && !label.startsWith("[필수]")) return `[필수] ${label}`;
	if (source.includes("[선택]") && !label.startsWith("[선택]")) return `[선택] ${label}`;
	return label;
}

function dedupeByLabel(
	items: Array<{ label: string; required?: boolean }>,
): Array<{ label: string; required?: boolean }> {
	const seen = new Set<string>();
	return items.filter((item) => {
		if (seen.has(item.label)) return false;
		seen.add(item.label);
		return true;
	});
}

function filterComponentsByTypes(
	components: SourceSpecComponentNode[],
	componentTypes: string[],
): SourceSpecComponentNode[] {
	if (componentTypes.length === 0) return components;
	const allowed = new Set(componentTypes);
	return components.filter((component) =>
		allowed.has(component.componentType ?? component.sourceComponentId),
	);
}

function resolveFallbackDisplayTitle(area: SourceArea, role: DecorationAreaRole): string {
	const firstTitle = area.children
		.map((component) => component.props?.title)
		.find((title): title is string => typeof title === "string" && title.length > 0);
	if (firstTitle) return firstTitle;
	if (area.description) return area.description;
	return role;
}

function addInternalTitleDiagnostic(
	area: DecorationArea,
	diagnostics: NonNullable<DecorationPlanContract["diagnostics"]>,
) {
	if (!isInternalSourceName(area.displayTitle)) return;
	diagnostics.push({
		code: "internal-visible-title",
		message: `Decoration area title still looks like an internal source name: ${area.displayTitle}.`,
		severity: "warning",
		sourceRef: area.sourceAreaId,
	});
}

function isInternalSourceName(value: string): boolean {
	return /(?:Section|Component)$/.test(value);
}

function isAgreementSource(component: SourceSpecComponentNode): boolean {
	const text = JSON.stringify(component);
	return text.includes("동의") || text.includes("필수") || text.includes("선택");
}

function isListSource(component: SourceSpecComponentNode): boolean {
	return (component.componentType ?? component.sourceComponentId) === "ListText";
}

function isRequiredSource(component: SourceSpecComponentNode): boolean | undefined {
	const text = JSON.stringify(component);
	if (text.includes("[필수]") || text.includes("필수")) return true;
	if (text.includes("[선택]") || text.includes("선택")) return false;
	return undefined;
}

function toComponentRef(component: SourceSpecComponentNode | undefined): string {
	if (!component) return "";
	return component.sourceId ?? component.roleAlias ?? component.sourceComponentId;
}

function toDecorationTargetRegion(slot: SourceSpecRegionSlot): DecorationArea["targetRegion"] {
	if (slot === "unknown") return "contents";
	return slot;
}
