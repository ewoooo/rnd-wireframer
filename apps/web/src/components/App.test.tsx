import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "@/components/App";
import type { ScreenSummary } from "@/lib/screen-sources";

afterEach(() => {
	cleanup();
	window.localStorage.clear();
	vi.unstubAllGlobals();
});

describe("App workbench navigation", () => {
	it("loads screens through the screen API, switches tabs, and keeps safe placeholders", async () => {
		stubBrowserApis();
		stubScreenFetch();
		render(<App />);

		expect(
			await screen.findByRole("heading", { level: 1, name: "Preview Default" }),
		).toBeInTheDocument();
		expect(screen.getAllByText("Preview Route").length).toBeGreaterThan(0);

		fireEvent.click(screen.getByRole("button", { name: "컴포넌트" }));

		expect(screen.getByText("Components")).toBeInTheDocument();
		expect(screen.getAllByText("Preview CTA").length).toBeGreaterThan(0);
		expect(screen.getByText("preview-cta")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "그룹" }));

		expect(screen.getByText("Areas")).toBeInTheDocument();
		expect(screen.getAllByText("Preview Area").length).toBeGreaterThan(0);
		expect(screen.getByText("preview-area")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "새 화면" }));

		expect(screen.getByRole("button", { name: "새 화면" })).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByText("Markdown 드롭")).toBeInTheDocument();
		expect(screen.getByText("업로드된 screenId가 없습니다.")).toBeInTheDocument();

		const fileInput = document.querySelector<HTMLInputElement>("input[type='file']");
		expect(fileInput).not.toBeNull();
		fireEvent.change(fileInput as HTMLInputElement, {
			target: {
				files: [new File(["---\n화면 ID: NOVA-UPLOAD-PG-001-0\n---"], "NOVA-UPLOAD-PG-001-0.md")],
			},
		});

		expect(await screen.findByText("NOVA-UPLOAD-PG-001-0")).toBeInTheDocument();
		expect(
			screen.getByText("data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md"),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Run" }));
		expect((await screen.findAllByText("running")).length).toBeGreaterThan(0);
		expect(readRunRequests()).toContainEqual(
			expect.objectContaining({
				screenId: "NOVA-UPLOAD-PG-001-0",
				useAI: true,
			}),
		);
	});

	it("selects the first screen when a route is selected and switches variant chips", async () => {
		stubBrowserApis();
		stubScreenFetch();
		render(<App />);

		await screen.findByRole("heading", { level: 1, name: "Preview Default" });

		fireEvent.click(screen.getByRole("button", { name: /Member Route/ }));

		expect(screen.getByRole("heading", { level: 1, name: "Member Base" })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "E1" }));

		expect(screen.getByRole("heading", { level: 1, name: "Member Base-E1" })).toBeInTheDocument();
		expect(screen.getAllByText("Member Route").length).toBeGreaterThan(0);
	});

	it("renders new screen inference review artifacts without requiring quality summary", async () => {
		stubBrowserApis();
		stubScreenFetch({ inferenceStatus: "waiting-review", qualityHasSummary: false });
		render(<App />);

		await screen.findByRole("heading", { level: 1, name: "Preview Default" });
		fireEvent.click(screen.getByRole("button", { name: "새 화면" }));

		const fileInput = document.querySelector<HTMLInputElement>("input[type='file']");
		expect(fileInput).not.toBeNull();
		fireEvent.change(fileInput as HTMLInputElement, {
			target: {
				files: [new File(["---\n화면 ID: NOVA-UPLOAD-PG-001-0\n---"], "NOVA-UPLOAD-PG-001-0.md")],
			},
		});

		expect(await screen.findByText("NOVA-UPLOAD-PG-001-0")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Run" }));

		expect(await screen.findByText("Generated Area")).toBeInTheDocument();
		expect(screen.getAllByText("waiting-review").length).toBeGreaterThan(0);
		expect(screen.getAllByText("0 errors · 0 warnings").length).toBeGreaterThanOrEqual(2);
		expect(readRunRequests()).toContainEqual(
			expect.objectContaining({
				screenId: "NOVA-UPLOAD-PG-001-0",
				useAI: true,
			}),
		);
	});

	it("restores uploaded new screen sources and polling after refresh", async () => {
		window.localStorage.setItem(
			"cx.new-screen.workbench.v0.1",
			JSON.stringify({
				selectedSourcePath: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
				sources: [
					{
						batchId: "20260604",
						importId: "web-upload",
						latestRunId: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
						path: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
						screenId: "NOVA-UPLOAD-PG-001-0",
						type: "file",
					},
				],
			}),
		);
		stubBrowserApis();
		stubScreenFetch();
		render(<App />);

		await screen.findByRole("heading", { level: 1, name: "Preview Default" });
		fireEvent.click(screen.getByRole("button", { name: "새 화면" }));

		expect(screen.getByText("NOVA-UPLOAD-PG-001-0")).toBeInTheDocument();
		expect(
			screen.getByText("data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md"),
		).toBeInTheDocument();
		expect((await screen.findAllByText("running")).length).toBeGreaterThan(0);
	});

	it("loads uploaded new screen sources from the server when browser state is empty", async () => {
		stubBrowserApis();
		stubScreenFetch({
			serverSources: [
				{
					batchId: "20260604",
					importId: "web-upload",
					latestRunId: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
					path: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
					screenId: "NOVA-UPLOAD-PG-001-0",
					type: "file",
				},
			],
		});
		render(<App />);

		await screen.findByRole("heading", { level: 1, name: "Preview Default" });
		fireEvent.click(screen.getByRole("button", { name: "새 화면" }));

		expect(await screen.findByText("NOVA-UPLOAD-PG-001-0")).toBeInTheDocument();
		expect((await screen.findAllByText("running")).length).toBeGreaterThan(0);
	});

	it("drops non web-upload sources restored from browser state", async () => {
		window.localStorage.setItem(
			"cx.new-screen.workbench.v0.1",
			JSON.stringify({
				selectedSourcePath: "data/client-imports/{id}/260528_mbr/NOVA-MBR-PU-003-E3.md",
				sources: [
					{
						batchId: "260528_mbr",
						importId: "{id}",
						path: "data/client-imports/{id}/260528_mbr/NOVA-MBR-PU-003-E3.md",
						screenId: "NOVA-MBR-PU-003-E3",
						type: "file",
					},
				],
			}),
		);
		stubBrowserApis();
		stubScreenFetch({
			serverSources: [
				{
					batchId: "20260604",
					importId: "web-upload",
					path: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
					screenId: "NOVA-UPLOAD-PG-001-0",
					type: "file",
				},
			],
		});
		render(<App />);

		await screen.findByRole("heading", { level: 1, name: "Preview Default" });
		fireEvent.click(screen.getByRole("button", { name: "새 화면" }));

		expect(await screen.findByText("NOVA-UPLOAD-PG-001-0")).toBeInTheDocument();
		expect(screen.queryByText("NOVA-MBR-PU-003-E3")).not.toBeInTheDocument();
	});
});

function createScreens(): ScreenSummary[] {
	return [
		{
			id: "preview-default",
			moduleId: "preview",
			route: "Preview Route",
			screenRouteId: "preview-route",
			screenVariantId: "preview-variant",
			screenVariantName: "Preview Default",
			screenVariantOrder: 1,
			sourcePath: "test",
			status: "table",
			title: "Preview Default",
			type: "PG",
			renderTree: createRenderTree("preview"),
		},
		{
			id: "member-base",
			moduleId: "mbr",
			order: 1,
			route: "Member Route",
			screenRouteId: "member-route",
			screenVariantId: "member-variant",
			screenVariantName: "Member Base",
			screenVariantOrder: 1,
			sourcePath: "test",
			status: "table",
			title: "Member Base",
			type: "FP",
			renderTree: createRenderTree("member-base"),
		},
		{
			id: "member-edge",
			moduleId: "mbr",
			order: 2,
			route: "Member Route",
			screenRouteId: "member-route",
			screenVariantId: "member-variant",
			screenVariantName: "Member Base",
			screenVariantOrder: 1,
			sourcePath: "test",
			status: "table",
			title: "Member Base-E1",
			type: "FP",
			renderTree: createRenderTree("member-edge"),
		},
	];
}

function createRenderTree(idPrefix: string) {
	return {
		children: [
			{
				children: [],
				componentVersion: "0.1.0",
				metadata: { id: `${idPrefix}-header`, title: "Header" },
				type: "Screen.Header",
			},
			{
				children: [
					{
						children: [
							{
								children: [],
								componentVersion: "1.0.0",
								layout: "layout.composite.componentActionButton",
								metadata: { id: `${idPrefix}-cta`, title: readCtaTitle(idPrefix) },
								props: { label: "Next" },
								type: "ActionButton",
							},
						],
						componentVersion: "1.0.0",
						layout: "layout.area.listStack",
						metadata: { id: `${idPrefix}-area`, title: readAreaTitle(idPrefix) },
						type: "area.static",
					},
				],
				componentVersion: "0.1.0",
				metadata: { id: `${idPrefix}-contents`, title: "Contents" },
				type: "Screen.Contents",
			},
			{
				children: [],
				componentVersion: "0.1.0",
				metadata: { id: `${idPrefix}-bottom`, title: "Bottom" },
				type: "Screen.Bottom",
			},
		],
		componentVersion: "0.1.0",
		layout: "layout.screen.screenShell",
		metadata: { id: `${idPrefix}-screen`, title: `${idPrefix} screen` },
		type: "Screen",
	} as ScreenSummary["renderTree"];
}

function readAreaTitle(idPrefix: string) {
	if (idPrefix === "generated") return "Generated Area";
	return idPrefix === "preview" ? "Preview Area" : "Member Area";
}

function readCtaTitle(idPrefix: string) {
	return idPrefix === "preview" ? "Preview CTA" : "Member CTA";
}

function stubBrowserApis() {
	vi.stubGlobal("matchMedia", (query: string) => ({
		addEventListener: vi.fn(),
		addListener: vi.fn(),
		dispatchEvent: vi.fn(),
		matches: false,
		media: query,
		onchange: null,
		removeEventListener: vi.fn(),
		removeListener: vi.fn(),
	}));
}

function stubScreenFetch(
	options: {
		inferenceStatus?: RunStatus;
		qualityHasSummary?: boolean;
		serverSources?: unknown[];
	} = {},
) {
	const inferenceStatus = options.inferenceStatus ?? "running";
	const qualityHasSummary = options.qualityHasSummary ?? true;
	const serverSources = options.serverSources ?? [];
	const runRequests: unknown[] = [];
	const screens = createScreens();
	const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
		const url = new URL(String(input), "http://localhost");
		if (url.pathname === "/api/screens") {
			return Response.json({ screens });
		}
		if (url.pathname === "/api/screens/puck-catalog") {
			return Response.json({
				catalogItems: [
					{
						componentVersion: "1.0.0",
						nodeId: "db-area",
						nodeType: "area.static",
						puckType: "catalog:area:db-area",
						title: "DB Area",
					},
				],
			});
		}
		if (url.pathname === "/api/screen-inference/sources" && init?.method !== "POST") {
			return Response.json({ sources: serverSources });
		}
		if (url.pathname === "/api/screen-inference/sources" && init?.method === "POST") {
			return Response.json({
				source: {
					batchId: "20260604",
					importId: "web-upload",
					path: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
					screenId: "NOVA-UPLOAD-PG-001-0",
					type: "file",
				},
			});
		}
		if (url.pathname === "/api/screen-inference/runs") {
			runRequests.push(JSON.parse(String(init?.body ?? "{}")));
			return Response.json(
				{
					runId: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
					status: createRunStatus("queued"),
					statusUrl: "/api/screen-inference/runs/web-NOVA-UPLOAD-PG-001-0-20260604120000",
				},
				{ status: 202 },
			);
		}
		if (url.pathname === "/api/screen-inference/runs/web-NOVA-UPLOAD-PG-001-0-20260604120000") {
			return Response.json({
				status: createRunStatus(inferenceStatus),
			});
		}
		if (
			url.pathname ===
			"/api/screen-inference/runs/web-NOVA-UPLOAD-PG-001-0-20260604120000/artifacts/final-result.json"
		) {
			return Response.json(createRenderTree("generated"));
		}
		if (
			url.pathname ===
			"/api/screen-inference/runs/web-NOVA-UPLOAD-PG-001-0-20260604120000/artifacts/validation-report.json"
		) {
			return Response.json({
				ok: true,
				summary: { errorCount: 0, warningCount: 0 },
			});
		}
		if (
			url.pathname ===
			"/api/screen-inference/runs/web-NOVA-UPLOAD-PG-001-0-20260604120000/artifacts/quality-review.json"
		) {
			return Response.json({
				findings: [],
				...(qualityHasSummary ? { summary: { errorCount: 0, warningCount: 0 } } : {}),
			});
		}
		const treeMatch = url.pathname.match(/^\/api\/screens\/([^/]+)\/tree$/);
		if (treeMatch) {
			const screenId = decodeURIComponent(treeMatch[1] ?? "");
			return Response.json({
				diagnostics: [],
				node: screens.find((screen) => screen.id === screenId)?.renderTree,
			});
		}
		return Response.json({ error: `Unexpected request: ${url.pathname}` }, { status: 404 });
	});
	vi.stubGlobal("fetch", Object.assign(fetchMock, { runRequests }));
}

type RunStatus = "queued" | "running" | "waiting-review";

function createRunStatus(status: RunStatus) {
	return {
		createdAt: "2026-06-04T12:00:00.000Z",
		currentLayer: status === "running" ? "understand" : undefined,
		layers: [
			{
				artifacts: [],
				label: "Understand",
				layer: "understand",
				stages: ["read-source"],
				status: readLayerStatus(status, "understand"),
			},
			{
				artifacts: [],
				label: "Compose",
				layer: "compose",
				stages: ["generate-render-tree"],
				status: readLayerStatus(status, "compose"),
			},
			{
				artifacts: [],
				label: "Revise",
				layer: "revise",
				stages: ["write-artifacts"],
				status: readLayerStatus(status, "revise"),
			},
		],
		runId: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
		schemaVersion: "screen-inference-run-status.v0.1",
		status,
		updatedAt: "2026-06-04T12:00:00.000Z",
	};
}

function readLayerStatus(
	status: RunStatus,
	layer: "compose" | "revise" | "understand",
): "completed" | "pending" | "running" {
	if (status === "waiting-review") return "completed";
	if (status === "running" && layer === "understand") return "running";
	return "pending";
}

function readRunRequests(): unknown[] {
	return ((fetch as typeof fetch & { runRequests?: unknown[] }).runRequests ?? []) as unknown[];
}
