# RND Screen Generator

토큰/컴포넌트/레이아웃/렌더러/에이전트 파이프라인 기반 화면 생성 모노레포.

## 실행

패키지 매니저는 `pnpm`을 사용합니다.

```bash
pnpm install
pnpm dev
```

## 구조

- `apps/web` — Next.js 앱
- `packages/{token,component,layout,renderer,agent,schema,validation,adapters,inference}` — 화면 생성/렌더링 패키지
- `database/` — source imports와 승인된 table dump
- `docs/` — 개발 문서
- `e2e/` — Playwright 시나리오

구조가 커질 때의 배치 기준은 [PROJECT_STRUCTURE.md](./docs/development/PROJECT_STRUCTURE.md)를 따른다.

## 테스트

```bash
pnpm test         # vitest
pnpm test:e2e     # playwright
pnpm lint         # biome + react hooks 정책
```

## 문서

- [AGENTS.md](./AGENTS.md) — 에이전트 운영 규칙
- [PACKAGE_MAP.md](./PACKAGE_MAP.md) — 패키지 책임과 관계망
- [PROJECT_STRUCTURE.md](./docs/development/PROJECT_STRUCTURE.md) — 저장소/패키지 구조 규칙
- [AGENTS_HISTORY.md](./AGENTS_HISTORY.md) — 변경 이력
