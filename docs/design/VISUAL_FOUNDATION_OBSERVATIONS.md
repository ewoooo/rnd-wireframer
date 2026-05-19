# Visual Foundation 관찰값

> 출처: `AGENTS.md`의 디자인 패턴 문서 기준에 따라 책임 단위로 분리. Divider, typography, 핵심 관찰 요약을 소유한다.

## 11. Divider 사용 체계

| 크기 | 사용 빈도 | 용도 |
|---|---|---|
| `393×4px` | 34회 | 섹션 구분 (Pagestack 사이의 두꺼운 구분선) |
| `329×1px` | 45회 | 리스트 아이템 구분 (Accordion 내부, 텍스트 리스트) |
| `329×17px` | 6회 | 공간 스페이서 |
| `329×41px` | 4회 | 바텀시트 내부 큰 스페이서 |
| `393×1px` | 1회 | 풀블리드 얇은 구분선 (Footer 앞) |

---

## 12. 타이포그래피 사용 패턴 (관찰값)

| 텍스트 높이 | 추정 스타일 | 사용 예 |
|---|---|---|
| 16px | caption-large (13px) | 가격 레이블 |
| 17px | caption-large (13px) | 배지 텍스트 |
| 18px | body-500 (14px) | 상품명, 레이블, 안내 텍스트 |
| 21px | title-small (15px) | Accordion 타이틀, 요금제명 |
| 22px | body-400 (14px) | ListText 행 |
| 26px | title-medium (16px) | 팝업 타이틀 |
| 37px | title-medium-600 (16px) | TitleSection |
| 42px | body + 줄간격 | 팝업 본문 텍스트 |

---

## 13. 핵심 설계 원칙 요약

1. **SDUI 슬롯 아키텍처**: `Pagestack`이 서버 주도 UI의 핵심 컨테이너. 서버는 슬롯에 `Default 20/PagestackItem` 또는 `Card 0/PagestackItem`을 주입하여 화면을 조합.

2. **화면 너비 그리드**: `393 → 369 / 361 → 329px`. 369px는 카드형 section wrapper와 리스트 그룹, 361px는 일반 본문 콘텐츠와 폼/상세 화면의 기본 폭, 329px는 내부 콘텐츠 폭으로 사용한다.

3. **스크롤 긴 화면**: 화면 높이 852~4604px. 헤더(107px)는 별도 오버레이로 고정.

4. **액션존 이분법**: 메인·브라우즈 화면 → `BottomNavigation` (88px) / 상세·폼 화면 → `ActionButton` (102px). 동시 사용 없음.

5. **`Local_` 컴포넌트**: 화면 특화 조합 컴포넌트. CX component vocabulary와 layout pattern을 조합한 페이지 맥락 중심 organism 후보. 재사용성보다 정책/화면 맥락에 최적화.

6. **섹션 구분 패턴**: `Pagestack + Divider(393×4px)` 반복. 상세/폼 화면의 기본 구조.

7. **오버레이 패턴**: BottomSheet·Popup은 항상 `dim 오버레이 프레임` 위에 배치. BottomSheet는 하단 앵커, Popup은 x=16 수평 중앙.

8. **AccordionList**: `Accordion ↔ Divider(329×1px)` 교번. FAQ·이용약관·상세정보 모두 동일 패턴.
