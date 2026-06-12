import { RenderNodeView } from "@cx/renderer";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildComponentProps } from "../adapters/build-component-props";

describe("buildComponentProps — node 계약 prop 슬롯 해석", () => {
	it("renderNode 콜백이 있으면 render-node 값을 콜백 결과로 바꾼다", () => {
		const out = buildComponentProps(
			"kiki.Button",
			{
				children: "확인",
				rightIcon: {
					type: "kiki.Icon",
					componentVersion: "0.1.0",
					metadata: { id: "icon-1", title: "아이콘" },
				},
			},
			{ renderNode: (slot) => `rendered:${slot.metadata.id}` },
		);

		expect(out.rightIcon).toBe("rendered:icon-1");
		expect(out.children).toBe("확인");
	});

	it("renderNode 콜백이 없으면 render-node 값을 raw 객체로 React에 흘리지 않는다", () => {
		const out = buildComponentProps("kiki.Button", {
			children: "확인",
			rightIcon: {
				type: "kiki.Icon",
				componentVersion: "0.1.0",
				metadata: { id: "icon-2", title: "아이콘" },
			},
		});

		expect(out).not.toHaveProperty("rightIcon");
		expect(out.children).toBe("확인");
	});
});

describe("@cx/renderer node-slot props — 계약이 node인 prop은 렌더를 보장한다", () => {
	it("kiki.TextField rightElement에 적힌 render-node를 우측 슬롯으로 렌더한다", () => {
		render(
			<RenderNodeView
				node={{
					type: "kiki.TextField",
					componentVersion: "0.1.0",
					metadata: { id: "guardian-phone", title: "법정대리인 휴대폰번호" },
					props: {
						label: "법정대리인 휴대폰번호",
						rightElement: {
							type: "kiki.Button",
							componentVersion: "0.1.0",
							metadata: { id: "guardian-consent-request", title: "법정대리인 동의 요청" },
							props: { variant: "secondary", size: "medium", children: "동의 요청" },
						},
					},
				}}
			/>,
		);

		expect(screen.getByText("동의 요청")).toBeInTheDocument();
		expect(screen.getByText("법정대리인 휴대폰번호")).toBeInTheDocument();
	});

	it("슬롯 노드 안의 binding도 해석기 경로를 그대로 타고 해석된다", () => {
		render(
			<RenderNodeView
				data={{ guardian: { consentRequestLabel: "동의요청 라벨" } }}
				node={{
					type: "kiki.TextField",
					componentVersion: "0.1.0",
					metadata: { id: "guardian-phone-bind", title: "법정대리인 휴대폰번호" },
					props: {
						label: "법정대리인 휴대폰번호",
						rightElement: {
							type: "kiki.Button",
							componentVersion: "0.1.0",
							metadata: { id: "guardian-consent-request-bind", title: "동의 요청" },
							props: {
								children: { bind: "guardian.consentRequestLabel", default: "동의 요청" },
							},
						},
					},
				}}
			/>,
		);

		expect(screen.getByText("동의요청 라벨")).toBeInTheDocument();
	});

	it("슬롯 노드의 display.when이 거짓이면 슬롯만 비우고 호스트는 렌더한다", () => {
		render(
			<RenderNodeView
				data={{ memberVerify: { isMinor: false } }}
				node={{
					type: "kiki.TextField",
					componentVersion: "0.1.0",
					metadata: { id: "guardian-phone-when", title: "법정대리인 휴대폰번호" },
					props: {
						label: "법정대리인 휴대폰번호",
						rightElement: {
							type: "kiki.Button",
							componentVersion: "0.1.0",
							display: { when: { bind: "memberVerify.isMinor", default: false } },
							metadata: { id: "guardian-consent-request-when", title: "동의 요청" },
							props: { children: "동의 요청" },
						},
					},
				}}
			/>,
		);

		expect(screen.queryByText("동의 요청")).not.toBeInTheDocument();
		expect(screen.getByText("법정대리인 휴대폰번호")).toBeInTheDocument();
	});
});
