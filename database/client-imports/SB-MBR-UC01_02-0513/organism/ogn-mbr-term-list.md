---
오가니즘 ID: ogn-mbr-term-list
오가니즘 명: 약관 목록 조회
오가니즘 설명: 회원 가입에 필요한 필수·선택 약관 목록을 서버에서 조회하여 표시하는 오가니즘
관련 정책서: POL-MBR-TERM-001-01, POL-MBR-TERM-001-02, POL-MBR-TERM-001-10
연관 설계서: NOVA-MBR-FP-001-0, NOVA-MBR-FP-009-0
사용된 화면: NOVA-MBR-FP-001-0, NOVA-MBR-FP-009-0
관련 정책 그룹: PG-MBR-TERM-001
관련 기능: FN-MBR-COM-003
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-term-list | 약관 목록 조회 | 회원 가입에 필요한 필수·선택 약관 목록을 조회하여 표시 | vertical | 항상 | [약관 목록 조회] 업무별 최신 약관 목록 표시<br>[상태:loading] skeleton 표시<br>[상태:error] 약관 조회 실패: 재시도 안내<br>[고지:필수\|POL-MBR-TERM-001-01] 회원 가입 필수 약관<br>[고지:사용성\|POL-MBR-TERM-001-02] 회원 가입 선택 약관<br>[고지:사용성\|POL-MBR-TERM-001-10] 약관 버전 적용 기준 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 화면 진입 정상 | 약관 목록 list-cell 표시 | apiCall |
| loading | API 호출 중 | skeleton 표시 | apiCall |
| error | 약관 조회 API 실패 | section-message(negative) 노출 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | list-cell-term-required | 필수 약관 항목 | list-cell | - | onChange | setState | checkedTerms | [정책:POL-MBR-TERM-001-01] 회원 가입 필수 약관 |
| 2 | list-cell-term-optional | 선택 약관 항목 | list-cell | - | onChange | setState | checkedTerms | [정책:POL-MBR-TERM-001-02] 회원 가입 선택 약관 |
| 3 | accordion-term-detail | 약관 전문 펼치기 | accordion | - | onClick | setState | expandedTermId | - |
| 4 | section-message-term-error | 약관 조회 오류 안내 | section-message | negative | - | - | - | 오류 발생 시 노출 |
