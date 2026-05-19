# SKT Design System — Foundation Guide
> Figma 파일: `SKT_SDUI_Test_0513_2` (`wLwyHV2L5wUz0fotXmN5dK`)  
> 섹션 노드: `design-principle` (`12004:8732`)  
> 추출 기준: Figma Variables API (실제 등록값) + 스크린샷 분석  
> 작성일: 2026-05-14  
> 구성: DSG_CLR · DSG_TYP · DSG_RAD · DSG_ICO · DSG_SPC

---

## 목차

1. [Color — 컬러 가이드](#1-color)
2. [Typography — 타이포그래피 가이드](#2-typography)
3. [Radius — 래디어스 가이드](#3-radius)
4. [Iconography — 아이콘 가이드](#4-iconography)
5. [Spacing — 스페이싱 가이드](#5-spacing)

---

## 1. Color

> `DSG_CLR` · Design System Governance  
> SKT 디자인 시스템의 컬러는 **Primitive → Semantic** 2계층으로 구성됩니다.  
> Primitive는 실제 색상 원시값, Semantic은 역할(role) 기반 별칭입니다.  
> ⚠️ Component별 색상 토큰은 별도 Component 토큰 문서에서 관리합니다.

---

### 1-1. Color Palette (Primitive)

> Figma Variables — `Primitive` 컬렉션 실제 등록값  
> 팔레트는 **Gray / Blue / Red / Gray-Alpha / White-Alpha** 5개 그룹으로 구성됩니다.

#### Gray

기본 배경·서피스·텍스트·아이콘에 사용하는 무채색 계열.  
베이스 컬러: `#05001A` (짙은 남색 기반 — 순수 블랙이 아닌 navy-tinted gray)

| Token | HEX | 용도 |
|---|---|---|
| `color/palette/gray-00` | `#FFFFFF` | 최상위 서피스 (floating, modal, card) |
| `color/palette/gray-50` | `#F8F9FB` | 페이지 기본 배경 (basement) |
| `color/palette/gray-100` | `#F4F5FA` | 카드·컴포넌트 기본 서피스 (default) |
| `color/palette/gray-200` | `#EBEEF6` | Neutral fill primary, 비활성 테두리 |
| `color/palette/gray-300` | `#E2E6F1` | Neutral fill secondary, border, disabled fill |
| `color/palette/gray-400` | `#D2D9EB` | Neutral fill tertiary, border-strong, text-weak |
| `color/palette/gray-500` | `#B4C0DE` | 비활성 텍스트·아이콘, subtle text |
| `color/palette/gray-600` | `#8990B2` | 보조 정보 텍스트 |
| `color/palette/gray-700` | `#5E6085` | Muted 텍스트 (레이블, 설명) |
| `color/palette/gray-800` | `#333058` | 강조 보조 텍스트 |
| `color/palette/gray-900` | `#08002C` | 최고 강도 배경 강조 |
| `color/palette/gray-1000` | `#05001A` | 기본 텍스트, 아이콘 (주 색상) |

#### Blue

SKT 브랜드 컬러 계열. 인터랙티브 요소·브랜드 강조에 사용.

| Token | HEX | 용도 |
|---|---|---|
| `color/palette/blue-50` | `#EFF3FC` | 브랜드 배경 (연한 강조 영역) |
| `color/palette/blue-100` | `#D3E0F8` | 브랜드 서브 fill, translucent 배경 |
| `color/palette/blue-600` | `#421ED8` | Brand fill (버튼 배경, 선택 상태) |
| `color/palette/blue-700` | `#3617CE` | Brand text, icon, border-focus (메인 브랜드 컬러) |

> **주의:** 브랜드 색상은 `blue-700`(`#3617CE`)이 텍스트/아이콘 기준, `blue-600`(`#421ED8`)이 fill 기준입니다.  
> blue-200 ~ blue-500 사이 값은 현재 Variables에 미등록 상태 (향후 추가 예정).

#### Red

위험·오류·경고 상태 표현에 사용하는 계열.

| Token | HEX | 용도 |
|---|---|---|
| `color/palette/red-50` | `#FEEFF0` | Danger 약한 배경 (에러 상태 fill) |
| `color/palette/red-600` | `#E42939` | Danger muted text (경고 텍스트) |
| `color/palette/red-700` | `#AB1F2B` | Danger text (에러 텍스트) |

> red-100 ~ red-500 사이 값은 현재 Variables에 미등록 상태.

#### Gray-Alpha

다크 오버레이·반투명 레이어용. 베이스 `#05001A`(gray-1000) 기반 투명도 적용.

| Token | 값 | 사용처 |
|---|---|---|
| `color/palette/gray-alpha-50` | `rgba(5,0,26, 5%)` | 초미세 오버레이 |
| `color/palette/gray-alpha-100` | `rgba(5,0,26, 10%)` | — |
| `color/palette/gray-alpha-150` | `rgba(5,0,26, 15%)` | — |
| `color/palette/gray-alpha-200` | `rgba(5,0,26, 20%)` | Scrim-light, icon-weak |
| `color/palette/gray-alpha-300` | `rgba(5,0,26, 30%)` | — |
| `color/palette/gray-alpha-400` | `rgba(5,0,26, 40%)` | icon-neutral-muted, text-neutral-tertiary |
| `color/palette/gray-alpha-500` | `rgba(5,0,26, 50%)` | Scrim-medium, icon-muted |
| `color/palette/gray-alpha-600` | `rgba(5,0,26, 60%)` | 딤 오버레이 (BottomSheet, Popup) |
| `color/palette/gray-alpha-700` | `rgba(5,0,26, 70%)` | — |
| `color/palette/gray-alpha-800` | `rgba(5,0,26, 80%)` | Scrim-strong, text-neutral-strong |
| `color/palette/gray-alpha-900` | `rgba(5,0,26, 90%)` | — |
| `color/palette/gray-alpha-950` | `rgba(5,0,26, 95%)` | — |

#### White-Alpha

라이트 오버레이·글래스 효과용. `#FFFFFF` 기반 투명도 적용.

| Token | 값 | 사용처 |
|---|---|---|
| `color/palette/white-alpha-50` | `rgba(255,255,255, 5%)` | — |
| `color/palette/white-alpha-100` | `rgba(255,255,255, 10%)` | overlay/light-10 |
| `color/palette/white-alpha-150` | `rgba(255,255,255, 15%)` | — |
| `color/palette/white-alpha-200` | `rgba(255,255,255, 20%)` | overlay/light-20 |
| `color/palette/white-alpha-300` | `rgba(255,255,255, 30%)` | — |
| `color/palette/white-alpha-400` | `rgba(255,255,255, 40%)` | — |
| `color/palette/white-alpha-500` | `rgba(255,255,255, 50%)` | overlay/light-50 |
| `color/palette/white-alpha-600` | `rgba(255,255,255, 60%)` | — |
| `color/palette/white-alpha-700` | `rgba(255,255,255, 70%)` | — |
| `color/palette/white-alpha-800` | `rgba(255,255,255, 80%)` | — |
| `color/palette/white-alpha-900` | `rgba(255,255,255, 90%)` | bg/layer/glass |
| `color/palette/white-alpha-950` | `rgba(255,255,255, 95%)` | bg/layer/elevated |

#### 특수 합성 토큰

| Token | 값 | 사용처 |
|---|---|---|
| `color/palette/gray-100-alpha-900` | `rgba(244,245,250, 90%)` | — |
| `color/palette/gray-200-alpha-200` | `rgba(235,238,246, 20%)` | — |
| `color/palette/gray-200-alpha-950` | `rgba(235,238,246, 95%)` | bg/secondary-translucent |
| `color/palette/blue-100-alpha-500` | `rgba(211,224,248, 50%)` | fill/brand-subtle-translucent |
| `color/palette/red-alpha-50` | `rgba(228,41,57, 5%)` | fill/danger-weak |

---

### 1-2. Semantic Color

> Figma Variables — `Semantic` 컬렉션 (Light 모드)  
> 역할(role) 기반 별칭. Primitive를 직접 사용하지 않고 반드시 Semantic 참조.  
> ⚠️ 보류 표시 항목: Semantic 컬렉션에 일부 토큰은 등록되었으나 Primitive 매핑 확정 전 상태.

#### Background (배경 레이어)

Z-축 기반 레이어 모델 — 위로 갈수록 더 밝고 더 높은 Z-index

| Token | Primitive | 해석값 | 레이어 |
|---|---|---|---|
| `color/bg/layer/basement` | `color/palette/gray-50` | `#F8F9FB` | 최하위 앱 배경 (전체 화면 배경) |
| `color/bg/layer/default` | `color/palette/gray-100` | `#F4F5FA` | 기본 서피스 (목록·텍스트필드) |
| `color/bg/layer/floating` | `color/palette/gray-00` | `#FFFFFF` | 모달·다이얼로그 오버레이 레이어 |
| `color/bg/layer/subtle` | `color/palette/gray-alpha-50` | `rgba(5,0,26, 5%)` | 초미세 강조 배경 |
| `color/bg/layer/elevated` | `color/palette/white-alpha-950` | `rgba(255,255,255, 95%)` | 상단 고정 요소 (반투명 흰 배경) |
| `color/bg/layer/glass` | `color/palette/white-alpha-900` | `rgba(255,255,255, 90%)` | 글래스 효과 배경 |
| `color/bg/overlay` | `color/palette/gray-alpha-600` | `rgba(5,0,26, 60%)` | 딤 레이어 (BottomSheet/Popup 뒤) |
| `color/bg/secondary-translucent` | `color/palette/gray-200-alpha-950` | `rgba(235,238,246, 95%)` | 반투명 보조 배경 |

#### Fill (채우기)

| Token | Primitive | 해석값 | 용도 |
|---|---|---|---|
| `color/fill/neutral/primary` | `color/palette/gray-200` | `#EBEEF6` | 기본 카드 배경, 중립 fill |
| `color/fill/neutral/secondary` | `color/palette/gray-300` | `#E2E6F1` | 2차 중립 fill, 구분선 배경 |
| `color/fill/neutral/tertiary` | `color/palette/gray-400` | `#D2D9EB` | 3차 중립 fill |
| `color/fill/brand` | `color/palette/blue-600` | `#421ED8` | 브랜드 버튼·선택 상태 배경 |
| `color/fill/brand-subtle` | `color/palette/blue-100` | `#D3E0F8` | 브랜드 약한 강조 배경 |
| `color/fill/brand-subtle-translucent` | `color/palette/blue-100-alpha-500` | `rgba(211,224,248, 50%)` | 반투명 브랜드 강조 |
| `color/fill/danger-weak` | `color/palette/red-alpha-50` | `rgba(228,41,57, 5%)` | 에러 상태 약한 배경 |
| `color/fill/disabled` | `color/palette/gray-300` | `#E2E6F1` | 비활성 컴포넌트 배경 |

#### Text (텍스트)

| Token | Primitive | 해석값 | 용도 |
|---|---|---|---|
| `color/text/neutral` | `color/palette/gray-1000` | `#05001A` | 기본 텍스트 (본문, 레이블) |
| `color/text/neutral-strong` | `color/palette/gray-alpha-800` | `rgba(5,0,26, 80%)` | 강조 텍스트 (반투명) |
| `color/text/neutral-muted` | `color/palette/gray-700` | `#5E6085` | 보조 텍스트 (설명, 날짜) |
| `color/text/neutral-subtle` | `color/palette/gray-500` | `#B4C0DE` | 부가 설명 텍스트 |
| `color/text/neutral-tertiary` | `color/palette/gray-alpha-400` | `rgba(5,0,26, 40%)` | 3차 텍스트 (반투명) |
| `color/text/neutral-weak` | `color/palette/gray-400` | `#D2D9EB` | 최약 텍스트 (placeholder 등) |
| `color/text/brand` | `color/palette/blue-700` | `#3617CE` | 브랜드 텍스트·링크 |
| `color/text/brand-strong` | `color/palette/blue-700` | `#3617CE` | 강조 브랜드 텍스트 |
| `color/text/danger` | `color/palette/red-700` | `#AB1F2B` | 에러·위험 텍스트 |
| `color/text/danger-muted` | `color/palette/red-600` | `#E42939` | 경고 텍스트 (muted) |
| `color/text/inverse` | `color/palette/gray-00` | `#FFFFFF` | 반전 텍스트 (다크 배경 위) |
| `color/text/disabled` | `color/palette/gray-500` | `#B4C0DE` | 비활성 텍스트 |

#### Border (테두리)

| Token | Primitive | 해석값 | 용도 |
|---|---|---|---|
| `color/border` | `color/palette/gray-300` | `#E2E6F1` | 기본 테두리 |
| `color/border-strong` | `color/palette/gray-400` | `#D2D9EB` | 강조 테두리 |
| `color/border-subtle` | `color/palette/gray-100` | `#F4F5FA` | 약한 테두리 |
| `color/border-focus` | `color/palette/blue-700` | `#3617CE` | 포커스 링 (TextField 등) |
| `color/border-disabled` | `color/palette/gray-500` | `#B4C0DE` | 비활성 테두리 |

#### Icon (아이콘)

| Token | Primitive | 해석값 | 용도 |
|---|---|---|---|
| `color/icon/neutral` | `color/palette/gray-1000` | `#05001A` | 기본 아이콘 |
| `color/icon/neutral-muted` | `color/palette/gray-alpha-500` | `rgba(5,0,26, 50%)` | 보조 아이콘 |
| `color/icon/neutral-weak` | `color/palette/gray-alpha-200` | `rgba(5,0,26, 20%)` | 약한 아이콘 |
| `color/icon/inverse` | `color/palette/gray-00` | `#FFFFFF` | 반전 아이콘 (다크 배경 위) |
| `color/icon/brand` | `color/palette/blue-700` | `#3617CE` | 브랜드 아이콘 |

#### Overlay (오버레이)

| Token | Primitive | 해석값 | 용도 |
|---|---|---|---|
| `color/overlay/scrim-light` | `color/palette/gray-alpha-200` | `rgba(5,0,26, 20%)` | 약한 딤 |
| `color/overlay/scrim-medium` | `color/palette/gray-alpha-500` | `rgba(5,0,26, 50%)` | 중간 딤 |
| `color/overlay/scrim-strong` | `color/palette/gray-alpha-800` | `rgba(5,0,26, 80%)` | 강한 딤 |
| `color/overlay/light-10` | `color/palette/white-alpha-100` | `rgba(255,255,255, 10%)` | 라이트 오버레이 10% |
| `color/overlay/light-20` | `color/palette/white-alpha-200` | `rgba(255,255,255, 20%)` | 라이트 오버레이 20% |
| `color/overlay/light-50` | `color/palette/white-alpha-500` | `rgba(255,255,255, 50%)` | 라이트 오버레이 50% |

---

## 2. Typography

> `DSG_TYP` · UI Principle *(진행중)*  
> Font: **Pretendard Variable** (단일 패밀리)  
> 계층: **Primitive Token → Semantic Token → Text Style** 3단계로 조합

---

### 2-1. Primitive Token

#### Font Family
| Token | 값 |
|---|---|
| `font/family/base` | `Pretendard Variable` |

#### Font Size (10단계)
| Token | px | rem |
|---|---|---|
| `font/size/100` | 10px | 0.625rem |
| `font/size/200` | 11px | 0.6875rem |
| `font/size/300` | 12px | 0.75rem |
| `font/size/400` | 13px | 0.8125rem |
| `font/size/500` | 14px | 0.875rem |
| `font/size/600` | 15px | 0.9375rem |
| `font/size/700` | 16px | 1rem |
| `font/size/800` | 18px | 1.125rem |
| `font/size/900` | 20px | 1.25rem |
| `font/size/1000` | 24px | 1.5rem |

#### Font Weight (4단계)
| Token | Figma Style Name | CSS weight |
|---|---|---|
| `font/weight/regular` | `Regular` | 400 |
| `font/weight/medium` | `Medium` | 500 |
| `font/weight/semibold` | `SemiBold` | 600 |
| `font/weight/bold` | `Bold` | 700 |

#### Letter Spacing (2단계)
| Token | 값 | 적용 범위 |
|---|---|---|
| `font/letter-spacing/normal` | -4% | 기본 (대부분의 텍스트) |
| `font/letter-spacing/dense` | -5% | title-large 전용 (18px 계열) |

#### Line Height (3단계)
| Token | 값 | 적용 범위 |
|---|---|---|
| `font/line-height/100` | 120% | display, headline (24px, 20px) |
| `font/line-height/200` | 130% | title, body, caption (대부분) |
| `font/line-height/300` | 140% | title-small (15px) 전용 |

#### 기타
| Token | 값 |
|---|---|
| `font/paragraph-spacing/base` | 0 |
| `font/paragraph-indent/base` | 0 |

---

### 2-2. Semantic Token

역할(role) 기반 타이포그래피 계층 정의

| Token | 역할 설명 |
|---|---|
| `typography/role/display` | 페이지당 1회 사용. 완료·강조 화면용 최대 타이포 |
| `typography/role/headline` | 페이지 대표 타이포. 홈 카드·히어로 영역 |
| `typography/role/title` | 섹션·카드 제목. 상세 페이지 소제목 |
| `typography/role/body` | 본문 텍스트. 일반적인 정보 전달 |
| `typography/role/caption` | 보조 정보. 배지·콜아웃·도움말·레이블 |

계층 사용 원칙:
- display → headline → title → body → caption 순서 준수
- **화면당 font-weight 최대 3종 혼용** (4종 이상 금지)
- weight 사용 우선순위: 600(SemiBold) > 500(Medium) > 400(Regular)

---

### 2-3. Text Style (Composed)

Primitive(size + weight + letter-spacing + line-height) 조합으로 만들어진 완성 텍스트 스타일

| Token | Size | Weight | Letter-Spacing | Line-Height | 사용처 |
|---|---|---|---|---|---|
| `typography/display` | 24px | 500 | -4% | 120% | 완료 화면 대형 헤딩 |
| `typography/headline` | 20px | 500 | -4% | 120% | 페이지 대표 헤딩 |
| `typography/title-large-600` | 18px | 600 | **-5%** | 130% | 강조 섹션 제목 |
| `typography/title-large-500` | 18px | 500 | **-5%** | 130% | 일반 섹션 제목 |
| `typography/title-large-400` | 18px | 400 | **-5%** | 130% | 가벼운 섹션 제목 |
| `typography/title-medium-600` | 16px | 600 | -4% | 130% | TitleSection 컴포넌트 |
| `typography/title-medium-500` | 16px | 500 | -4% | 130% | 서브 섹션 제목 |
| `typography/title-small-600` | 15px | 600 | -4% | **140%** | Accordion 타이틀 |
| `typography/title-small-500` | 15px | 500 | -4% | **140%** | 컴포넌트 레이블 |
| `typography/body-700` | 14px | 700 | -4% | 130% | 강조 본문 |
| `typography/body-600` | 14px | 600 | -4% | 130% | 버튼 텍스트 (medium/large) |
| `typography/body-500` | 14px | 500 | -4% | 130% | 일반 본문 (ListText, PagestackItem) |
| `typography/body-400` | 14px | 400 | -4% | 130% | 읽기 전용 폼 값, 입력 필드 내 텍스트 |
| `typography/caption-large-700` | 13px | 700 | -4% | 130% | — |
| `typography/caption-large-600` | 13px | 600 | -4% | 130% | 뱃지·TitleSection 우측 텍스트 |
| `typography/caption-large-500` | 13px | 500 | -4% | 130% | 보조 레이블, BottomNavigation |
| `typography/caption-large-400` | 13px | 400 | -4% | 130% | Callout, Footer 텍스트 |
| `typography/caption-medium-600` | 12px | 600 | -4% | 130% | — |
| `typography/caption-medium-500` | 12px | 500 | -4% | 130% | — |
| `typography/caption-medium-400` | 12px | 400 | -4% | 130% | — |
| `typography/caption-small-600` | 11px | 600 | -4% | 130% | 배지 텍스트 (Badge 컴포넌트) |
| `typography/caption-small-500` | 11px | 500 | -4% | 130% | BottomNavigation 레이블 |
| `typography/caption-small-400` | 11px | 400 | -4% | 130% | — |
| `typography/caption-xsmall-600` | 10px | 600 | -4% | 130% | — |
| `typography/caption-xsmall-500` | 10px | 500 | -4% | 130% | — |

총 **25개** Text Style

---

### 2-4. TextStyle Usage — 적용 원칙

#### 1. 계층 기반 사용
| Role | 사용 화면/컴포넌트 | 예시 |
|---|---|---|
| display | 완료 화면 (TitleMain/Complete) | "개통이 완료되었어요" |
| title | TitleSection, Accordion, AppBar | 섹션 제목, 내비게이션 제목 |
| body | ListText, TextField, Callout 본문 | 정보 행, 입력 값 |
| caption | Badge, BottomNavigation, Footer | 배지 텍스트, 탭 레이블 |

#### 2. Body 계열 weight 선택 기준
| Weight | 사용 상황 |
|---|---|
| 700 | 강조가 필요한 특수한 경우 (드문 사용) |
| 600 | 버튼 텍스트 (medium/large 버튼) |
| 500 | 리스트 아이템, 선택 항목 |
| 400 | 읽기 전용 값, 입력 필드 내 텍스트 |

#### 3. Letter-Spacing 예외 규칙
- 18px(title-large) 계열만 `-5%` (dense) 적용
- 나머지 모든 스타일은 `-4%` (normal) 적용

---

## 3. Radius

> `DSG_RAD` · Design System Governance  
> SKT 디자인 시스템의 radius는 **Corner Smoothing 60%** 를 공통 적용합니다.  
> (iOS Squircle 유사 처리. Figma의 Corner Smoothing 설정 값)

---

### 3-1. Radius Primitive Token

| Token | 값 | CSS Variable |
|---|---|---|
| `radius/none` | 0px | `var(--radius-none)` |
| `radius/4` | 4px | `var(--radius-4)` |
| `radius/6` | 6px | `var(--radius-6)` |
| `radius/10` | 10px | `var(--radius-10)` |
| `radius/12` | 12px | `var(--radius-12)` |
| `radius/16` | 16px | `var(--radius-16)` |
| `radius/20` | 20px | `var(--radius-20)` |
| `radius/24` | 24px | `var(--radius-24)` |
| `radius/28` | 28px | `var(--radius-28)` |
| `radius/full` | 9999px | `var(--radius-full)` |

총 **10개** Radius Primitive

---

### 3-2. Radius Semantic Token

컴포넌트 유형에 따라 3개 카테고리로 분류합니다.

#### Element (정보 표시 요소 — 배지, 칩 등)

높이(height) 기준으로 자동 결정

| Token | Primitive | 해석값 | 적용 기준 |
|---|---|---|---|
| `radius/element/sm` | `radius/4` | 4px | height < 20px |
| `radius/element/md` | `radius/6` | 6px | height ≥ 20px |
| `radius/element/lg` | `radius/10` | 10px | height ≥ 24px |

```
Badge (h=17px)      → radius/element/sm → 4px
BadgeIcon (h=28px)  → radius/element/md → 6px
Tooltip (h=35px)    → radius/element/md → 6px
Callout (h=41px)    → radius/element/lg → 10px
```

#### Control (인터랙티브 컨트롤 — 버튼, 입력 필드 등)

높이(height) 기준으로 자동 결정

| Token | Primitive | 해석값 | 적용 기준 |
|---|---|---|---|
| `radius/control/sm` | `radius/12` | 12px | height ≥ 36px |
| `radius/control/md` | `radius/16` | 16px | height ≥ 48px |
| `radius/control/lg` | `radius/20` | 20px | height ≥ 56px |

```
Button/medium (h=36px)  → radius/control/sm → 12px
Button/large (h=48px)   → radius/control/md → 16px
Button/xlarge (h=56px)  → radius/control/lg → 20px
TextField (h=48px)      → radius/control/md → 16px (예외: radius/12 적용)
SearchBar/LLM (h=52px)  → radius/full
SearchBar/Search (h=45px) → radius/full
Chip (h=37px)           → radius/full
```

#### Container (카드, 시트, 오버레이 등)

컨텍스트(목적) 기준으로 결정

| Token | Primitive | 해석값 | 적용 컴포넌트 |
|---|---|---|---|
| `radius/container/product-unit` | `radius/20` | 20px | 상품 카드 (ListProductHorizontal 등) |
| `radius/container/home-card` | `radius/24` | 24px | 홈 카드, 팝업 |
| `radius/container/popup` | `radius/24` | 24px | Popup 컴포넌트 |
| `radius/container/bottom-sheet` | `radius/28` | 28px | BottomSheet (상단 코너만) |
| `radius/full` | `radius/full` | 9999px | 원형 썸네일, 프로필 이미지 |

---

### 3-3. Radius Usage — 시각적 경계 규칙 (Visual Boundary)

컨테이너 내부에 요소가 중첩될 때 적용되는 radius 관계 규칙

#### 중첩 radius 원칙
```
외부 컨테이너 radius > 내부 요소 radius
(단, radius/full은 예외 — 항상 허용)
```

| 외부 컨테이너 | 내부 요소 | 내부 요소 radius |
|---|---|---|
| radius/28 (BottomSheet) | 버튼, 카드 내부 요소 | ≤ radius/20 |
| radius/24 (Popup/홈카드) | 버튼, 내부 컨테이너 | ≤ radius/16 |
| radius/20 (상품 카드) | 내부 뱃지, 버튼 | ≤ radius/12 |
| radius/12 (버튼/입력) | 내부 아이콘 | radius/full 가능 |

#### 경계 충돌 예시
```
✅ 올바른 중첩:
  Card (radius/20) > Badge (radius/4) — 외부 > 내부

❌ 잘못된 중첩:
  Card (radius/20) 내부에 > 요소 (radius/24) — 내부 > 외부 금지

✅ full 예외:
  Button (radius/12) 내부에 > 아이콘 컨테이너 (radius/full) — 항상 허용
```

---

### 3-4. 중첩 규칙 (Nesting Rule) — 실용 가이드

| 상황 | 권장 처리 |
|---|---|
| 카드 위의 뱃지 | 카드 radius의 절반 이하 |
| 풀블리드 이미지 내 버튼 | 컨테이너 radius와 동일 |
| 중첩이 불분명한 경우 | radius/full (원형) 사용 |
| 배경에 완전히 붙지 않는 요소 | radius 독립 적용 가능 |

---

## 4. Iconography

> `DSG_ICO` · Design System Governance  
> SKT 아이콘 시스템은 **System / Graphic** 2가지 유형으로 구성됩니다.  
> Lucide Icons를 기반으로 한 UI 아이콘과 브랜드 표현용 Graphic 아이콘으로 이분합니다.

---

### 4-1. Icon Type (아이콘 유형)

#### System Icon (UI 기능 아이콘)

| 속성 | 값 |
|---|---|
| 기준 크기 | 24px × 24px |
| 최대 크기 | 24px |
| Stroke | 2px |
| Cap / Join | Round (둥근 끝·모서리) |
| 색상 | 단일 색상 (color token 참조) |
| 변형 | Outline / Filled |
| 용도 | UI 조작·기능·상태 표현 (내비게이션, 버튼, 상태 아이콘) |

특징:
- **Fill 없이 Stroke만** 사용하는 Outline 스타일이 기본
- 특정 상태(선택됨, 활성화)에서 Filled 변형 사용
- 고정 색상 없이 컨텍스트에 따라 `color/icon/*` 토큰으로 채색

#### Graphic Icon (브랜드 표현 아이콘)

| 속성 | 값 |
|---|---|
| 기준 크기 | 40px × 40px |
| 최대 크기 | 40px |
| Stroke | 가변 (두꺼운 stroke 허용) |
| 색상 | 고정 색상 (브랜드 컬러 기반 다색) |
| 용도 | 브랜드 표현, 서비스 아이덴티티, 빈 상태 일러스트 |

특징:
- 다색(multi-color) fill 허용
- App 아이콘, 서비스 로고, 카테고리 심볼 등에 사용
- System 아이콘과 혼용 금지

---

### 4-2. Icon Size (크기 체계)

| Token | 크기 | 사용 유형 | 적용 컨텍스트 |
|---|---|---|---|
| `icon-size-12` | 12px | System | 인라인 미니 아이콘 |
| `icon-size-16` | 16px | System | 텍스트 인라인 아이콘, 우측 화살표 |
| `icon-size-20` | 20px | System | TitleSection 아이콘, 중형 UI 아이콘 |
| `icon-size-24` | 24px | System | **기본 크기** (BottomNavigation, AppBar, 버튼 내) |
| `icon-size-32` | 32px | System / Graphic | 대형 UI 포인트 아이콘 |
| `icon-size-40` | 40px | Graphic | Graphic 아이콘 기준 크기 |

---

### 4-3. Icon Component Properties

Figma 컴포넌트에서 제공하는 속성:

| Property | 값 | 설명 |
|---|---|---|
| `Type` | `System` / `Graphic` | 아이콘 유형 |
| `Style` | `Outline` / `Filled` | System 아이콘 스타일 |
| `Size` | `12` / `16` / `20` / `24` / `32` / `40` | 크기 선택 |
| `Color` | color token | System 아이콘 적용 색상 |

#### Style 선택 기준

| 상태 | Style |
|---|---|
| 기본 (비선택) | Outline |
| 활성/선택됨 | Filled |
| BottomNavigation 활성 탭 | Filled |
| 버튼 내부 아이콘 | Outline (흰 배경) / Filled 모두 가능 |

---

### 4-4. Usage — 아이콘 사용 원칙

#### 1. 크기 선택
- UI 내 버튼·내비게이션: `icon-size-24` (기본)
- 텍스트 옆 인라인 아이콘: `icon-size-16` ~ `icon-size-20`
- 강조 포인트 아이콘: `icon-size-32` ~ `icon-size-40` (Graphic)

#### 2. 색상 적용
| 컨텍스트 | 사용 토큰 |
|---|---|
| 일반 아이콘 | `color/icon/neutral` → `#05001A` |
| 비활성/보조 | `color/icon/neutral-muted` |
| 브랜드 포인트 | `color/icon/brand` → `#3617CE` |
| 다크 배경 위 | `color/icon/inverse` → `#FFFFFF` |

#### 3. 금지 사항
- System 아이콘을 40px 이상으로 사용 금지
- Graphic 아이콘을 24px 이하로 사용 금지
- System + Graphic 혼합 사용 금지 (같은 UI 레이어 내)
- 임의 색상 직접 지정 금지 → 반드시 color token 사용

---

## 5. Spacing

> `DSG_SPC` · Design System Governance  
> **기본 단위: 2px** — 모든 spacing 값은 2px의 배수로 정의됩니다.  
> Layout spacing / Inner spacing 2가지 역할로 분류합니다.

---

### 5-1. Spacing Primitive Token

2px 기본 단위 기반, 17개 값 등록

| Token | px | rem | CSS Variable |
|---|---|---|---|
| `space/none` | 0px | 0 | `var(--space-none)` |
| `space/2` | 2px | 0.125rem | `var(--space-2)` |
| `space/4` | 4px | 0.25rem | `var(--space-4)` |
| `space/6` | 6px | 0.375rem | `var(--space-6)` |
| `space/8` | 8px | 0.5rem | `var(--space-8)` |
| `space/10` | 10px | 0.625rem | `var(--space-10)` |
| `space/12` | 12px | 0.75rem | `var(--space-12)` |
| `space/14` | 14px | 0.875rem | `var(--space-14)` |
| `space/16` | 16px | 1rem | `var(--space-16)` |
| `space/18` | 18px | 1.125rem | `var(--space-18)` |
| `space/20` | 20px | 1.25rem | `var(--space-20)` |
| `space/22` | 22px | 1.375rem | `var(--space-22)` |
| `space/24` | 24px | 1.5rem | `var(--space-24)` |
| `space/28` | 28px | 1.75rem | `var(--space-28)` |
| `space/32` | 32px | 2rem | `var(--space-32)` |
| `space/36` | 36px | 2.25rem | `var(--space-36)` |
| `space/40` | 40px | 2.5rem | `var(--space-40)` |

---

### 5-2. Spacing Semantic Token

역할 기반 spacing 별칭. Primitive를 직접 사용하지 않고 Semantic 참조.

#### Layout Spacing — 화면 레이아웃 마진·간격

| Token | Primitive | 해석값 | 용도 |
|---|---|---|---|
| `spacing/layout/page-horizontal` | `space/none` | 0px | 컴포넌트 좌우 마진 없음 (풀블리드) |
| `spacing/layout/section-horizontal` | `space/12` | 12px | 1depth 섹션 좌우 마진 (393→369px) |
| `spacing/layout/content-horizontal` | `space/16` | 16px | 일반 본문 콘텐츠 좌우 마진 (393→361px) |
| `spacing/layout/card-horizontal-pagestack` | `space/20` | 20px | PagestackItem 카드 좌우 내부 패딩 (369→329px) |
| `spacing/layout/component-gap-xs` | `space/4` | 4px | 반복 컴포넌트 간 최소 간격 |
| `spacing/layout/component-gap-sm` | `space/8` | 8px | 소형 컴포넌트 간 간격 |
| `spacing/layout/component-gap-md` | `space/12` | 12px | 중형 컴포넌트 간 간격 |
| `spacing/layout/component-gap-lg` | `space/16` | 16px | 대형 컴포넌트 간 간격 |
| `spacing/layout/component-gap-xl` | `space/20` | 20px | 특대형 컴포넌트 간 간격 |
| `spacing/layout/component-gap-2xl` | `space/28` | 28px | 섹션 간 간격 |
| `spacing/layout/component-gap-3xl` | `space/32` | 32px | 대섹션 간 간격 |

#### Inner Spacing — 컴포넌트 내부 패딩

| Token | Primitive | 해석값 | 용도 |
|---|---|---|---|
| `spacing/inner/box-vertical` | `space/12` | 12px | Box 컴포넌트 상하 패딩 |
| `spacing/inner/box-horizontal` | `space/16` | 16px | Box 컴포넌트 좌우 패딩 |
| `spacing/inner/button-section-vertical` | `space/22` | 22px | ButtonSection 1depth 상하 패딩 |
| `spacing/inner/card-all-1depth` | `space/28` | 28px | 1depth 카드 전체 패딩 (Pagestack 상단) |
| `spacing/inner/card-all-2depth` | `space/24` | 24px | 2depth 카드 전체 패딩 |

---

### 5-3. Usage — 스페이싱 사용 원칙

#### 1. 컴포넌트 간격 (Component Spacing)
| 컨텍스트 | 사용 토큰 | px |
|---|---|---|
| 아이콘 + 텍스트 인라인 | component-gap-xs | 4px |
| 인접 버튼·칩 | component-gap-sm | 8px |
| 카드 내 섹션 사이 | component-gap-md | 12px |
| 리스트 아이템 간 | component-gap-lg | 16px |
| 카드 간 수직 간격 | component-gap-xl | 20px |

#### 2. 레이아웃 마진 (Layout Spacing) — 화면 너비 그리드
```
393px ── 풀블리드 (page-horizontal = 0px)
  └── 369px ── 12px 양쪽 (section-horizontal)
  └── 361px ── 16px 양쪽 (content-horizontal)
        └── 329px ── 20px 양쪽 (card-horizontal-pagestack)
```

실제 컴포넌트 배치 예시:
```
StatusBar, AppBar, ActionButton, Divider(4px)  → 393px (page-horizontal)
Pagestack, CardCarousel, CardSection           → 369px (section-horizontal)
Form body, detail content, two-column grid      → 361px (content-horizontal)
TitleSection, ListText, TextField, Accordion   → 329px (card-horizontal-pagestack)
```

Figma 실측에서 token scale에 없는 값이 보이면 임의 primitive token으로 승격하지 않는다. 먼저 가장 가까운 정식 spacing token으로 정렬하고, 반복 사용이 확인될 때 token 추가를 검토한다.

#### 3. Inner Spacing (카드·컨테이너 내부)
| 컴포넌트 | 적용 토큰 |
|---|---|
| Pagestack 상단 패딩 | card-all-1depth (28px) |
| 중첩 카드 내부 패딩 | card-all-2depth (24px) |
| ActionButton 상하 | button-section-vertical (22px) |

---

## 부록 — Variables 컬렉션 현황

| 컬렉션 | 모드 | 변수 수 | 상태 |
|---|---|---|---|
| `Primitive` | Primitive (1개) | 약 90개 | 등록 완료 |
| `Semantic` | Light (1개) | 약 70개 | 색상·spacing·radius 등록 완료 |

### 미등록 / 보류 항목

| 항목 | 상태 | 비고 |
|---|---|---|
| blue-200 ~ blue-500 | 미등록 | Primitive 컬렉션에 없음 |
| red-100 ~ red-500 | 미등록 | Primitive 컬렉션에 없음 |
| gray-alpha-150, 300, 700, 900, 950 | Primitive 등록됨 | Semantic 매핑 없음 |
| Shadow/Elevation | 미등록 | blur·offset·spread 값 정의 필요 |
| Dark 모드 Semantic | 미정 | Semantic 컬렉션 mode 추가 필요 |
| Typography Semantic tokens | 진행중 | DSG_TYP 진행중(WIP) 상태 |
| Component tokens (Figma 내 등록) | 미시작 | 별도 Component 컬렉션 필요 |

### CSS Variable 명명 규칙

```
format: var(--{category}-{subcategory}-{variant})

예시:
  var(--color-bg-layer-basement)      /* Semantic 색상 */
  var(--color-palette-gray-700)       /* Primitive 색상 */
  var(--space-16)                     /* Primitive 스페이싱 */
  var(--spacing-layout-section-horizontal)  /* Semantic 스페이싱 */
  var(--radius-12)                    /* Primitive radius */
  var(--radius-container-popup)       /* Semantic radius */
  var(--font-line-height-200)         /* Primitive 타이포 */
```

슬래시(`/`)와 공백은 모두 하이픈(`-`)으로 치환:
```javascript
// CORRECT
`var(--${name.replace(/[\s\/]+/g, '-').toLowerCase()})`
```
