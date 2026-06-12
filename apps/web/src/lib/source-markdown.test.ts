import { describe, expect, it } from "vitest";
import { parseSourceMarkdown } from "./source-markdown";

describe("parseSourceMarkdown", () => {
	it("맨 위 --- … --- 를 frontmatter로 파싱한다", () => {
		const blocks = parseSourceMarkdown("---\n화면 ID: NOVA-1\n버전: 1.00\n---\n\n## 본문");
		expect(blocks[0]).toEqual({
			kind: "frontmatter",
			rows: [
				{ key: "화면 ID", value: "NOVA-1" },
				{ key: "버전", value: "1.00" },
			],
		});
		expect(blocks[1]).toEqual({ kind: "heading", level: 2, text: "본문" });
	});

	it("GFM 테이블을 헤더+행으로 파싱하고 <br>는 줄바꿈으로 바꾼다", () => {
		const md = ["| 명 | props |", "| --- | --- |", "| AppBar | title: 회원<br>showBack: true |"].join(
			"\n",
		);
		const [table] = parseSourceMarkdown(md);
		expect(table).toEqual({
			kind: "table",
			headers: ["명", "props"],
			rows: [["AppBar", "title: 회원\nshowBack: true"]],
		});
	});

	it("frontmatter 밖의 단독 --- 는 무시하고 나머지는 paragraph로 둔다", () => {
		const blocks = parseSourceMarkdown("---\na: 1\n---\n\n설명 문장\n\n---\n\n다음 문장");
		expect(blocks.filter((b) => b.kind === "paragraph")).toEqual([
			{ kind: "paragraph", text: "설명 문장" },
			{ kind: "paragraph", text: "다음 문장" },
		]);
	});

	it("구분선 행 다음에 데이터 행이 없어도 빈 테이블로 인식한다", () => {
		const [table] = parseSourceMarkdown("| a | b |\n| --- | --- |");
		expect(table).toEqual({ kind: "table", headers: ["a", "b"], rows: [] });
	});
});
