// [KIKI-SHIM] 우리가 kiki 위에 얹는 큐레이션 주석 — "이 컴포넌트를 어떻게 쓰나" 제안.
//
// kiki 자동생성 catalog(packages/external/src/catalog.ts)는 type/props 만 가진다.
// 사람이 판단한 description(용도) + prop별 role(의미) / tokenRole(토큰 스케일)을 여기 모아두고,
// gen-catalog.ts 가 catalog 생성 시 머지한다. (단일 파일 = 쉽게 관리/제거)
//
// 제거: kiki 빌드가 자체 메타를 제공하면 이 파일 삭제 + gen-catalog 의 머지 제거.
// 가이드: packages/external/KIKI-SHIM.md
//
// role 가능값: title · label · description · content · styleVariant · layout · state · value · data · event · slot · visibility
// tokenRole: spacing · radius · ... (대부분 kiki 는 토큰을 내부 하드코딩해서 prop 레벨엔 거의 없음)

// @cx/types 는 scripts/ 컨텍스트에서 해소가 안 돼(루트에 @cx 의존 없음, tsx 전용 스크립트라)
// 유니온을 로컬로 둔다. @cx/types/component-catalog 의 ComponentPropRole 과 동일하게 유지할 것.
type ComponentPropRole =
	| "content"
	| "data"
	| "description"
	| "event"
	| "label"
	| "layout"
	| "slot"
	| "state"
	| "styleVariant"
	| "title"
	| "value"
	| "visibility";

export interface KikiPropAnnotation {
	role?: ComponentPropRole;
	/** @cx/types/tokens 의 TokenRole (spacing/radius 등). 사용 시 정확한 값으로. */
	tokenRole?: string;
}

export interface KikiAnnotation {
	description?: string;
	props?: Record<string, KikiPropAnnotation>;
}

export const kikiAnnotations: Record<string, KikiAnnotation> = {
	// ── 공식 barrel 13개 ──────────────────────────────────────────────
	"kiki.AppBar": {
		description:
			"화면 상단 앱 바(헤더). 뒤로가기·타이틀·로고와 우측 액션 슬롯을 제공한다. 화면 최상단 고정 영역에 둔다.",
		props: {
			title: { role: "title" },
			showBack: { role: "visibility" },
			showLogo: { role: "visibility" },
			rightItem: { role: "slot" },
			onBack: { role: "event" },
		},
	},
	"kiki.Badge": {
		description:
			"상태·속성을 강조하는 작은 뱃지. 짧은 텍스트 라벨을 variant 색상으로 표시한다. 제목/항목 옆 보조 표식으로 쓴다.",
		props: {
			variant: { role: "styleVariant" },
			children: { role: "content" },
		},
	},
	"kiki.BottomNavigation": {
		description:
			"화면 하단 글로벌 내비게이션 바. 탭 항목 목록(items)과 현재 선택(activeKey)을 받아 주요 화면 간 전환을 제공한다.",
		props: {
			items: { role: "data" },
			activeKey: { role: "state" },
			onChange: { role: "event" },
		},
	},
	"kiki.Button": {
		description:
			"기본 액션 버튼. variant(primary/secondary/solid)로 강조도, size로 크기를 정하고 children 에 라벨을 넣는다. 화면의 주요 행동(확인/다음/제출)에 쓴다.",
		props: {
			variant: { role: "styleVariant" },
			size: { role: "styleVariant" },
			fullWidth: { role: "layout" },
			rightIcon: { role: "slot" },
			children: { role: "content" },
		},
	},
	"kiki.Callout": {
		description:
			"강조 안내 박스(콜아웃). 제목과 본문으로 주의·안내·결과 메시지를 묶어 보여준다. 폼 위/아래의 안내 문구에 적합.",
		props: {
			title: { role: "title" },
			children: { role: "content" },
		},
	},
	"kiki.Chip": {
		description:
			"선택 가능한 칩. 필터·토글·태그 용도로 selected 상태와 라벨(children)을 표시한다. 여러 개를 가로로 나열해 다중 선택에 쓴다.",
		props: {
			selected: { role: "state" },
			onClick: { role: "event" },
			children: { role: "content" },
		},
	},
	"kiki.Divider": {
		description:
			"구분선. type=contents 는 항목 사이 얇은 선, type=section 은 영역 사이 굵은 선. 리스트·섹션 경계를 나눌 때 쓴다.",
		props: {
			type: { role: "styleVariant" },
		},
	},
	"kiki.InfoTextList": {
		description:
			"정보 텍스트 행. 제목과 카테고리·날짜·뱃지·우측 텍스트 같은 메타 정보를 한 줄에 정렬해 보여준다. 상세/요약 정보 나열에 쓴다.",
		props: {
			title: { role: "title" },
			category: { role: "data" },
			date: { role: "data" },
			badge: { role: "label" },
			rightText: { role: "value" },
		},
	},
	"kiki.ListSelected": {
		description:
			"선택형 리스트 항목. radio/checkbox(type)로 선택하고 라벨·가격·보조 버튼을 옵션으로 노출한다. 약관 동의·상품 선택 목록에 쓴다.",
		props: {
			type: { role: "styleVariant" },
			label: { role: "label" },
			price: { role: "value" },
			buttonLabel: { role: "label" },
			checked: { role: "state" },
			showPrice: { role: "visibility" },
			showButton: { role: "visibility" },
			onChange: { role: "event" },
			onButtonClick: { role: "event" },
		},
	},
	"kiki.ListText": {
		description:
			"텍스트 리스트 항목. 제목·보조설명·가격과 우측 이동 아이콘을 가진 목록 행. 설정·메뉴·내역 리스트의 한 줄로 쓴다.",
		props: {
			table: { role: "data" },
			title: { role: "title" },
			subText: { role: "description" },
			price: { role: "value" },
			showRightItem: { role: "visibility" },
			onClick: { role: "event" },
		},
	},
	"kiki.Tab": {
		description:
			"탭 바. 탭 항목 목록(items)과 현재 선택(activeKey)을 받아 같은 화면 내 콘텐츠 전환을 제공한다. 섹션 내 분류 전환에 쓴다.",
		props: {
			items: { role: "data" },
			activeKey: { role: "state" },
			onChange: { role: "event" },
		},
	},
	"kiki.TextField": {
		description:
			"텍스트 입력 필드. 라벨·플레이스홀더·도움말과 에러/상태 표시, 우측 요소 슬롯을 지원한다. 폼의 단일 입력 한 칸으로 쓴다.",
		props: {
			label: { role: "label" },
			placeholder: { role: "description" },
			helperText: { role: "description" },
			value: { role: "value" },
			type: { role: "styleVariant" },
			state: { role: "state" },
			error: { role: "state" },
			rightElement: { role: "slot" },
			onChange: { role: "event" },
		},
	},
};
