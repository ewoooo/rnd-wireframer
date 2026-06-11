import type { SourceSpec } from "@cx/schema";
import { isRecord } from "@cx/schema";

export function collectSourceComponentsByRenderRef(
	sourceSpec: SourceSpec,
): Map<string, Record<string, unknown>> {
	const components = new Map<string, Record<string, unknown>>();
	for (const region of sourceSpec.sourceShape.screen.regions) {
		for (const area of region.children) {
			for (const component of area.children) {
				const refs = [
					(component as { sourceId?: unknown }).sourceId,
					(component as { roleAlias?: unknown }).roleAlias,
				];
				for (const ref of refs) {
					if (typeof ref === "string" && ref.length > 0) {
						components.set(ref, component as unknown as Record<string, unknown>);
					}
				}
			}
		}
	}
	return components;
}

/**
 * A source ref counts as materialized when its id appears in the output, OR when a
 * visible label from that source component does (the element was folded into a parent
 * prop, e.g. a field-side action button rendered via TextField.buttonLabel).
 */
export function refIsMaterialized(
	ref: string,
	generatedText: string,
	labelIndex: Map<string, string[]>,
): boolean {
	if (generatedText.includes(ref)) return true;
	return (labelIndex.get(ref) ?? []).some((label) => generatedText.includes(label));
}

export function collectSourceRefLabelIndex(sourceSpec: SourceSpec): Map<string, string[]> {
	const index = new Map<string, string[]>();
	for (const region of sourceSpec.sourceShape.screen.regions) {
		for (const area of region.children) {
			for (const component of area.children) {
				const labels = collectComponentLabels(component);
				if (labels.length === 0) continue;
				for (const ref of [
					(component as { sourceId?: unknown }).sourceId,
					(component as { sourceComponentId?: unknown }).sourceComponentId,
					(component as { roleAlias?: unknown }).roleAlias,
				]) {
					if (typeof ref === "string" && ref.length > 0) {
						index.set(ref, [...(index.get(ref) ?? []), ...labels]);
					}
				}
			}
		}
	}
	return index;
}

function collectComponentLabels(component: unknown): string[] {
	if (!isRecord(component) || !isRecord(component.props)) return [];
	return Object.values(component.props).filter(
		(value): value is string => typeof value === "string" && value.trim().length >= 2,
	);
}

export function collectSourceSpecRefs(sourceSpec: SourceSpec): Set<string> {
	return new Set(
		[
			sourceSpec.sourceShape.screen.screenCode,
			sourceSpec.sourceShape.screen.route,
			...sourceSpec.sourceShape.screen.regions.flatMap((region) =>
				region.children.flatMap((area) => [
					area.sourceAreaId,
					area.sourceAreaName,
					...area.children.map((component) => component.sourceComponentId),
					...area.children.map((component) => component.sourceId),
					...area.children.map((component) => component.roleAlias),
					...area.children.map((component) => component.componentType),
				]),
			),
		].filter((ref): ref is string => Boolean(ref)),
	);
}

export function collectMaterializationSourceRefs(sourceSpec: SourceSpec): string[] {
	return [
		...new Set(
			sourceSpec.sourceShape.screen.regions.flatMap((region) =>
				region.children.flatMap((area) => [
					area.sourceAreaId,
					...area.children.map((component) => component.sourceId),
					...area.children.map((component) => component.sourceComponentId),
				]),
			),
		),
	].filter(isMaterializableRef);
}

/**
 * Structural order tokens (e.g. the "999" bottom-area sentinel or a "2"
 * sequence number) are not visible content, so they must not be checked for
 * output materialization — doing so produces phantom "ref not visible" noise.
 */
export function isMaterializableRef(ref: string | undefined): ref is string {
	return typeof ref === "string" && ref.length > 0 && !/^\d+$/.test(ref);
}

export function isPrimitiveSourcePropValue(value: unknown): value is boolean | number | string {
	return typeof value === "boolean" || typeof value === "number" || typeof value === "string";
}

export const STATEFUL_SURFACE_TERMS = [
	"async",
	"empty",
	"error",
	"form",
	"input",
	"list",
	"loading",
	"search",
	"select",
	"validation",
	"검색",
	"목록",
	"에러",
	"오류",
	"입력",
	"폼",
	"필수",
] as const;

export const STATE_COVERAGE_TERMS = [
	"disabled",
	"empty",
	"error",
	"loading",
	"stateRole",
	"validation",
	"오류",
	"로딩",
	"빈",
] as const;
