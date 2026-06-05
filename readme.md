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

Docker로 같은 Node 실행 환경에서 띄울 수도 있습니다.

```bash
docker compose up --build
```

자세한 Docker 사용법은 [DOCKER.md](./docs/development/DOCKER.md)를 따른다.

## 구조

- `apps/web` — Next.js 앱
- `scripts/` — generation smoke, render-db migration 같은 개발/검증 도구
- `packages/{schema,adapters,orchestration,agent,validation,pipeline,renderer,component,layout,layout-pattern-store,token}` — 생성, 변환, 검증, 렌더, 디자인 시스템 경계별 패키지
- `data/` — 현재 preview와 adapter가 소비하는 read model/sample data
- `docs/` — 디자인, 개발, 실행 계약 문서

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
- [PACKAGE_MAP.md](./PACKAGE_MAP.md) — 활성 패키지 책임과 관계망
- [AGENTS_HISTORY.md](./AGENTS_HISTORY.md) — 변경 이력
