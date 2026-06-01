import { RenderTreeNodeRenderer } from "@cx/renderer";
import type { Config, Data, Overrides } from "@measured/puck";
import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AppArea, AppScreen } from "@/adapters/tables-to-render-tree";

export function buildPuckConfig(areas: AppArea[], screen: AppScreen | undefined): Config {
	const components: Config["components"] = {};
	const schemaData = screen?.schema.data;
	const sortedAreas = [...areas].sort((a, b) => a.name.localeCompare(b.name, "ko"));

	for (const area of sortedAreas) {
		components[area.code] = {
			label: area.name,
			fields: {},
			render: () => <RenderTreeNodeRenderer data={schemaData} node={area.node} />,
		};
	}

	return { components, root: { fields: {} } };
}

export function buildPuckOverrides(config: Config): Partial<Overrides> {
	return {
		drawerItem: ({ children, name }) => {
			const renderArea = config.components[name]?.render as undefined | (() => ReactNode);
			return (
				<Tooltip delayDuration={150}>
					<TooltipTrigger asChild>
						<div>{children}</div>
					</TooltipTrigger>
					<TooltipContent
						side="left"
						align="start"
						className="max-w-none w-80 max-h-96 overflow-auto bg-popover p-2"
					>
						<div className="overflow-hidden rounded-md border bg-white">
							{renderArea ? renderArea() : null}
						</div>
					</TooltipContent>
				</Tooltip>
			);
		},
	};
}

export function buildPuckData(screen: AppScreen | undefined): Data {
	if (!screen) return { content: [], root: { props: {} }, zones: {} };

	const sorted = [...screen.areas].sort((a, b) => a.order - b.order);
	return {
		content: sorted.map(({ areaCode }, index) => ({
			type: areaCode,
			props: { id: `${areaCode}-${index}` },
		})),
		root: { props: {} },
		zones: {},
	};
}
