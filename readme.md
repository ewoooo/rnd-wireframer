# RND Screen Generator

토큰/컴포넌트/레이아웃/렌더러/에이전트 파이프라인 기반 화면 생성 모노레포.

## 실행

bun 또는 npm 둘 다 지원합니다. 두 lockfile(`bun.lock`, `package-lock.json`)은 의도적으로 함께 유지되며, 의존성 변경 시 양쪽 모두 업데이트해야 합니다.

```bash
# bun
bun install
bun run dev

# 또는 npm
npm install
npm run dev
```

## 구조

- `apps/web` — Next.js 앱
- `packages/{token,component,layout,engine,agent,types}` — 파이프라인 단계별 패키지
- `database/` — source imports, AI import candidates, approved table dumps
- `docs/` — 디자인, 개발, 데이터 mockup 문서

구조가 커질 때의 배치 기준은 [PROJECT_STRUCTURE.md](./docs/development/PROJECT_STRUCTURE.md)를 따른다.

## 테스트

```bash
bun run test         # vitest
bun run lint         # biome + react hooks 정책
```

## 문서

- [AGENTS.md](./AGENTS.md) — 에이전트 운영 규칙
- [MASTER_PLAN.md](./MASTER_PLAN.md) — 마스터 플랜
- [PROJECT_STRUCTURE.md](./docs/development/PROJECT_STRUCTURE.md) — 저장소/패키지 구조 규칙
- [AGENTS_HISTORY.md](./AGENTS_HISTORY.md) — 변경 이력 (월별 분할: `docs/agents-history/`)
