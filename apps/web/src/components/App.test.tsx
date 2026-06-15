import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "@/components/App";
import type { ScreenSummary } from "@/lib/screen-sources";

// AppShell이 탭 전환 시 URL을 갱신하므로 라우터를 스텁한다(jsdom엔 App Router 컨텍스트 없음).
vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

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

		await waitForWorkbenchReady();
		expect(screen.getByText("Preview Default")).toBeInTheDocument();

		fireEvent.click(getRailButton("Components"));

		expect(screen.getAllByText("Components").length).toBeGreaterThan(0);
		// cmp 탭은 스크린 인스턴스가 아니라 로컬 @cx/external 카탈로그(kiki)를 보여준다.
		expect(screen.getAllByText("AppBar").length).toBeGreaterThan(0);

		fireEvent.click(screen.getAllByText("AppBar")[0].closest("button") as HTMLButtonElement);

		expect(screen.getAllByText("AppBar").length).toBeGreaterThan(0);

		fireEvent.click(getRailButton("Areas"));

		expect(screen.getAllByText("Areas").length).toBeGreaterThan(0);
		expect(screen.getByText("preview-area")).toBeInTheDocument();
		expect(screen.getByText("member-base-area")).toBeInTheDocument();

		fireEvent.click(getRailButton("Run"));

		expect(getRailButton("Run")).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByText("Drop Here")).toBeInTheDocument();
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
			screen.queryByText("data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md"),
		).not.toBeInTheDocument();

		fireEvent.click(getCommandButton("Run"));
		expect((await screen.findAllByText("running")).length).toBeGreaterThan(0);
		expect(readRunRequests()).toContainEqual(
			expect.objectContaining({
				screenCode: "NOVA-UPLOAD-PG-001-0",
				source: {
					path: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
				},
				useAI: true,
			}),
		);
	});

	it("selects screens from node navigation and switches variant chips", async () => {
		stubBrowserApis();
		stubScreenFetch({
			serverRuns: [
				{
					jobId: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
					screenId: "NOVA-UPLOAD-PG-001-0",
					sourcePath: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
					status: "running",
				},
			],
		});
		render(<App />);

		await waitForWorkbenchReady();

		fireEvent.click(getRailButton("Areas"));
		fireEvent.click(screen.getByText("member-base-area").closest("button") as HTMLButtonElement);
		fireEvent.click(getRailButton("Screens"));

		expect(screen.getByTitle("Member Base")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "E1" }));

		expect(screen.getByTitle("Member Base-E1")).toBeInTheDocument();
	});

	it("renders new screen inference review artifacts without requiring quality summary", async () => {
		stubBrowserApis();
		stubScreenFetch({ inferenceStatus: "waiting-review", qualityHasSummary: false });
		render(<App />);

		await waitForWorkbenchReady();
		fireEvent.click(getRailButton("Run"));

		const fileInput = document.querySelector<HTMLInputElement>("input[type='file']");
		expect(fileInput).not.toBeNull();
		fireEvent.change(fileInput as HTMLInputElement, {
			target: {
				files: [new File(["---\n화면 ID: NOVA-UPLOAD-PG-001-0\n---"], "NOVA-UPLOAD-PG-001-0.md")],
			},
		});

		expect(await screen.findByText("NOVA-UPLOAD-PG-001-0")).toBeInTheDocument();
		fireEvent.click(getCommandButton("Run"));

		expect((await screen.findAllByText("waiting-review")).length).toBeGreaterThan(0);
		expect(await screen.findAllByText("0 errors · 0 warnings")).toHaveLength(2);
		expect(readRunRequests()).toContainEqual(
			expect.objectContaining({
				screenCode: "NOVA-UPLOAD-PG-001-0",
				source: {
					path: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
				},
				useAI: true,
			}),
		);
	});

	it("restores uploaded new screen sources and polling after refresh", async () => {
		window.localStorage.setItem(
			"cx.new-screen.workbench.v0.1",
			JSON.stringify({
				runs: [
					{
						id: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
						runId: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
						screenId: "NOVA-UPLOAD-PG-001-0",
						sourcePath: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
						status: "running",
					},
				],
				selectedRunId: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
			}),
		);
		stubBrowserApis();
		stubScreenFetch({
			serverRuns: [
				{
					jobId: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
					screenId: "NOVA-UPLOAD-PG-001-0",
					sourcePath: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
					status: "running",
				},
			],
		});
		render(<App />);

		await waitForWorkbenchReady();
		fireEvent.click(getRailButton("Run"));

		expect(screen.getByText("NOVA-UPLOAD-PG-001-0")).toBeInTheDocument();
		expect(screen.getByText("web-NOVA-UPLOAD-PG-001-0-20260604120000")).toBeInTheDocument();
		expect(
			screen.queryByText("data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md"),
		).not.toBeInTheDocument();
		expect((await screen.findAllByText("running")).length).toBeGreaterThan(0);
	});

	it("loads uploaded new screen sources from the server when browser state is empty", async () => {
		stubBrowserApis();
		stubScreenFetch({
			serverRuns: [
				{
					jobId: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
					screenId: "NOVA-UPLOAD-PG-001-0",
					sourcePath: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
					status: "running",
				},
			],
		});
		render(<App />);

		await waitForWorkbenchReady();
		fireEvent.click(getRailButton("Run"));

		expect(await screen.findByText("NOVA-UPLOAD-PG-001-0")).toBeInTheDocument();
		expect(screen.getByText("web-NOVA-UPLOAD-PG-001-0-20260604120000")).toBeInTheDocument();
		expect((await screen.findAllByText("running")).length).toBeGreaterThan(0);
	});

	it("drops invalid run rows restored from browser state", async () => {
		window.localStorage.setItem(
			"cx.new-screen.workbench.v0.1",
			JSON.stringify({
				runs: [
					{
						id: 1,
						runId: "bad",
						screenId: "NOVA-MBR-PU-003-E3",
					},
				],
				selectedRunId: "bad",
			}),
		);
		stubBrowserApis();
		stubScreenFetch({
			serverRuns: [
				{
					jobId: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
					screenId: "NOVA-UPLOAD-PG-001-0",
					sourcePath: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
					status: "running",
				},
			],
		});
		render(<App />);

		await waitForWorkbenchReady();
		fireEvent.click(getRailButton("Run"));

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

async function waitForWorkbenchReady() {
	expect(await screen.findByText("Preview Default")).toBeInTheDocument();
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
								props: { button: "1", primaryText: "Next", type: "Default" },
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

function createRenderTreeArtifact(idPrefix: string) {
	return {
		children: [createRenderTree(idPrefix)],
		metadata: { id: `${idPrefix}-artifact` },
		minRendererVersion: "0.1.0",
		theme: { mode: "light" },
		version: "render-tree.v0.1",
	};
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

type RunStatus = "queued" | "running" | "waiting-review";

function stubScreenFetch(
	options: {
		inferenceStatus?: RunStatus;
		qualityHasSummary?: boolean;
		serverRuns?: unknown[];
	} = {},
) {
	const inferenceStatus = options.inferenceStatus ?? "running";
	const qualityHasSummary = options.qualityHasSummary ?? true;
	const serverRuns = options.serverRuns ?? [];
	const runRequests: unknown[] = [];
	const screens = createScreens();
	const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
		const url = new URL(String(input), "http://localhost");
		if (url.pathname === "/api/screens/trees") {
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
		if (url.pathname === "/api/inference/runs") {
			return Response.json({ runs: serverRuns });
		}
		if (url.pathname === "/api/inference/sources" && init?.method === "POST") {
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
		if (url.pathname === "/api/inference") {
			runRequests.push(JSON.parse(String(init?.body ?? "{}")));
			return Response.json(
				{
					jobId: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
				},
				{ status: 202 },
			);
		}
		if (url.pathname === "/api/inference/web-NOVA-UPLOAD-PG-001-0-20260604120000") {
			return Response.json({
				createdAt: "2026-06-04T12:00:00.000Z",
				currentStepId: inferenceStatus === "running" ? "04-render-tree" : undefined,
				input: {
					source: {
						path: "data/client-imports/web-upload/20260604/NOVA-UPLOAD-PG-001-0.md",
					},
				},
				jobId: "web-NOVA-UPLOAD-PG-001-0-20260604120000",
				pipelineId: "screen-generation",
				pipelineVersion: "v1",
				status:
					inferenceStatus === "queued"
						? "queued"
						: inferenceStatus === "running"
							? "running"
							: "succeeded",
				updatedAt: "2026-06-04T12:00:01.000Z",
			});
		}
		if (url.pathname === "/api/inference/web-NOVA-UPLOAD-PG-001-0-20260604120000/steps") {
			return Response.json({
				steps: [
					{ stepId: "01-source-spec", status: "succeeded" },
					{ stepId: "02-intent-composition", status: "succeeded" },
					{
						stepId: "04-render-tree",
						status: inferenceStatus === "running" ? "running" : "succeeded",
					},
					{ stepId: "05-validation", status: "succeeded" },
					{
						stepId: "08-quality",
						status: inferenceStatus === "waiting-review" ? "succeeded" : "pending",
					},
				],
			});
		}
		if (
			url.pathname ===
			"/api/inference/web-NOVA-UPLOAD-PG-001-0-20260604120000/artifacts/context/apply-result.json"
		) {
			return Response.json({ error: "missing" }, { status: 404 });
		}
		if (
			url.pathname ===
			"/api/inference/web-NOVA-UPLOAD-PG-001-0-20260604120000/artifacts/context/render-tree.json"
		) {
			return Response.json(createRenderTreeArtifact("generated"));
		}
		if (
			url.pathname ===
			"/api/inference/web-NOVA-UPLOAD-PG-001-0-20260604120000/artifacts/context/validation-report.json"
		) {
			return Response.json({
				issues: [],
				ok: true,
				schemaVersion: "validation-report.v0.1",
				summary: { errorCount: 0, warningCount: 0 },
				target: "render-tree",
			});
		}
		if (
			url.pathname ===
			"/api/inference/web-NOVA-UPLOAD-PG-001-0-20260604120000/artifacts/steps/08-quality/output.json"
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

function readRunRequests(): unknown[] {
	return ((fetch as typeof fetch & { runRequests?: unknown[] }).runRequests ?? []) as unknown[];
}

function getRailButton(name: string): HTMLButtonElement {
	const button = screen
		.getAllByRole("button", { name })
		.find((candidate) => candidate.hasAttribute("aria-pressed"));
	expect(button).toBeDefined();
	return button as HTMLButtonElement;
}

function getCommandButton(name: string): HTMLButtonElement {
	const button = screen
		.getAllByRole("button", { name })
		.find((candidate) => !candidate.hasAttribute("aria-pressed"));
	expect(button).toBeDefined();
	return button as HTMLButtonElement;
}
