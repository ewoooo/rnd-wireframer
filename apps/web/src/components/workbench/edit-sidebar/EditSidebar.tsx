"use client";

import { Puck } from "@puckeditor/core";
import { ICONS } from "@/components/icons";
import { Aside, Panel } from "@/components/layout/Aside";
import { NewScreenSourceMarkdownPanel } from "@/feature/inference-new-screen/components/NewScreenSourceMarkdownPanel";
import type { EditScope } from "@/model/puck-edit-scope";

type EditSidebarProps = {
	newScreenSource?: { runId?: string };
	scope?: EditScope;
};

/**
 * RightAside — 좌측 LeftAside와 동일한 Panel chrome(헤더·패딩·배경)으로 통일.
 *   우상단: Properties (선택 요소 props/text — Puck.Fields)
 *   우하단: Blocks (children 불러오기 — Puck.Components)
 */
export function EditSidebar({ newScreenSource, scope }: EditSidebarProps) {
	// Run(agent) 탭: 우측 패널에 선택한 화면의 입력 md 원문을 그대로 보여준다(4패널 규칙 밖).
	// fill=true → 부모 ResizablePanel(가로 드래그) 폭을 가득 채운다.
	if (newScreenSource) {
		return (
			<Aside fill side="right">
				<Panel
					title="Source MD"
					icon={<ICONS.rawValue className="size-3.5" data-icon="inline-start" />}
					bodyClassName="p-0"
				>
					<NewScreenSourceMarkdownPanel runId={newScreenSource.runId} />
				</Panel>
			</Aside>
		);
	}

	if (!scope) {
		return (
			<Aside side="right">
				<Panel
					title="Properties"
					icon={<ICONS.properties className="size-3.5" data-icon="inline-start" />}
				>
					<div className="px-3 py-3 text-sm text-muted-foreground">편집할 대상을 선택해주세요.</div>
				</Panel>
			</Aside>
		);
	}

	// 우하단(children 불러오기) = 현재 페이지의 *하위 타입*. screen▸area, area▸component, component▸rawValue.
	const childSlot = {
		"screen-region": { icon: ICONS.area, title: "Areas" },
		area: { icon: ICONS.component, title: "Components" },
		component: { icon: ICONS.rawValue, title: "Values" },
	}[scope.kind];
	const ChildIcon = childSlot.icon;

	return (
		<Aside side="right">
			<Panel
				title="Properties"
				icon={<ICONS.properties className="size-3.5" data-icon="inline-start" />}
				defaultSize={55}
				minSize={20}
				bodyClassName="px-2 py-2"
			>
				<Puck.Fields />
			</Panel>
			<Panel
				title={childSlot.title}
				icon={<ChildIcon className="size-3.5" data-icon="inline-start" />}
				defaultSize={45}
				minSize={20}
				bodyClassName="px-2 py-2"
			>
				<Puck.Components />
			</Panel>
		</Aside>
	);
}
