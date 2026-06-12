import { canonicalizeLayout } from "@cx/layout/canonicalize";
import { getScreenRegions, type RenderTreeNode, type RenderTreeScreenNode } from "@cx/renderer";
import { RENDER_TREE_NODE_TYPE } from "@cx/schema";
import { type EmitContext, emitLayoutWrapper, emitNode, GENERATED_IMPORT_PATHS } from "./emit-node";
import { formatJsxElement, serializeJsExpression } from "./serialize";

export type EmitScreenTsxResult = {
	code: string; // main.tsx 전체 (import 구문 포함, 사용한 모듈만)
	warnings: string[]; // 미해석 layoutId, 카탈로그 미등록 컴포넌트 등
};

/**
 * AppScreenRoot(@cx/layout chromes/AppScreenRoot.tsx)의 정적 거울 — AppScreen 크롬 없이
 * 루트 div 하나로 고정한다. tailwind가 없는 standalone export이므로 inline style만 쓴다.
 * - "flex flex-col overflow-hidden"            → display/flexDirection/overflow
 * - "bg-[var(--semantic-surface-page-normal,#ffffff)]" → backgroundColor (variables.css 동봉)
 * - height: min(100%, var(--cx-app-screen-max-height, 844px)) → 고정 844.
 *   standalone에는 크기 있는 조상이 없어 min(100%, …)이 성립하지 않으므로 var 기본값으로
 *   확정한다. minHeight가 아니라 height여야 contents의 flex:1 + overflow 스크롤이 성립한다.
 * - width: min(100%, var(--cx-app-screen-max-width, 390px)) → 고정 390.
 */
const SCREEN_FRAME_STYLE = {
	backgroundColor: "var(--semantic-surface-page-normal, #ffffff)",
	display: "flex",
	flexDirection: "column",
	height: 844,
	overflow: "hidden",
	width: 390,
} as const;

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
 * region 컨테이너(header/contents/bottom) — ScreenRegion(@cx/layout chromes/ScreenRegion.tsx)
 * SCREEN_REGION_RENDER_CONTRACT의 정적 거울. tailwind 클래스 의미를 inline style로 1:1 환원한다
 * (standalone export에는 tailwind가 없다). 키는 RENDER_TREE_NODE_TYPE에서 파생한 contract 테이블.
 * - header/bottom: "shrink-0"                    → { flexShrink: 0 }
 * - contents:      "flex-1 min-h-0"              → { flex: 1, minHeight: 0 }
 *                  "[scrollbar-width:none]"      → { scrollbarWidth: "none" }
 *                  getScrollClassName(scroll)    → overflowY "auto"(기본 scroll=true) | "hidden"
 *   "[&::-webkit-scrollbar]:hidden"은 pseudo-element라 inline style로 표현 불가 — 생략
 *   (scrollbarWidth:"none"이 표준 경로를 커버한다).
 * 내용 없는 region은 통째로 생략한다(깨끗한 TSX 목표).
 */
type RegionContainerContract = {
	/** ScreenRegion 기본 props.scroll의 거울 — contents만 스크롤 의미를 가진다. */
	getOverflowY?: (props: { scroll?: boolean }) => "auto" | "hidden";
	style: Record<string, number | string>;
};

const REGION_CONTAINER_CONTRACT: Partial<Record<string, RegionContainerContract>> = {
	[RENDER_TREE_NODE_TYPE.screenBottom]: { style: { flexShrink: 0 } },
	[RENDER_TREE_NODE_TYPE.screenContents]: {
		getOverflowY: (props) => (props.scroll === false ? "hidden" : "auto"),
		style: { flex: 1, minHeight: 0, scrollbarWidth: "none" },
	},
	[RENDER_TREE_NODE_TYPE.screenHeader]: { style: { flexShrink: 0 } },
};

function emitScreenRegion(
	node: RenderTreeNode,
	ctx: EmitContext,
	indent: string,
): string | undefined {
	const contract = REGION_CONTAINER_CONTRACT[node.type];
	if (!contract) {
		ctx.warnings.push(`알 수 없는 screen region type "${node.type}" (node ${node.metadata.id})`);
		return undefined;
	}

	const children = emitRegionContent(node, ctx, `${indent}\t`);
	if (children.length === 0) return undefined;

	return emitRegionContainer(contract, node, children, ctx, indent);
}

/**
 * ScreenRegion 1개 → Flex primitive. 런타임처럼 region props.layout(direction 등)을
 * flex layout으로 반영하고, 위 contract 테이블의 의미 스타일을 style로 병합한다.
 */
function emitRegionContainer(
	contract: RegionContainerContract,
	node: RenderTreeNode,
	children: string[],
	ctx: EmitContext,
	indent: string,
): string {
	ctx.addImport(GENERATED_IMPORT_PATHS.primitives, "Flex");
	const props = (node.props ?? {}) as { layout?: Record<string, unknown>; scroll?: boolean };
	const layout = { direction: "column", ...props.layout };
	const style = {
		...contract.style,
		...(contract.getOverflowY ? { overflowY: contract.getOverflowY(props) } : {}),
	};
	const attrIndent = `${indent}\t`;
	return formatJsxElement({
		attributes: [
			`layout={${serializeJsExpression(layout, attrIndent)}}`,
			`style={${serializeJsExpression(style, attrIndent)}}`,
		],
		children,
		indent,
		name: "Flex",
	});
}

/**
 * render-screen.renderRegionChildren의 거울 — region layoutId가 있으면 emit-node와 동일한
 * emitLayoutWrapper 경로(primitive-target 우선 + named fallback)로 감싼다.
 */
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
	// childNodes는 children 문자열과 1:1 정렬 — emitLayoutWrapper의 rowDivider kinds 계산용.
	const entries = (node.children ?? []).flatMap((child) => {
		const code = emitNode(child, ctx, childIndent);
		return code === undefined ? [] : [{ child, code }];
	});
	const children = entries.map((entry) => entry.code);

	if (!wrapperKey || node.layout === undefined || children.length === 0) return children;

	return [
		emitLayoutWrapper({
			childNodes: entries.map((entry) => entry.child),
			children,
			componentKey: wrapperKey,
			ctx,
			indent,
			layoutId: node.layout,
			nodeId: node.metadata.id,
			props: (node.props ?? {}) as Record<string, unknown>,
		}),
	];
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
