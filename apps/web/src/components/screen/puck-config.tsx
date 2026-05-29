import type { Config, Data } from "@measured/puck";
import type { AppArea, AppScreen } from "@/adapters/tables-to-render-tree";

export function buildPuckConfig(areas: AppArea[]): Config {
	const components: Config["components"] = {};

	for (const area of areas) {
		components[area.code] = {
			label: area.name,
			fields: {},
			render: () => (
				<div style={{ padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}>
					<p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>{area.name}</p>
					<p style={{ color: "#94a3b8", fontSize: 11, margin: "2px 0 0" }}>{area.code}</p>
				</div>
			),
		};
	}

	return { components };
}

export function buildPuckData(screen: AppScreen | undefined): Data {
	if (!screen) return { content: [], root: { props: {} }, zones: {} };

	const sorted = [...screen.areas].sort((a, b) => a.order - b.order);
	return {
		content: sorted.map(({ areaCode }) => ({
			type: areaCode,
			props: {},
		})),
		root: { props: {} },
		zones: {},
	};
}
