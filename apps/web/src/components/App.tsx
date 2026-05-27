"use client";

import type { RenderTreeScreenNode } from "@cx/engine";
import { RenderedScreen } from "./screen/RenderedScreen";

const previewScreen: RenderTreeScreenNode = {
	type: "Screen",
	componentVersion: "0.1.0",
	metadata: {
		id: "redesign-preview",
		title: "Redesign Preview",
	},
	children: [
		{
			type: "Screen.Header",
			componentVersion: "0.1.0",
			metadata: {
				id: "redesign-preview-header",
				title: "Header",
			},
			props: {
				position: "static",
				layout: {
					direction: "column",
				},
			},
			children: [
				{
					type: "AppBar",
					componentVersion: "1.0.0",
					metadata: {
						id: "redesign-preview-appbar",
						title: "생성 과정 재설계",
					},
					props: {
						title: "생성 과정 재설계",
						showBack: false,
						showLogo: false,
					},
				},
			],
		},
		{
			type: "Screen.Contents",
			componentVersion: "0.1.0",
			metadata: {
				id: "redesign-preview-contents",
				title: "Contents",
			},
			props: {
				layout: {
					direction: "column",
					gap: 16,
					paddingX: 20,
					paddingY: 24,
				},
				scroll: true,
			},
			children: [
				{
					type: "Callout",
					componentVersion: "1.0.0",
					metadata: {
						id: "redesign-preview-callout",
						title: "앱은 소비만 합니다",
						description: "생성, 검수, 저장, API 책임은 앱 밖에서 다시 설계합니다.",
					},
					props: {
						title: "앱은 소비만 합니다",
						children: "생성, 검수, 저장, API 책임은 앱 밖에서 다시 설계합니다.",
					},
				},
			],
		},
		{
			type: "Screen.Bottom",
			componentVersion: "0.1.0",
			metadata: {
				id: "redesign-preview-bottom",
				title: "Bottom",
			},
			props: {
				position: "static",
				layout: {
					direction: "column",
				},
				safeArea: true,
			},
			children: [],
		},
	],
};

export function App() {
	return (
		<main className="flex min-h-svh items-center justify-center bg-secondary/50 p-6">
			<RenderedScreen node={previewScreen} />
		</main>
	);
}
