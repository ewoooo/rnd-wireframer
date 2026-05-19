# RND Screen Generator 마스터 플랜

## 1. 문서 책임

이 문서는 제품 목표, 사용자 흐름, MVP 범위, 마일스톤만 정의한다.

상세 설계는 아래 문서를 참조한다.

| 주제 | 참조 문서 |
|---|---|
| 시스템 구조와 API 경계 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| SB/OGN JSON과 관계형 DB 설계 | [DATA_MAP.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/docs/development/DATA_MAP.md) |
| 작업 역할과 운영 방식 | [AGENTS.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/AGENTS.md) |
| 변경 이력 | [AGENTS_HISTORY.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/AGENTS_HISTORY.md) |

## 2. 제품 비전

RND Screen Generator는 JSON화된 SB와 OGN을 기반으로 모바일 앱 와이어프레임을 자동 생성하는 AI 화면 설계 서비스다.

초기 목표는 완성형 UI 빌더가 아니다. 내부 설계 문서를 검토 가능한 모바일 화면 초안으로 빠르게 변환하고, Puck 기반 OGN 섹션 편집으로 필요한 수준의 후편집을 지원하는 것이 목표다.

## 3. 핵심 사용자 흐름

1. 사용자가 JSON화된 SB/OGN을 가져온다.
2. 시스템이 JSON을 검증하고 저장한다.
3. 사용자가 SB 화면을 선택한다.
4. 시스템이 연결된 OGN을 조합한다.
5. Claude가 모바일 와이어프레임 JSON을 생성한다.
6. Next.js가 모바일 미리보기를 렌더링한다.
7. 사용자가 Puck 기반 라이브 에디터에서 생성된 OGN 섹션의 문구, 간격, 표시 옵션을 수정한다.
8. 사용자가 피드백으로 재생성한다.
9. 생성 결과와 편집 결과는 버전으로 저장된다.

## 4. MVP 범위

### 포함

- SB/OGN JSON 가져오기
- SB 목록과 상세 조회
- SB 기준 OGN 조합
- 모바일 와이어프레임 생성
- 와이어프레임 미리보기
- Puck 기반 OGN 섹션 편집
- 피드백 기반 Regenerate
- 생성 버전 저장

### 제외

- Figma 완전 연동
- 픽셀 퍼펙트 디자인 시스템 매핑
- 실시간 공동 편집
- 자유 배치형 완성형 비주얼 에디터
- 정책 준수 자동 점수화

## 5. 마일스톤

| 단계 | 목표 |
|---|---|
| Phase 0 | 문서, 데이터 모델, API 경계 확정 |
| Phase 1 | SB/OGN JSON 검증과 DB 적재 |
| Phase 2 | 화면 지식 베이스와 OGN 연결 조회 |
| Phase 3 | 와이어프레임 JSON 생성 |
| Phase 4 | Codex 검수와 미리보기/재생성 버전 관리 |
| Phase 5 | Puck 기반 OGN 섹션 편집과 품질 평가 |
| Phase 6 | Figma 확장 검토 |

## 6. 성공 기준

- 사용자가 SB 화면을 선택할 수 있다.
- 시스템이 관련 OGN을 찾는다.
- Claude가 모바일 와이어프레임 JSON을 생성한다.
- Codex가 생성 결과를 검수한다.
- 사용자가 생성된 OGN 섹션을 Puck으로 수정할 수 있다.
- 사용자가 결과를 재생성할 수 있다.
- 모든 생성 결과를 버전으로 다시 볼 수 있다.

## 7. 제품 리스크

| 리스크 | 대응 |
|---|---|
| 입력 JSON 품질이 일정하지 않음 | 스키마 버전과 검증 경고를 관리한다. |
| OGN 참조 누락 | 누락 참조 리포트를 제공한다. |
| AI 결과 불안정 | 구조화된 JSON 출력과 검증을 강제한다. |
| Puck 편집으로 화면 일관성이 깨짐 | 간격, 정렬, 표시 옵션은 디자인 토큰 기반 prop으로 제한한다. |
| MVP 범위 과확장 | 저충실도 모바일 와이어프레임부터 시작한다. |
