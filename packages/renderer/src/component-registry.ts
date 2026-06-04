export interface ComponentDefinition<TComponent = unknown> {
	component: TComponent;
	version: string;
	validator?: (props: unknown) => boolean;
}

export class ComponentRegistry<TComponent = unknown> {
	private components = new Map<string, Map<string, ComponentDefinition<TComponent>>>();

	register(type: string, definition: ComponentDefinition<TComponent>): void {
		const versions =
			this.components.get(type) ?? new Map<string, ComponentDefinition<TComponent>>();
		if (!versions.has(definition.version)) {
			versions.set(definition.version, definition);
		}
		this.components.set(type, versions);
	}

	registerAll(definitions: Record<string, ComponentDefinition<TComponent>>): void {
		for (const [type, definition] of Object.entries(definitions)) {
			this.register(type, definition);
		}
	}

	get(type: string, version = "latest"): ComponentDefinition<TComponent> | undefined {
		const versions = this.components.get(type);
		if (!versions) return undefined;

		if (version === "latest") {
			const latest = this.getLatestVersion(type);
			return latest ? versions.get(latest) : undefined;
		}

		return versions.get(version);
	}

	has(type: string, version?: string): boolean {
		if (!version) return this.components.has(type);
		return Boolean(this.get(type, version));
	}

	getTypes(): string[] {
		return Array.from(this.components.keys()).sort();
	}

	getVersions(type: string): string[] {
		return Array.from(this.components.get(type)?.keys() ?? []).sort(compareVersionDesc);
	}

	getLatestVersion(type: string): string | undefined {
		return this.getVersions(type)[0];
	}

	clear(): void {
		this.components.clear();
	}
}

export const componentRegistry = new ComponentRegistry();

function compareVersionDesc(a: string, b: string): number {
	const left = parseVersion(a);
	const right = parseVersion(b);

	for (let index = 0; index < 3; index += 1) {
		const delta = right[index] - left[index];
		if (delta !== 0) return delta;
	}

	return b.localeCompare(a);
}

function parseVersion(version: string): [number, number, number] {
	const [major = "0", minor = "0", patch = "0"] = version.split(".");
	return [Number(major) || 0, Number(minor) || 0, Number(patch) || 0];
}
