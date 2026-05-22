---
오가니즘 ID: ogn-mbr-term-agree
오가니즘 명: 약관 동의
오가니즘 설명: 전체 동의 체크박스 및 필수·선택 약관 개별 동의 처리 오가니즘
관련 정책서: POL-MBR-TERM-001-06, POL-MBR-TERM-001-07, POL-MBR-TERM-003-01
연관 설계서: NOVA-MBR-FP-001-0, NOVA-MBR-FP-009-0
사용된 화면: NOVA-MBR-FP-001-0, NOVA-MBR-FP-009-0
관련 정책 그룹: PG-MBR-TERM-001, PG-MBR-TERM-003
관련 기능: FN-MBR-COM-003
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-term-agree | 약관 동의 | 전체 동의 및 개별 약관 동의 처리 | vertical | 항상 | [약관 동의 처리] 전체 동의 및 개별 약관 동의 처리<br>[액션:tap 전체 동의] setState allTermsAgreed<br>[액션:tap 개별 약관] setState checkedTermId<br>[액션:tap 다음] navigate NOVA-MBR-FP-002-0<br>[상태:error] 필수 약관 미동의: 다음 단계 진행 불가<br>[고지:필수\|POL-MBR-TERM-001-06] 필수 약관 미동의 처리 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 화면 진입 | 전체 동의 체크박스 및 개별 동의 체크박스 표시 | - |
| error | 필수 약관 미동의 상태에서 다음 버튼 탭 | section-message(negative) 노출, 미동의 항목 표시 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | checkbox-all-agree | 전체 동의 | checkbox | medium | onChange | setState | allTermsAgreed | - |
| 2 | checkbox-term-required | 필수 약관 동의 | checkbox | medium | onChange | setState | checkedTermId | [정책:POL-MBR-TERM-001-06] 필수 약관 미동의 처리 |
| 3 | checkbox-term-optional | 선택 약관 동의 | checkbox | small | onChange | setState | checkedTermId | [정책:POL-MBR-TERM-001-07] 선택 약관 미동의 처리 |
| 4 | section-message-required-error | 필수 약관 미동의 오류 안내 | section-message | negative | - | - | - | 필수 약관 미동의 시 노출 |
| 5 | action-area-next | 다음 버튼 영역 | action-area | strong | onClick | navigate | NOVA-MBR-FP-002-0 | - |
