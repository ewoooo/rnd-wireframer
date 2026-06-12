# Session Policy

`@cx/agent`의 세션 정책 기준선:

- 기본 생성 요청은 새 세션으로 실행한다.
- 기존 세션 재개는 명시적 재시도, 검수 반영, 이어쓰기 흐름에서만 허용한다.
- `resume` 요청에는 `sessionId`가 있어야 한다.
- 세션 정책 해석은 agent runtime이 소유하고, 어떤 시점에 재개를 요청할지는 상위 workflow가 결정한다.

Screen inference runtime과의 연결 기준은 [SCREEN_INFERENCE_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/SCREEN_INFERENCE_ARCHITECTURE.md)를 따른다.
