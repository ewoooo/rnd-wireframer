export type PromptArtifactSection = {
	title: string;
	body: string;
};

export function joinPromptSections(sections: PromptArtifactSection[]): string {
	return sections.map((section) => `## ${section.title}\n\n${section.body}`).join("\n\n");
}
