import { getComponentCatalogEntry } from "@cx/components/catalog";
import { normalizeComponentType } from "../normalize-component-type";
import type { DecoratedAreaNode, DecoratedComponentNode, DecoratedNodeTree } from "../types";
import {
	DESIGN_REVIEW_RULES,
	DESIGN_REVIEW_STAGE,
	type DesignReviewRuleContract,
} from "./design-review-contracts";
import type { DesignReview } from "./design-review-schema";

export interface ReviewDesignTreeOptions {
	reviewer?: string;
}

export function reviewDesignTree(
	decorated: DecoratedNodeTree,
	options: ReviewDesignTreeOptions = {},
): DesignReview {
	const operations: DesignReview["operations"] = [];
	const findings: DesignReview["findings"] = [];
	const areaById = new Map(decorated.areas.map((area) => [area.id, area]));
	const componentById = new Map(decorated.components.map((component) => [component.id, component]));

	for (const screen of decorated.screens) {
		for (const rule of DESIGN_REVIEW_RULES) {
			for (const region of rule.sourceRegions) {
				for (const ref of screen.children[region] ?? []) {
					const area = areaById.get(ref.areaId);
					if (!area) continue;

					for (const componentRef of area.children) {
						const component = componentById.get(componentRef.componentId);
						if (!component || !matchesDesignReviewRule(component, area, rule)) continue;

						const tokens = {
							areaId: area.id,
							componentId: component.id,
							screenId: screen.id,
						};
						findings.push({
							id: formatContractTemplate(rule.finding.idTemplate, tokens),
							severity: rule.finding.severity,
							title: rule.finding.title,
							description: formatContractTemplate(rule.finding.descriptionTemplate, tokens),
							affectedNodeIds: [screen.id, area.id, component.id],
							designReferences: [...rule.designReferences],
						});
						operations.push({
							id: formatContractTemplate(rule.operation.idTemplate, tokens),
							operation: "moveComponent",
							priority: rule.operation.priority,
							confidence: rule.operation.confidence,
							componentId: component.id,
							from: { screenId: screen.id, areaId: area.id },
							to: {
								screenId: screen.id,
								screenRegion: rule.targetRegion,
								placement: rule.placement,
							},
							rationale: formatContractTemplate(rule.operation.rationaleTemplate, tokens),
							designReferences: [...rule.designReferences],
						});
					}
				}
			}
		}
	}

	return {
		version: DESIGN_REVIEW_STAGE.version,
		reviewer: options.reviewer ?? DESIGN_REVIEW_STAGE.deterministicReviewer,
		scope: {
			treeStage: DESIGN_REVIEW_STAGE.defaultTreeStage,
			screenIds: decorated.screens.map((screen) => screen.id),
		},
		findings,
		operations,
		warnings: [],
	};
}

function matchesDesignReviewRule(
	component: DecoratedComponentNode,
	area: DecoratedAreaNode,
	rule: DesignReviewRuleContract,
) {
	if (rule.requiresLastAreaChild && !isLastAreaChild(component.id, area)) return false;
	if (!matchesComponentSurface(component, rule)) return false;
	if (
		rule.componentIdPatterns?.length &&
		!matchesAnyPattern(component.id, rule.componentIdPatterns)
	) {
		return false;
	}
	const props = component.props ?? {};
	const labels = rule.labelPropNames
		.map((name) => props[name])
		.filter((value) => value !== undefined);
	const label = `${labels.at(0) ?? component.name ?? component.id}`.toLowerCase();
	const hasPrimaryLabel = rule.labelPatterns ? matchesAnyPattern(label, rule.labelPatterns) : false;
	const hasPrimaryHook = (component.hooks ?? []).some((hook) =>
		rule.hookActions?.includes(hook.action),
	);
	return hasPrimaryLabel || hasPrimaryHook;
}

function matchesComponentSurface(
	component: DecoratedComponentNode,
	rule: DesignReviewRuleContract,
) {
	const normalizedType = normalizeComponentType(component.type) ?? component.type;
	const catalogEntry = normalizedType ? getComponentCatalogEntry(normalizedType) : undefined;
	const matchesType = normalizedType ? rule.componentTypes?.includes(normalizedType) : false;
	const matchesKind = catalogEntry?.kind ? rule.componentKinds?.includes(catalogEntry.kind) : false;
	return Boolean(matchesType || matchesKind);
}

function isLastAreaChild(componentId: string, area: DecoratedAreaNode) {
	const ordered = [...area.children].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
	return ordered.at(-1)?.componentId === componentId;
}

function matchesAnyPattern(value: string, patterns: readonly string[]) {
	return patterns.some((pattern) => value.toLowerCase().includes(pattern.toLowerCase()));
}

function formatContractTemplate(template: string, tokens: Record<string, string>) {
	return Object.entries(tokens).reduce(
		(result, [key, value]) => result.replaceAll(`{${key}}`, value),
		template,
	);
}
