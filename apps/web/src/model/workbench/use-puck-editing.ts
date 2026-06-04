"use client";

import type { PuckCatalogItem } from "@cx/adapters/puck";
import type { RenderTreeNode, RenderTreeScreenNode } from "@cx/renderer";
import type { Data } from "@puckeditor/core";
import { useEffect, useState } from "react";
import { fetchPuckCatalogItemsFromApi, type PuckCatalogScope } from "@/lib/screens-client";
import type { ScreenSummary } from "@/lib/screen-sources";
import {
	applyPuckChangeToScope,
	normalizePuckData,
	readItemKindForScope,
	resolveCatalogItemsForScope,
} from "@/lib/workbench-puck/puck-scope";
import { isPuckEditTab, resolveEditScope } from "@/model/puck-edit-scope";
import type { NavigatorTab } from "@/model/workbench-view-model";

export function usePuckEditing(input: {
	activeTab: NavigatorTab;
	visibleScreen?: ScreenSummary;
	selectedArea?: RenderTreeNode;
	selectedComponent?: RenderTreeNode;
	onScreenCandidateChange: (screenId: string, node: RenderTreeScreenNode) => void;
}) {
	const { activeTab, visibleScreen, selectedArea, selectedComponent, onScreenCandidateChange } =
		input;

	const [puckCatalogItemsByScope, setPuckCatalogItemsByScope] = useState<
		Partial<Record<PuckCatalogScope, PuckCatalogItem[]>>
	>({});

	const editScope = resolveEditScope({
		activeTab,
		selectedArea,
		selectedComponent,
		selectedScreen: visibleScreen?.renderTree,
	});
	const isEditingWithPuck = isPuckEditTab(activeTab) && !!editScope;
	const puckCatalogScope = readPuckCatalogScope(editScope);
	const catalogItems =
		editScope && puckCatalogScope
			? (puckCatalogItemsByScope[puckCatalogScope] ?? resolveCatalogItemsForScope(editScope))
			: editScope
				? resolveCatalogItemsForScope(editScope)
				: [];

	useEffect(() => {
		if (!puckCatalogScope || puckCatalogItemsByScope[puckCatalogScope]) return;
		const scope = puckCatalogScope;
		let isActive = true;

		async function loadPuckCatalogItems() {
			try {
				const catalogItems = await fetchPuckCatalogItemsFromApi(scope);
				if (!isActive) return;
				setPuckCatalogItemsByScope((current) => ({
					...current,
					[scope]: catalogItems,
				}));
			} catch (error) {
				console.error(`Failed to load Puck catalog '${scope}':`, error);
			}
		}

		void loadPuckCatalogItems();

		return () => {
			isActive = false;
		};
	}, [puckCatalogScope, puckCatalogItemsByScope]);

	function handlePuckChange(nextData: Data) {
		if (!editScope || !visibleScreen) return;
		const puckData = normalizePuckData(nextData, readItemKindForScope(editScope));
		const nextScreen = applyPuckChangeToScope({
			catalogItems,
			data: puckData,
			scope: editScope,
		});
		onScreenCandidateChange(visibleScreen.id, nextScreen as RenderTreeScreenNode);
	}

	return {
		editScope,
		isEditingWithPuck,
		catalogItems,
		editScopeKey: editScope ? readEditScopeKey(editScope) : "none",
		handlePuckChange,
	};
}

function readEditScopeKey(scope: NonNullable<ReturnType<typeof resolveEditScope>>) {
	if (scope.kind === "screen-region") return scope.regionType;
	if (scope.kind === "area") return scope.area.metadata.id;
	return scope.component.metadata.id;
}

function readPuckCatalogScope(
	scope: ReturnType<typeof resolveEditScope>,
): PuckCatalogScope | undefined {
	if (!scope || scope.kind === "component") return undefined;
	return scope.kind;
}
