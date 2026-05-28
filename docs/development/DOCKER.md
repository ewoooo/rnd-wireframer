# Docker

이 문서는 Docker를 처음 쓰는 개발자가 이 저장소를 같은 실행 환경에서 띄우기 위한 최소 기준만 다룬다.

## Docker의 역할

Docker는 패키지 책임이나 생성 파이프라인을 바꾸는 도구가 아니다. 이 프로젝트에서는 다음 역할만 맡긴다.

- Node.js와 npm 실행 환경을 고정한다.
- Next.js workbench를 같은 포트와 같은 명령으로 실행한다.
- 로컬 머신에 설치된 `node_modules` 상태와 무관하게 lint/test/smoke 명령을 재현한다.
- 나중에 FastAPI, DB, queue 같은 sidecar가 생길 때 `docker-compose.yml`에 서비스로 붙일 수 있는 기반을 만든다.

## 처음 실행

Docker Desktop을 설치한 뒤 루트 디렉터리에서 실행한다.

```bash
docker compose up --build
```

브라우저에서 `http://localhost:3000`을 연다.

이미 이미지를 만든 뒤에는 보통 아래 명령만 써도 된다.

```bash
docker compose up
```

## 종료

```bash
docker compose down
```

의존성을 새로 설치하고 싶으면 named volume까지 지운다.

```bash
docker compose down -v
docker compose up --build
```

## 검증 명령 실행

컨테이너 안에서 프로젝트 명령을 실행할 수 있다.

```bash
docker compose run --rm web npm run lint
docker compose run --rm web npm test
docker compose run --rm web npm run smoke:pipeline -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md
```

## 현재 범위

현재 Docker 구성은 `apps/web` 개발 서버와 Node 기반 검증 명령을 대상으로 한다. 백엔드 API, Claude Agent SDK 실행 환경, DB/queue는 정식 실행 단위가 생길 때 별도 service로 추가한다.
