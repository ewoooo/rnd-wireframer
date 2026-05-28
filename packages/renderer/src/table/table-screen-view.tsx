"use client";

import type { ReactNode } from "react";
import { RenderTreeView } from "../render";
import { materializeTableScreen } from "./materialize-table-screen";
import type { TableScreenData } from "./types";

export type TableScreenViewProps = {
	data?: Record<string, unknown>;
	empty?: ReactNode;
	screenId: string;
	tables: TableScreenData;
};

export function TableScreenView({ data, empty = null, screenId, tables }: TableScreenViewProps) {
	const node = materializeTableScreen({ screenId, tables });
	if (!node) return empty;
	return <RenderTreeView data={data} node={node} />;
}
