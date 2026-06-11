# 인터랙션 패턴

> 출처: `AGENTS.md`의 디자인 패턴 문서 기준에 따라 책임 단위로 분리. 상태, CTA, 폼, 오버레이 조합 규칙을 소유한다.

## 9. 인터랙션/상태 패턴

### Accordion 상태 표현
- **닫힘 (Collapsed):** h=21 (제목만 표시)
- **열림 (Expanded):** h=95 (Q+A 전체 표시)
- 첫 항목 = 열린 상태로 시작하는 패턴

### ListSelected vs ListText
| 컴포넌트 | 역할 | 높이 |
|---|---|---|
| `ListText` | 읽기 전용 레이블+값 행 | 22px |
| `ListSelected` | 선택 가능한 행 (라디오/체크 시각) | 34~52px (크기 변형) |

### ActionButton 높이 변형
| 높이 | 컨텍스트 |
|---|---|
| 102px | 표준 CTA (상세/폼 화면) |
| 146px | 확장형 (완료 화면, AI 버튼 포함) |
| 149px | 바텀시트 내부 |

### 헤더 고정 패턴
- 상품 상세 화면: StatusBar+AppBar(107px) 프레임이 콘텐츠 위에 별도 오버레이로 존재 → 스크롤 시 헤더 고정 효과
- 메인/리스트 화면: 헤더가 콘텐츠 프레임 상단에 포함 (y=0에서 시작)

---

## 10. CTA / 폼 / 오버레이 조합 규칙

### CTA 위치와 버튼 조합

| 화면 상황 | CTA 위치 | 원칙 |
|---|---|---|
| 단일 페이지 진행 | `Bottom`의 `SinglePrimaryAction` | 항상 접근 가능한 하단 `ActionButton`에 둔다 |
| 카드에 종속된 부가 액션 | 카드/area 내부 CTA slot | 해당 카드 의미 안에만 머문다 |
| 섹션 더보기 | `TitleSection` 우측 링크 또는 낮은 강도 action | primary CTA로 올리지 않는다 |
| 오버레이 확인 | BottomSheet/Popup 자체 action slot | 오버레이 문맥 밖으로 빼지 않는다 |

- Primary 버튼은 구매, 신청, 결제, 다음 단계 진행처럼 주 전환 액션에 사용한다.
- Secondary 버튼은 취소, 이전, 닫기처럼 보조 또는 철회 액션에 사용한다.
- 2버튼 조합은 `Secondary + Primary` 순서를 기본으로 한다. 동등한 선택이 아니면 Primary가 더 넓은 비중을 갖는다.
- Primary CTA를 스크롤 콘텐츠 중간에 직접 배치하지 않는다.
- `Bottom`에 Primary CTA가 있는 화면에서는 Content 내부 액션이 같은 너비, 높이, radius, pill shape, 고대비 배경, 하단 근접 위치로 보이면 `variant="secondary"`라도 CTA hierarchy 실패로 본다. 화면 안의 primary-shaped CTA는 Bottom에 1개만 허용한다.
- 인증번호 확인, 중복확인, 재요청처럼 특정 field/form group에 종속된 액션은 field 우측 slot, compact button, text/link button, 또는 card/area 내부 낮은 위계 slot으로 표현한다. Content 내부 full-width `ActionButton`으로 올리지 않는다.
- Content 내부 보조 액션이 필요하면 Bottom CTA와 최소 한 단계 낮은 시각 강도여야 한다: 짧은/내용 맞춤 너비, 낮은 높이, 약한 surface, field group 인접 배치, 충분한 rail 분리. Bottom CTA와 같은 361/393px rail의 큰 버튼이면 실패다.

### 폼 조합

- 관련 있는 `TextField`는 그룹 제목과 함께 묶는다. 그룹 제목 없이 필드만 나열하지 않는다.
- `TextField` 보조 버튼은 필드 외부 병렬 배치보다 입력 컴포넌트의 우측 slot으로 처리한다.
- 에러 메시지는 해당 `TextField` 바로 아래 help text slot에 붙인다. 별도 callout으로 필드 밖에 띄우지 않는다.
- Verification form은 `TextField(actionButton)` + helper/error/state notice + 낮은 위계 confirm action을 기본으로 한다. `인증 확인` 같은 confirm action이 필요해도 Bottom의 최종 진행 CTA와 같은 full-width pill로 렌더하지 않는다.
- 약관 동의는 `전체 동의 -> Divider -> 필수/선택 항목` 순서를 기본으로 한다.
- 결제 화면의 약관은 Checkbox와 내용을 확인할 수 있는 accordion/policy detail이 연결되어야 한다.

### 오버레이 선택

| 상황 | 선택 |
|---|---|
| 옵션 목록에서 하나를 선택 | BottomSheet |
| 3개 이상 목록 또는 스크롤 가능 콘텐츠 | BottomSheet |
| 여러 조건 필터 설정 | BottomSheet + 필요한 경우 UnderlineTab |
| 2줄 이내 단순 확인/취소 | Popup |
| 결제 실패·에러 알림 | Popup |

- Popup 내부에 스크롤이 생기면 BottomSheet로 전환한다.
- BottomSheet 안에 또 다른 BottomSheet를 중첩하지 않는다.
- Popup 버튼은 일반 `Button` 직접 배치가 아니라 `PopupActionButton`을 사용한다.

### 완료 화면 copy

- 완료 화면의 제목은 사용자가 처리 결과를 즉시 이해할 수 있는 친근한 구어체를 우선한다. 예: `개통이 완료되었어요`, `결제가 완료되었어요`.
- 완료 화면 하단 2버튼은 좌측 Secondary가 관련 추가 탐색, 우측 Primary가 확인/홈 복귀 역할을 갖는다.

---
