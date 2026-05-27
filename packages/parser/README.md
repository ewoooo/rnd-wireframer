# @cx/parser

`@cx/parser`는 Markdown 같은 원천 입력 문자열을 생성 흐름에서 사용할 SourceSpec JSON으로 정규화하는 순수 parser 패키지다.

현재 MVP 범위는 `.md -> SourceSpec`만 빠르게 지원한다. `SourceSpec` 계약의 정본은 `@cx/schema`가 소유한다. 파일 읽기, Claude 호출, RenderTree 생성, 저장 side effect는 이 패키지의 책임이 아니다.

## 책임

- Markdown 문자열을 SourceSpec JSON으로 변환한다.
- 원본 파일 path, source id, sourceRef에 필요한 최소 metadata를 보존한다.
- heading, key-value line, component name hint를 가볍게 추출한다.
- PRDD 예약 영역 번호를 SourceSpec slot hint로 보존한다. `0`은 `screen.header`, `999`는 `screen.bottom` 대상으로 해석한다.
- 컴포넌트 catalog 목록은 소유하지 않고, Markdown에 명시된 이름 hint만 보존한다.
- parser issue를 result envelope로 반환한다.

## 두지 않는 책임

- 파일 읽기/쓰기
- Claude Agent SDK 실행
- DraftCandidate 생성
- RenderTree 생성 또는 React render
- catalog 값 검증
- validation next action 결정

## Public Subpaths

| Subpath | 책임 |
|---|---|
| `@cx/parser` | 패키지 루트 public API |
| `@cx/parser/contract` | parser boundary contract |
| `@cx/parser/markdown` | Markdown parser public API |
| `@cx/parser/types` | parser input/result public types와 SourceSpec compatibility re-export |

`src/internal/*`가 추가되더라도 외부에서는 직접 import하지 않는다.

## MVP Usage

```ts
import { parseMarkdownSourceBundle } from "@cx/parser/markdown";

const result = parseMarkdownSourceBundle({
	importId: "PRDD-2026-05-sample",
	files: [
		{
			id: "source-screen-home",
			kind: "screen",
			path: "docs/home.md",
			content: "# 홈\nroute: /home",
		},
	],
});
```

이 함수는 파일 시스템을 읽지 않는다. `@cx/pipeline`이나 CLI가 이미 읽은 문자열을 넘겨야 한다.
