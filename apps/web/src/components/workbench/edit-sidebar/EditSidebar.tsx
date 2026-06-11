"use client";

import { Puck } from "@puckeditor/core";
import { ICONS } from "@/components/icons";
import { Aside, Panel } from "@/components/layout/Aside";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import {
	type NewScreenReviewData,
	NewScreenReviewSummary,
} from "@/feature/inference-new-screen/components/NewScreenReviewSummary";
import type { EditScope } from "@/model/puck-edit-scope";
import { EditSidebarHeader } from "./EditSidebarHeader";

type EditSidebarProps = {
	newScreenReview?: NewScreenReviewData;
	scope?: EditScope;
};

/**
 * RightAside — 좌측 LeftAside와 동일한 Panel chrome(헤더·패딩·배경)으로 통일.
 *   우상단: Properties (선택 요소 props/text — Puck.Fields)
 *   우하단: Blocks (children 불러오기 — Puck.Components)
 */
export function EditSidebar({ newScreenReview, scope }: EditSidebarProps) {
	// Run 탭 리뷰 요약: 현행 유지(4패널 규칙 밖).
	if (newScreenReview) {
		return (
			<Sidebar side="right">
				<EditSidebarHeader title="Review" />
				<SidebarContent className="gap-0 overflow-hidden p-0">
					<NewScreenReviewSummary review={newScreenReview} />
				</SidebarContent>
			</Sidebar>
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
