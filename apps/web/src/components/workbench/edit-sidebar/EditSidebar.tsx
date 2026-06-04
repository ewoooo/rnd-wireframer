"use client";

import { Puck } from "@puckeditor/core";
import type { EditScope } from "@/components/puck/workbench/edit-scope";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import {
	type NewScreenReviewData,
	NewScreenReviewSummary,
} from "@/components/workbench/new-screen/NewScreenReviewSummary";
import { EditSidebarHeader } from "./EditSidebarHeader";
import { EditSidebarPane } from "./EditSidebarPane";

type EditSidebarProps = {
	newScreenReview?: NewScreenReviewData;
	scope?: EditScope;
};

export function EditSidebar({ newScreenReview, scope }: EditSidebarProps) {
	return (
		<Sidebar side="right">
			<EditSidebarHeader scope={scope} title={newScreenReview ? "Review" : undefined} />
			<SidebarContent className="gap-0 overflow-hidden p-0">
				{newScreenReview ? (
					<NewScreenReviewSummary review={newScreenReview} />
				) : scope ? (
					<>
						<EditSidebarPane title="Properties">
							<Puck.Fields />
						</EditSidebarPane>
						<EditSidebarPane title="Blocks">
							<Puck.Components />
						</EditSidebarPane>
					</>
				) : (
					<div className="p-3 text-sm text-muted-foreground">편집할 대상을 선택해주세요.</div>
				)}
			</SidebarContent>
		</Sidebar>
	);
}
