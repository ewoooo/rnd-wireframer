import { canonicalizeLayout } from "@cx/layout/canonicalize";
import { getScreenRegions, type RenderTreeNode, type RenderTreeScreenNode } from "@cx/renderer";
import { RENDER_TREE_NODE_TYPE } from "@cx/schema";
import { type EmitContext, emitNode, GENERATED_IMPORT_PATHS } from "./emit-node";
import { formatJsxElement, serializeJsExpression, serializeJsxAttribute } from "./serialize";

export type EmitScreenTsxResult = {
	code: string; // main.tsx 전체 (import 구문 포함, 사용한 모듈만)
	warnings: string[]; // 미해석 layoutId, 카탈로그 미등록 컴포넌트 등
};

/** 393×852 모바일 캔버스 — AppScreen 크롬 없이 루트 div로 고정한다. */
const SCREEN_FRAME_STYLE = { minHeight: 852, width: 393 } as const;

/**
 * inference RenderTree(루트 Screen 노드) → 정적 main.tsx 소스 문자열.
 * React 렌더링/fs 접근 없음. data 바인딩은 입력 data로 해석해 literal로 고정한다.
 */
export function emitScreenTsx(input: {
	tree: RenderTreeNode; // 루트 screen 노드
	data?: Record<string, unknown>;
}): EmitScreenTsxResult {
	if (input.tree.type !== RENDER_TREE_NODE_TYPE.screen) {
		throw new Error(
			`emitScreenTsx: 루트 노드 type은 "${RENDER_TREE_NODE_TYPE.screen}"여야 합니다 (받은 값: "${input.tree.type}")`,
		);
	}

	const warnings: string[] = [];
	const imports = new Map<string, Set<string>>();
	const ctx: EmitContext = {
		addImport: (modulePath, name) => {
			const names = imports.get(modulePath) ?? new Set<string>();
			names.add(name);
			imports.set(modulePath, names);
		},
		data: input.data ?? {},
		warnings,
	};

	const { bottomNode, contentsNode, headerNode } = getScreenRegions(
		input.tree as RenderTreeScreenNode,
	);
	const regionIndent = "\t\t\t";
	const regions = [headerNode, contentsNode, bottomNode]
		.map((regionNode) => emitScreenRegion(regionNode, ctx, regionIndent))
		.filter((region): region is string => region !== undefined);

	const frameAttribute = `style={${serializeJsExpression(SCREEN_FRAME_STYLE, regionIndent)}}`;
	const frame = formatJsxElement({
		attributes: [frameAttribute],
		children: regions,
		indent: "\t\t",
		name: "div",
	});

	const code = [
		renderImports(imports),
		`export default function Screen() {\n\treturn (\n${frame}\n\t);\n}`,
	]
		.filter(Boolean)
		.join("\n\n");

	return { code: `${code}\n`, warnings };
}

/**
 * region(header/contents/bottom) — AppScreen/ScreenRegion 크롬 대신 @cx/layout primitive로 표현.
 * 디스패치는 RENDER_TREE_NODE_TYPE에서 파생한 contract 테이블.
 * 내용 없는 region은 통째로 생략한다(깨끗한 TSX 목표).
 */
const REGION_EMITTERS: Partial<Record<string, (input: RegionEmitInput) => string>> = {
	[RENDER_TREE_NODE_TYPE.screenBottom]: emitBottomRegion,
	[RENDER_TREE_NODE_TYPE.screenContents]: emitFlexRegion,
	[RENDER_TREE_NODE_TYPE.screenHeader]: emitFlexRegion,
};

type RegionEmitInput = {
	children: string[];
	ctx: EmitContext;
	indent: string;
	node: RenderTreeNode;
};

function emitScreenRegion(
	node: RenderTreeNode,
	ctx: EmitContext,
	indent: string,
): string | undefined {
	const emitter = REGION_EMITTERS[node.type];
	if (!emitter) {
		ctx.warnings.push(`알 수 없는 screen region type "${node.type}" (node ${node.metadata.id})`);
		return undefined;
	}

	const children = emitRegionContent(node, ctx, `${indent}\t`);
	if (children.length === 0) return undefined;

	return emitter({ children, ctx, indent, node });
}

/** render-screen.renderRegionChildren의 거울 — region layoutId가 있으면 named 컴포넌트로 감싼다. */
function emitRegionContent(node: RenderTreeNode, ctx: EmitContext, indent: string): string[] {
	let wrapperKey: string | undefined;
	if (node.layout) {
		wrapperKey = canonicalizeLayout(node.layout);
		if (!wrapperKey) {
			ctx.warnings.push(
				`미해석 layoutId "${node.layout}" (region ${node.metadata.id}) — 래퍼 없이 내용만 emit`,
			);
		}
	}

	const childIndent = wrapperKey ? `${indent}\t` : indent;
	const children = (node.children ?? [])
		.map((child) => emitNode(child, ctx, childIndent))
		.filter((child): child is string => child !== undefined);

	if (!wrapperKey || children.length === 0) return children;

	ctx.addImport(GENERATED_IMPORT_PATHS.registry, wrapperKey);
	const props = (node.props ?? {}) as Record<string, unknown>;
	return [
		formatJsxElement({
			attributes: [
				Object.keys(props).length > 0
					? `props={${serializeJsExpression(props, childIndent)}}`
					: undefined,
			],
			children,
			indent,
			name: wrapperKey,
		}),
	];
}

/** header/contents — ScreenRegion 기본값(flex column)을 Flex primitive로 환원. */
function emitFlexRegion({ children, ctx, indent, node }: RegionEmitInput): string {
	ctx.addImport(GENERATED_IMPORT_PATHS.primitives, "Flex");
	const props = (node.props ?? {}) as { layout?: Record<string, unknown> };
	const layout = { direction: "column", ...props.layout };
	return formatJsxElement({
		attributes: [`layout={${serializeJsExpression(layout, `${indent}\t`)}}`],
		children,
		indent,
		name: "Flex",
	});
}

/** bottom — BottomFixedArea primitive (sticky bottom + safe-area). */
function emitBottomRegion({ children, ctx, indent, node }: RegionEmitInput): string {
	ctx.addImport(GENERATED_IMPORT_PATHS.primitives, "BottomFixedArea");
	const props = (node.props ?? {}) as {
		layout?: { gap?: number; paddingX?: number; paddingY?: number };
		safeArea?: boolean;
	};
	const attrIndent = `${indent}\t`;
	return formatJsxElement({
		attributes: [
			serializeJsxAttribute("gap", props.layout?.gap, attrIndent),
			serializeJsxAttribute("paddingX", props.layout?.paddingX, attrIndent),
			serializeJsxAttribute("paddingY", props.layout?.paddingY, attrIndent),
			serializeJsxAttribute("safeArea", props.safeArea || undefined, attrIndent),
		],
		children,
		indent,
		name: "BottomFixedArea",
	});
}

function renderImports(imports: Map<string, Set<string>>): string {
	return [...imports.entries()]
		.filter(([, names]) => names.size > 0)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(
			([modulePath, names]) => `import { ${[...names].sort().join(", ")} } from "${modulePath}";`,
		)
		.join("\n");
}
