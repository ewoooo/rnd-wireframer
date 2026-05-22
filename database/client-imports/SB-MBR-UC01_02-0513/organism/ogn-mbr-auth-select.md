---
오가니즘 ID: ogn-mbr-auth-select
오가니즘 명: 인증수단 선택
오가니즘 설명: 업무별 허용 인증수단 목록을 표시하고 고객이 인증수단을 선택하는 오가니즘
관련 정책서: POL-MBR-AUTH-002-01, POL-MBR-AUTH-002-05, POL-MBR-AUTH-002-09
연관 설계서: NOVA-MBR-FP-003-0, NOVA-MBR-FP-008-0
사용된 화면: NOVA-MBR-FP-003-0, NOVA-MBR-FP-008-0
관련 정책 그룹: PG-MBR-AUTH-002
관련 기능: FN-MBR-COM-002
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-auth-select | 인증수단 선택 | 업무별 허용 인증수단 목록 표시 및 선택 처리 | vertical | 항상 | [인증수단 선택] 허용 인증수단 목록 표시 및 선택 처리<br>[상태:loading] skeleton 표시<br>[액션:tap 인증수단 항목] setState selectedAuthMethod<br>[고지:필수\|POL-MBR-AUTH-002-01] 회원 가입 허용 인증수단<br>[고지:사용성\|POL-MBR-AUTH-002-05] 기본 노출 인증수단<br>[고지:사용성\|POL-MBR-AUTH-002-09] 인증수단 노출 순서 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 화면 진입 | 허용 인증수단 목록 표시 | apiCall |
| loading | 인증수단 목록 로딩 중 | skeleton 표시 | apiCall |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | list-cell-auth-phone | 휴대폰 본인인증 선택 | list-cell | - | onClick | setState | selectedAuthMethod | [정책:POL-MBR-AUTH-002-01] 회원 가입 허용 인증수단 |
| 2 | list-cell-auth-pass | PASS 인증 선택 | list-cell | - | onClick | setState | selectedAuthMethod | [정책:POL-MBR-AUTH-002-09] 인증수단 노출 순서 |
| 3 | list-cell-auth-cert | 공동인증서 선택 | list-cell | - | onClick | setState | selectedAuthMethod | [정책:POL-MBR-AUTH-002-09] 인증수단 노출 순서 |
