// [KIKI-SHIM] 임시 — kiki 빌드 제공 시 삭제(빌드물이 .d.ts 제공). 제거 가이드: packages/external/KIKI-SHIM.md
// AUTO-GENERATED — kiki는 Vite 기반이므로 이미지 import를 string으로 선언
declare module "*.png" { const src: string; export default src; }
declare module "*.jpg" { const src: string; export default src; }
declare module "*.jpeg" { const src: string; export default src; }
declare module "*.svg" { const src: string; export default src; }
declare module "*.webp" { const src: string; export default src; }
