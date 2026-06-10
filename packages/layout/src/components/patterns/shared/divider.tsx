import * as ExternalRegistry from "@cx/external/registry";
import { componentExportNameOf } from "@cx/external/resolver";
import { Children, isValidElement, type ReactNode } from "react";

const { Divider } = ExternalRegistry;

export type LayoutDivider = "contents" | "none" | "section";

/** divider 계약의 단일 해석 결과 — 행 사이 contents divider + 영역 끝 section divider. */
export type LayoutDividerContract = {
	rows: boolean;
	trailingSection: boolean;
};

export function resolveDivider(
	value: unknown,
	defaultDivider?: LayoutDivider,
): LayoutDivider | undefined {
	if (value === false) return "none";
	if (value === undefined) return defaultDivider;
	return toLayoutDivider(value);
}

/**
 * props.divider(+레거시 props.sectionDivider)를 계약으로 환원하는 단일 지점.
 * sectionDivider:true 레거시 흡수는 여기 한 곳에서만 한다.
 */
export function resolveDividerContract(
	props: Record<string, unknown>,
	defaults?: { divider?: LayoutDivider },
): LayoutDividerContract {
	const divider = resolveDivider(props.divider, defaults?.divider);
	return {
		rows: divider === "contents",
		trailingSection: divider === "section" || props.sectionDivider === true,
	};
}

/** contents divider 행 분류에서 제외되는 canonical componentKey — 제목류는 행이 아니다. */
export const DIVIDER_EXEMPT_CANONICAL_TYPES = ["kiki.TitleSection"] as const;

export type DividerChildKind = "exempt" | "row";

const EXEMPT_CANONICAL_TYPE_SET: ReadonlySet<string> = new Set(DIVIDER_EXEMPT_CANONICAL_TYPES);

/** canonical componentKey → divider 분류. 런타임/export(emit-node)가 공유하는 테이블 조회. */
export function dividerKindOfCanonicalType(canonicalType: string): DividerChildKind {
	return EXEMPT_CANONICAL_TYPE_SET.has(canonicalType) ? "exempt" : "row";
}

/**
 * kinds 배열(길이 n) → 인접 경계 배열(길이 n-1).
 * boundaries[i] = kinds[i]·kinds[i+1] 둘 다 행일 때만 true — exempt(제목) 양쪽 경계는 미삽입.
 * 런타임(renderChildrenWithDividers, renderer selection-list)과 export(emit-node)가
 * 이 함수 하나를 공유한다 — 거울 구현 금지.
 */
export function contentsDividerBoundaries(kinds: ReadonlyArray<DividerChildKind>): boolean[] {
	return kinds.slice(1).map((kind, index) => kind !== "exempt" && kinds[index] !== "exempt");
}

// canonical 테이블 → registry 컴포넌트 함수 참조 Set. 런타임 children은 React element라
// element.type(함수 참조)으로만 분류할 수 있다 — 모듈 로드 시 1회 파생.
const EXEMPT_COMPONENT_TYPES: ReadonlySet<unknown> = new Set(
	DIVIDER_EXEMPT_CANONICAL_TYPES.map(
		(canonicalType) =>
			(ExternalRegistry as Record<string, unknown>)[componentExportNameOf(canonicalType)],
	).filter((component) => typeof component === "function"),
);

/**
 * 런타임 child element → divider 분류.
 * renderer(render-layout)가 leaf를 composite 패턴으로 한 겹 감싸므로(여러 composite가
 * CompositeGap0 등 래퍼를 공유), 단일 자식 체인은 끝까지 따라가 내부 컴포넌트로 판정한다.
 */
export function classifyDividerChild(child: ReactNode): DividerChildKind {
	return isExemptElement(child) ? "exempt" : "row";
}

function isExemptElement(child: ReactNode): boolean {
	if (!isValidElement(child)) return false;
	if (EXEMPT_COMPONENT_TYPES.has(child.type)) return true;
	const inner = Children.toArray((child.props as { children?: ReactNode }).children);
	return inner.length === 1 && isExemptElement(inner[0]);
}

/**
 * Wraps area stack content with a trailing 4px section divider.
 * divider:"section" is an area break, not a row separator.
 */
export function withTrailingSectionDivider(
	content: ReactNode,
	trailingSection: boolean,
): ReactNode {
	if (!trailingSection) return content;
	return (
		<>
			{content}
			<Divider type="section" />
		</>
	);
}

export function renderChildrenWithDividers(children: ReactNode, rows: boolean): ReactNode {
	if (!rows) return children;

	const childItems = Children.toArray(children);
	if (childItems.length < 2) {
		return children;
	}

	const boundaries = contentsDividerBoundaries(childItems.map(classifyDividerChild));
	return childItems.flatMap((child, index) =>
		boundaries[index]
			? [child, <Divider key={`layout-divider-${readChildKey(child)}`} type="contents" />]
			: [child],
	);
}

function readChildKey(child: ReactNode): string {
	if (isValidElement(child) && child.key !== null) return String(child.key);
	if (typeof child === "string" || typeof child === "number") return String(child);
	return "anonymous-child";
}

function toLayoutDivider(value: unknown): LayoutDivider | undefined {
	if (value === true) {
		return "contents";
	}

	if (value === false) {
		return "none";
	}

	if (value === "contents" || value === "none" || value === "section") {
		return value;
	}

	return undefined;
}
