/**
 * Catalog sync — source definition.
 *
 * 이 파이프라인의 의의는 "외부 디자인 시스템 리포 → 우리 카탈로그" 동기화를
 * 자동화하는 것이다. 소스 리포는 여기 설정값일 뿐이며, 다른 리포로 바뀌어도
 * 파이프라인(scripts/sync-catalog)은 그대로 동작한다.
 *
 * 현재 소스: github.com/sovorovvang-cyber/kiki (SKT 디자인 시스템).
 */

export interface CatalogSource {
	/** 출처 식별자. provenance(lock) 기록과 카탈로그 네임스페이스에 쓰인다. */
	id: string;
	/** 동기화할 git 리포 URL. */
	repo: string;
	/** 고정할 ref — 브랜치/태그/커밋. "main"이면 main 최신을 추종. */
	ref: string;
	/** 리포 내부에서 디자인 시스템이 들어 있는 서브 디렉토리. */
	subpath: string;
	/** subpath 기준, "유효한 export 표면"을 정의하는 barrel 경로. */
	barrel: string;
}

export const CATALOG_SOURCE: CatalogSource = {
	id: "kiki",
	repo: "https://github.com/sovorovvang-cyber/kiki.git",
	ref: "main",
	subpath: "design-system",
	barrel: "src/index.ts",
};

/** vendored 결과물이 들어갈 격리 패키지 디렉토리 (레포 루트 기준). */
export const EXTERNAL_PKG_DIR = "packages/external";

/**
 * design-system/src 안에서 "라이브러리 알맹이"가 아니라 "앱/스토리 하네스"라
 * 동기화 대상에서 제외할 파일·디렉토리 (subpath/src 기준 상대 경로).
 */
export const HARNESS_EXCLUDES: readonly string[] = [
	"App.tsx",
	"App.css",
	"main.tsx",
	"index.css",
	"index.html",
	"vite-env.d.ts",
	"Introduction.mdx",
	"stories",
];
