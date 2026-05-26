import { randomUUID } from "node:crypto";

import type { PrddScreenRecord, ScreenSurfaceType } from "@cx/types";

import type { RegisteredAreaNode, RegisteredComponentNode, RegisteredScreenNode } from "../types";
import { parsePrddMarkdown } from "./prdd-parser";
import { buildPrddScreenRecord } from "./prdd-record-builder";
import { registerPrddDocument } from "./register-prdd";

/**
 * 한 PRDD 파일 → 두 표상(runtime tree + PrddScreenRecord) 동시 생성.
 * SPEC §2.1 cross-table invariant 의 register 책임 구현.
 */

export interface RegisterPrddScreenOptions {
	/** 미지정 시 자동 생성 (uuid). 호출자가 batch import 시 같은 id 부여 가능. */
	importJobId?: string;
	defaultScreenType?: ScreenSurfaceType;
	order?: number;
}

export interface RegisterPrddScreenResult {
	importJobId: string;
	screenId: string;
	prddScreenRecord: PrddScreenRecord;
	runtime: {
		screen: RegisteredScreenNode;
		areas: RegisteredAreaNode[];
		components: RegisteredComponentNode[];
	};
	warnings: string[];
	/** 두 표상의 일관성 검사 결과 (SPEC §2.1). 빈 배열이면 통과. */
	invariantViolations: CrossTableViolation[];
}

export interface CrossTableViolation {
	code:
		| "screenId.mismatch"
		| "areas.count.mismatch"
		| "area.children.count.mismatch"
		| "component.name.unmatched";
	message: string;
	data?: Record<string, unknown>;
}

export function registerPrddScreen(
	source: string,
	options: RegisterPrddScreenOptions = {},
): RegisterPrddScreenResult {
	const parsed = parsePrddMarkdown(source);
	const importJobId = options.importJobId ?? randomUUID();
	const runtime = registerPrddDocument(parsed);
	const prddScreenRecord = buildPrddScreenRecord(parsed, {
		importJobId,
		defaultScreenType: options.defaultScreenType,
		order: options.order,
	});
	const invariantViolations = checkCrossTableInvariant(prddScreenRecord, runtime);

	return {
		importJobId,
		screenId: prddScreenRecord.id,
		prddScreenRecord,
		runtime,
		warnings: [...parsed.warnings, ...runtime.warnings],
		invariantViolations,
	};
}

/**
 * SPEC §2.1 cross-table invariant 검사.
 * - 같은 screenId
 * - areas.length 매칭 (총 area 수 — header/contents/bottom 합산)
 * - area 단위 children 수 매칭
 * - component semanticName 또는 rawComponentId 가 runtime 의 component name/type 과 추적 가능
 */
function checkCrossTableInvariant(
	record: PrddScreenRecord,
	runtime: {
		screen: RegisteredScreenNode;
		areas: RegisteredAreaNode[];
		components: RegisteredComponentNode[];
	},
): CrossTableViolation[] {
	const violations: CrossTableViolation[] = [];

	if (record.id !== runtime.screen.id) {
		violations.push({
			code: "screenId.mismatch",
			message: `PrddScreenRecord.id "${record.id}" != runtime.screen.id "${runtime.screen.id}"`,
			data: { prdd: record.id, runtime: runtime.screen.id },
		});
	}

	// runtime areas: header/contents/bottom 의 모든 컴포넌트·area 위치를 평탄화한 비교는 의미 약함.
	// 대신 record.areas 와 runtime 의 totalChildren 비교.
	const runtimeAreaCount = computeRuntimeAreaCount(runtime.screen);
	if (record.areas.length !== runtimeAreaCount) {
		violations.push({
			code: "areas.count.mismatch",
			message: `PrddScreenRecord.areas.length ${record.areas.length} != runtime area count ${runtimeAreaCount}`,
			data: { record: record.areas.length, runtime: runtimeAreaCount },
		});
	}

	// component name 추적: 각 record component 의 semanticName/rawComponentId 가 runtime 컴포넌트와 매칭되는지
	const runtimeNames = new Set<string>();
	const runtimeTypes = new Set<string>();
	for (const c of runtime.components) {
		runtimeNames.add(c.name);
		runtimeTypes.add(c.type);
	}
	for (const area of record.areas) {
		for (const child of area.area.children) {
			const matchedByName = runtimeNames.has(child.semanticName);
			const matchedByType = runtimeTypes.has(child.rawComponentId);
			if (!matchedByName && !matchedByType) {
				violations.push({
					code: "component.name.unmatched",
					message: `component "${child.semanticName}" (${child.rawComponentId}) 가 runtime tree 와 매칭 안 됨`,
					data: {
						areaId: area.areaId,
						semanticName: child.semanticName,
						rawComponentId: child.rawComponentId,
					},
				});
			}
		}
	}

	return violations;
}

function computeRuntimeAreaCount(screen: RegisteredScreenNode): number {
	// runtime 트리는 header/contents/bottom 의 children 으로 area/component 를 가짐.
	// "area 수" 의 표준 정의: header 의 component 묶음 1, contents.areas 각 1, bottom 의 component 묶음 1.
	const hasHeader = (screen.header?.children?.length ?? 0) > 0 ? 1 : 0;
	const contentsAreaCount = screen.contents?.children?.length ?? 0;
	const hasBottom = (screen.bottom?.children?.length ?? 0) > 0 ? 1 : 0;
	return hasHeader + contentsAreaCount + hasBottom;
}
