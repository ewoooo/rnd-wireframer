import * as ExternalRegistry from "@cx/external";
import {
	canonicalizeComponentType,
	componentExportNameOf,
	getComponentCatalogEntry,
} from "@cx/external/resolver";
import { canonicalizeLayout } from "@cx/layout/canonicalize";
import { type PrimitiveTarget, resolvePrimitiveTarget } from "@cx/layout/primitive-target";
import {
	buildComponentProps,
	ERROR_POLICY,
	type RenderTreeNode,
	resolveHasData,
	resolveRenderNode,
} from "@cx/renderer";
import { type ComponentCatalogEntry, RENDER_TREE_NODE_TYPE } from "@cx/schema";
import {
	formatJsxElement,
	serializeJsExpression,
	serializeJsxAttribute,
	serializeJsxText,
} from "./serialize";

/** 생성 코드가 사용하는 import 경로. 후속 패키징 단계에서 tsconfig paths alias 대상. */
export const GENERATED_IMPORT_PATHS = {
	external: "@cx/external",
	primitives: "@cx/layout/primitives",
	registry: "@cx/layout/registry",
} as const;

export type EmitContext = {
	addImport: (modulePath: string, name: string) => void;
	data: Record<string, unknown>;
	warnings: string[];
};

type EmitNodeInput = {
	ctx: EmitContext;
	emitChildren: (childIndent: string) => string[];
	indent: string;
	node: RenderTreeNode;
	props: Record<string, unknown>;
};

/**
 * renderer interpreter(render-node.tsx)의 정적 거울.
 * 같은 분기(resolveRenderNode → layout → primitive → area → children → component)를 따라가되
 * React element 대신 TSX 문자열을 emit한다. 반환 undefined = 노드 생략(display.when false 등).
 */
export function emitNode(
	node: RenderTreeNode,
	ctx: EmitContext,
	indent: string,
): string | undefined {
	const resolved = resolveRenderNode(node, ctx.data);
	if (!resolved) return undefined;

	const emitChildren = (childIndent: string) =>
		(node.children ?? [])
			.map((child) => emitNode(child, ctx, childIndent))
			.filter((child): child is string => child !== undefined);

	const input: EmitNodeInput = { ctx, emitChildren, indent, node, props: resolved.props };

	if (node.layout) return emitNamedLayout(node.layout, input);
	return emitNodeWithoutLayout(input);
}

/**
 * node.layout(패턴 layoutId) 처리.
 * 1) primitive-target resolver(@cx/layout/primitive-target)가 해석하면 @cx/layout primitive로
 *    unwrap한다 — defaults가 병합된 직렬화 props만 남기고 node/metadata 배관은 제거.
 * 2) 해석 불가(중첩/슬롯/bespoke 패밀리)면 기존대로 @cx/layout/registry의 canonical named
 *    컴포넌트로 감싼다(혼합 출력 허용 — 의도된 설계).
 * 런타임(render-layout.tsx)과 동일하게 className은 보존한다.
 */
function emitNamedLayout(layoutId: string, input: EmitNodeInput): string | undefined {
	const componentKey = canonicalizeLayout(layoutId);
	if (!componentKey) {
		input.ctx.warnings.push(
			`미해석 layoutId "${layoutId}" (node ${input.node.metadata.id}) — 래퍼 없이 내용만 emit`,
		);
		return emitNodeWithoutLayout(input);
	}

	const target = resolvePrimitiveTarget(layoutId, input.props);
	if (target) return emitPrimitiveLayoutTarget(layoutId, target, input);

	input.ctx.addImport(GENERATED_IMPORT_PATHS.registry, componentKey);

	const childIndent = `${input.indent}\t`;
	const attributes = [
		serializeJsxAttribute("className", input.node.className, childIndent),
		Object.keys(input.props).length > 0
			? `props={${serializeJsExpression(input.props, childIndent)}}`
			: undefined,
	];

	return formatJsxElement({
		attributes,
		children: emitLayoutChildren(input),
		indent: input.indent,
		name: componentKey,
	});
}

/** 해석된 PrimitiveTarget → primitive JSX. droppedProps(divider 등)는 warning 1줄로 남긴다. */
function emitPrimitiveLayoutTarget(
	layoutId: string,
	target: PrimitiveTarget,
	input: EmitNodeInput,
): string {
	input.ctx.addImport(GENERATED_IMPORT_PATHS.primitives, target.primitive);

	if (target.droppedProps !== undefined && target.droppedProps.length > 0) {
		input.ctx.warnings.push(
			`layout "${layoutId}" unwrap (node ${input.node.metadata.id}): primitive 미지원 prop 생략 — ${target.droppedProps.join(", ")}`,
		);
	}

	const childIndent = `${input.indent}\t`;
	const attributes = [
		serializeJsxAttribute("className", input.node.className, childIndent),
		...Object.entries(target.props)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, value]) => serializeJsxAttribute(key, value, childIndent)),
	];

	return formatJsxElement({
		attributes,
		children: emitLayoutChildren(input),
		indent: input.indent,
		name: target.primitive,
	});
}

/** layout 래퍼의 children — 없으면 노드 자신의 내용을 한 단계 안에서 emit(leaf 케이스). */
function emitLayoutChildren(input: EmitNodeInput): string[] {
	const childIndent = `${input.indent}\t`;
	const children = input.emitChildren(childIndent);
	if (children.length > 0) return children;

	const inner = emitNodeWithoutLayout({ ...input, indent: childIndent });
	return inner === undefined ? [] : [inner];
}

/**
 * 노드 type 디스패치 — RENDER_TREE_NODE_TYPE에서 파생한 contract 테이블.
 * (renderNodeWithoutLayout의 primitive → area 분기와 동일한 어휘)
 */
const STRUCTURAL_EMITTERS: Partial<Record<string, (input: EmitNodeInput) => string | undefined>> = {
	[RENDER_TREE_NODE_TYPE.areaDynamic]: emitDynamicAreaNode,
	[RENDER_TREE_NODE_TYPE.areaStatic]: emitAreaStack,
	[RENDER_TREE_NODE_TYPE.layoutFlex]: emitPrimitiveNode("Flex"),
	[RENDER_TREE_NODE_TYPE.layoutGrid]: emitPrimitiveNode("Grid"),
};

function emitNodeWithoutLayout(input: EmitNodeInput): string | undefined {
	const structural = STRUCTURAL_EMITTERS[input.node.type];
	if (structural) return structural(input);

	// 구조 노드도 leaf 컴포넌트도 아니면 children passthrough (render-node와 동일).
	const children = input.emitChildren(input.indent);
	if (children.length > 0) return children.join("\n");

	return emitComponentNode(input);
}

/** Layout.Flex / Layout.Grid → @cx/layout/primitives. node={{…}} 배관은 제거(깨끗한 export). */
function emitPrimitiveNode(name: "Flex" | "Grid") {
	return (input: EmitNodeInput): string => {
		input.ctx.addImport(GENERATED_IMPORT_PATHS.primitives, name);
		const childIndent = `${input.indent}\t`;
		return formatJsxElement({
			attributes: [`layout={${serializeJsExpression(input.props, childIndent)}}`],
			children: input.emitChildren(childIndent),
			indent: input.indent,
			name,
		});
	};
}

/**
 * area.static / area.dynamic의 정적 거울 — nodes/area의
 * section(flex col gap=titleGap) > div(flex col gap=componentGap) 구조를 VStack 중첩으로 emit.
 * divider는 area stack prop이며 leaf가 아니다(패턴 layout이 있으면 props로 그대로 전달됨).
 */
function emitAreaStack(input: EmitNodeInput): string {
	const titleGap = toFiniteNumber(input.props.titleGap, 8);
	const componentGap = toFiniteNumber(input.props.componentGap, 12);
	input.ctx.addImport(GENERATED_IMPORT_PATHS.primitives, "VStack");

	if (input.props.listPresentation === "selection-list") {
		input.ctx.warnings.push(
			`area ${input.node.metadata.id}: listPresentation "selection-list" 시각 크롬은 생략(기본 스택으로 emit)`,
		);
	}

	const outerChildIndent = `${input.indent}\t`;
	const inner = formatJsxElement({
		attributes: [`gap={${componentGap}}`],
		children: input.emitChildren(`${outerChildIndent}\t`),
		indent: outerChildIndent,
		name: "VStack",
	});

	return formatJsxElement({
		attributes: [`gap={${titleGap}}`],
		children: [inner],
		indent: input.indent,
		name: "VStack",
	});
}

/**
 * area.dynamic — hasData를 입력 data로 평가해 errorPolicy 분기까지 정적으로 고정한다.
 * (nodes/area/dynamic.tsx + error-policy.tsx의 거울)
 */
function emitDynamicAreaNode(input: EmitNodeInput): string | undefined {
	if (!resolveHasData(input.ctx.data, input.node.metadata.id)) {
		const fallback = EMPTY_AREA_FALLBACK_EMITTERS[String(input.props.errorPolicy)];
		if (fallback) return fallback(input);
	}
	return emitAreaStack(input);
}

const EMPTY_AREA_FALLBACK_EMITTERS: Record<string, (input: EmitNodeInput) => string | undefined> = {
	[ERROR_POLICY.HIDE_AREA]: () => undefined,
	[ERROR_POLICY.HIDE_ITEM]: (input) => {
		input.ctx.addImport(GENERATED_IMPORT_PATHS.primitives, "VStack");
		return `${input.indent}<VStack gap={${toFiniteNumber(input.props.titleGap, 8)}} />`;
	},
	[ERROR_POLICY.SHOW_DEFAULT]: (input) => {
		input.ctx.addImport(GENERATED_IMPORT_PATHS.primitives, "VStack");
		return formatJsxElement({
			attributes: [`gap={${toFiniteNumber(input.props.titleGap, 8)}}`],
			children: [`${input.indent}\t<p>기본값 표시 — 데이터 미수신</p>`],
			indent: input.indent,
			name: "VStack",
		});
	},
};

/**
 * external(kiki.X) 컴포넌트 — buildComponentProps로 props를 확정한 뒤 `<AppBar title="…" />` emit.
 * 캐논화/strip 규칙은 @cx/external/resolver가 단일 진실원. canonical 실패 시 raw type fallback.
 */
function emitComponentNode(input: EmitNodeInput): string | undefined {
	const canonicalType = canonicalizeComponentType(input.node.type) ?? input.node.type;
	const exportName = componentExportNameOf(canonicalType);
	const component = (ExternalRegistry as Record<string, unknown>)[exportName];
	if (typeof component !== "function") {
		input.ctx.warnings.push(
			`카탈로그 미등록 컴포넌트 "${input.node.type}" (node ${input.node.metadata.id}) — emit 생략`,
		);
		return undefined;
	}

	input.ctx.addImport(GENERATED_IMPORT_PATHS.external, exportName);

	const finalProps = buildComponentProps(input.node.type, input.props);
	const entry = getComponentCatalogEntry(canonicalType);
	const childIndent = `${input.indent}\t`;
	const { attributes, textChild } = collectComponentAttributes(finalProps, entry, childIndent);

	return formatJsxElement({
		attributes,
		children: textChild === undefined ? [] : [`${childIndent}${serializeJsxText(textChild)}`],
		indent: input.indent,
		name: exportName,
	});
}

/**
 * 확정 props → JSX attribute 목록.
 * - undefined / 계약 defaultValue와 동일한 값은 생략
 * - children이 텍스트(string/number)면 attribute가 아니라 JSX children으로 분리
 */
export function collectComponentAttributes(
	props: Record<string, unknown>,
	entry: ComponentCatalogEntry | undefined,
	indent: string,
): { attributes: string[]; textChild: string | undefined } {
	const attributes: string[] = [];
	let textChild: string | undefined;

	for (const [key, value] of Object.entries(props).sort(([a], [b]) => a.localeCompare(b))) {
		if (value === undefined) continue;
		if (entry && isSameAsDefault(value, entry.props[key]?.defaultValue)) continue;
		if (key === "children" && (typeof value === "string" || typeof value === "number")) {
			textChild = String(value);
			continue;
		}
		const attribute = serializeJsxAttribute(key, value, indent);
		if (attribute) attributes.push(attribute);
	}

	return { attributes, textChild };
}

function isSameAsDefault(value: unknown, defaultValue: unknown): boolean {
	if (defaultValue === undefined) return false;
	return JSON.stringify(value) === JSON.stringify(defaultValue);
}

function toFiniteNumber(value: unknown, fallback: number): number {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return fallback;
}
