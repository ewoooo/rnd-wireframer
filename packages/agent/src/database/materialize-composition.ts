import {
	resolveCompositePatternByComponentType,
	resolveRegionPatternFromScreenPattern,
} from "@cx/pattern-store/resolver";
import type {
	CompositionArea,
	CompositionDecision,
	CompositionOutput,
	CompositionSelection,
	DatabaseAreaRow,
	DatabaseComponentRow,
	DatabasePatternRef,
	DatabaseScreenBody,
	DatabaseScreenRegion,
	DatabaseScreenRouteRow,
	DatabaseScreenRow,
	DatabaseScreenVariantRow,
	DecoratedOutput,
	LayoutPatternVerification,
	MaterializedNodeTree,
	NodeHook,
	NodeMetadata,
	PrddScreenRecord,
	ScreenRegionType,
} from "@cx/types";

/**
 * Materializer — CompositionOutput + DecoratedOutput + PrddScreenRecord → DB row shape.
 *
 * deterministic 매핑. AI 가 만지지 않는다. (SPEC §1.4 경계 규율)
 *
 * 주의:
 * - DatabaseComponentRow.pattern 은 required. decision-level verification 이 없으면
 *   selection type 기반 component pattern 계약 테이블로 채운다.
 * - screen body 는 region 3개 (header/contents/bottom) 가 필수. PrddArea.slot 기준으로 분배.
 * - 본 materializer 는 단일 화면을 다룬다. route/variant rows 는 호출자가 합치도록 빈 배열 반환 가능.
 */

export interface MaterializeCompositionInput {
	prddScreenRecord: PrddScreenRecord;
	composition: CompositionOutput;
	decorated: DecoratedOutput;
	/** 단일 화면 materialize 시 사용할 screenVariantId. 미지정 시 screenId 재사용. */
	screenVariantId?: string;
	/** route/variant row 를 함께 만들고 싶을 때만 채움. */
	scaffold?: {
		moduleId: string;
		screenRouteId: string;
		routeName: string;
		routeOrder: number;
		variantName: string;
		variantOrder: number;
	};
	/** metadata 의 author/timestamps. 미지정 시 기본값. */
	metadata?: Partial<NodeMetadata>;
	/** Materializer 산출물 버전 문자열. row.version 에 박힘. */
	rowVersion?: string;
}

export const COMPONENT_FALLBACK_PATTERN: DatabasePatternRef = {
	id: "component-card-summary",
	variant: "default",
};
export const REGION_FALLBACK_PATTERN_BY_TYPE = {
	"Screen.Bottom": { id: "commerce-detail-bottom-action", variant: "default" },
	"Screen.Contents": { id: "commerce-detail-content-stack", variant: "default" },
	"Screen.Header": { id: "plain-stack", variant: "default" },
} satisfies Record<ScreenRegionType, DatabasePatternRef>;

export const AREA_FALLBACK_PATTERN: DatabasePatternRef = {
	id: "area-vertical",
	variant: "default",
};

const DEFAULT_MIN_RENDERER_VERSION = "0.1.0";

export function materializeComposition(input: MaterializeCompositionInput): MaterializedNodeTree {
	const warnings: string[] = [];
	const screenId = input.prddScreenRecord.id;
	const screenVariantId = input.screenVariantId ?? screenId;
	const rowVersion = input.rowVersion ?? "0.1.0";
	const metadata = makeMetadata(input.metadata, input.prddScreenRecord);

	const screenRoutes: DatabaseScreenRouteRow[] = [];
	const screenVariants: DatabaseScreenVariantRow[] = [];
	if (input.scaffold) {
		const s = input.scaffold;
		screenRoutes.push({
			id: s.screenRouteId,
			moduleId: s.moduleId,
			name: s.routeName,
			order: s.routeOrder,
			processId: null,
		});
		screenVariants.push({
			id: screenVariantId,
			screenRouteId: s.screenRouteId,
			name: s.variantName,
			order: s.variantOrder,
			variantType: "base",
			followUp: null,
		});
	}

	// decisions 와 areas 인덱싱
	const decisionsById = new Map<string, CompositionDecision>(
		input.composition.decisions.map((d) => [d.id, d]),
	);
	const areasById = new Map<string, CompositionArea>(
		input.composition.areas.map((a) => [a.areaId, a]),
	);

	// component rows (모든 decision → component row)
	const componentRows: DatabaseComponentRow[] = [];
	for (const decision of input.composition.decisions) {
		componentRows.push(toComponentRow(decision, input.decorated, metadata, rowVersion));
	}

	// area rows (모든 slot의 area를 보존해 Decorate finalLayoutPattern 추적성을 유지)
	const areaRows: DatabaseAreaRow[] = [];
	for (const area of input.composition.areas) {
		areaRows.push(toAreaRow(area, input.decorated, metadata, rowVersion));
	}

	// screen body — region 3개로 children 분배
	const regions = buildRegions({
		composition: input.composition,
		screenPattern: pickPattern(input.decorated.screen.finalLayoutPattern),
	});

	const screen: DatabaseScreenBody = {
		type: input.prddScreenRecord.screenType,
		regions,
	};

	const screenRow: DatabaseScreenRow = {
		id: screenId,
		version: rowVersion,
		metadata,
		screenVariantId,
		minRendererVersion: DEFAULT_MIN_RENDERER_VERSION,
		pattern: pickPattern(input.decorated.screen.finalLayoutPattern),
		screen,
	};

	// 결과 invariant: 모든 area decisions 가 area children 에 들어가야 함
	for (const area of input.composition.areas) {
		for (const decisionId of area.decisionIds) {
			if (!decisionsById.has(decisionId)) {
				warnings.push(
					`area ${area.areaId} 가 가리킨 decisionId "${decisionId}" 가 decisions 에 없음`,
				);
			}
		}
	}
	void areasById; // 미래 확장 대비

	return {
		screenRoutes,
		screenVariants,
		screens: [screenRow],
		areas: areaRows,
		components: componentRows,
		warnings,
	};
}

// ─── helpers ─────────────────────────────────────────────────────────────

function makeMetadata(
	partial: Partial<NodeMetadata> | undefined,
	record: PrddScreenRecord,
): NodeMetadata {
	const now = new Date().toISOString();
	return {
		title: partial?.title ?? record.name,
		author: partial?.author ?? "agent",
		createdAt: partial?.createdAt ?? now,
		updatedAt: partial?.updatedAt ?? now,
		...(partial?.description !== undefined
			? { description: partial.description }
			: record.description
				? { description: record.description }
				: {}),
	};
}

function pickPattern(verification: {
	layoutPatternId: string;
	variant?: string;
}): DatabasePatternRef {
	const ref: DatabasePatternRef = { id: verification.layoutPatternId };
	if (verification.variant) ref.variant = verification.variant;
	return ref;
}

const SELECTION_TYPE_READERS = {
	"propose-pattern": (selection) => selection.proposedComponentPatternId,
	"report-gap": () => "fallback",
	"reuse-pattern": (selection) => selection.componentPatternId,
	"reuse-primitive": (selection) => selection.primitiveId,
} satisfies {
	[K in CompositionSelection["mode"]]: (
		selection: Extract<CompositionSelection, { mode: K }>,
	) => string;
};

function toComponentRow(
	decision: CompositionDecision,
	decorated: DecoratedOutput,
	metadata: NodeMetadata,
	rowVersion: string,
): DatabaseComponentRow {
	const verification: LayoutPatternVerification | undefined = decorated.decisions[decision.id];
	const type = selectionType(decision);
	const pattern = verification
		? pickPattern(verification.finalLayoutPattern)
		: resolveComponentPattern(type);
	const hooks: NodeHook[] = decision.hooks.map((h) => ({
		trigger: h.trigger,
		action: h.action,
		...(h.target !== undefined ? { target: h.target } : {}),
		...(h.params ? { params: h.params } : {}),
	}));
	return {
		id: decision.id,
		version: rowVersion,
		metadata: {
			...metadata,
			title: decision.intent || metadata.title,
		},
		pattern,
		type,
		children: [
			{
				component: {
					type,
					...("variant" in decision.selection && decision.selection.variant
						? { variant: decision.selection.variant }
						: {}),
				},
				props: decision.props,
			},
		],
		...(hooks.length > 0 ? { hooks } : {}),
	};
}

function selectionType(decision: CompositionDecision): string {
	const sel = decision.selection;
	const read = SELECTION_TYPE_READERS[sel.mode] as (selection: CompositionSelection) => string;
	return read(sel);
}

function toAreaRow(
	area: CompositionArea,
	decorated: DecoratedOutput,
	metadata: NodeMetadata,
	rowVersion: string,
): DatabaseAreaRow {
	const verification = decorated.areas[area.areaId];
	const pattern = verification
		? pickPattern(verification.finalLayoutPattern)
		: AREA_FALLBACK_PATTERN;
	return {
		id: area.areaId,
		version: rowVersion,
		metadata: { ...metadata, title: area.intent || area.areaId },
		pattern,
		type: "area.dynamic",
		props: {
			name: area.intent,
		},
		children: area.decisionIds.map((id) => ({ kind: "component", id })),
	};
}

function buildRegions(args: {
	composition: CompositionOutput;
	screenPattern: DatabasePatternRef;
}): DatabaseScreenBody["regions"] {
	const groups = new Map<"bottom" | "contents" | "header", CompositionArea[]>();
	groups.set("header", []);
	groups.set("contents", []);
	groups.set("bottom", []);
	for (const area of args.composition.areas) {
		groups.get(area.slot)?.push(area);
	}
	return {
		header: buildRegion("Screen.Header", groups.get("header") ?? [], args),
		contents: buildRegion("Screen.Contents", groups.get("contents") ?? [], args),
		bottom: buildRegion("Screen.Bottom", groups.get("bottom") ?? [], args),
	};
}

function buildRegion(
	type: ScreenRegionType,
	areas: CompositionArea[],
	context: { composition: CompositionOutput; screenPattern: DatabasePatternRef },
): DatabaseScreenRegion {
	return {
		type,
		metadata: { title: type },
		pattern: resolveRegionPattern(type, context),
		children: areas.map((area) => ({ kind: "area", id: area.areaId })),
	};
}

function resolveComponentPattern(type: string): DatabasePatternRef {
	return resolveCompositePatternByComponentType(type) ?? COMPONENT_FALLBACK_PATTERN;
}

function resolveRegionPattern(
	type: ScreenRegionType,
	context: { composition: CompositionOutput; screenPattern: DatabasePatternRef },
): DatabasePatternRef {
	return resolveRegionPatternFromScreenPattern({
		compositionText: screenTextSignals(context.composition),
		fallbackByType: REGION_FALLBACK_PATTERN_BY_TYPE,
		screenPattern: context.screenPattern,
		type,
	});
}

function screenTextSignals(composition: CompositionOutput): string {
	return [
		composition.screen.intent,
		composition.screen.primaryUserGoal,
		composition.screen.archetype,
		...composition.areas.map((area) => area.intent),
	]
		.join(" ")
		.toLowerCase();
}
