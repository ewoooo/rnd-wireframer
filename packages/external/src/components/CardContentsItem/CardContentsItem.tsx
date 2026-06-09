import defaultThumb from '../ThumbnailItem/assets/thumbnail-default.png';
import styles from './CardContentsItem.module.css';

type CardType = 'list' | 'barcode' | 'ai';

interface CardContentsItemProps {
  type?: CardType;
  imageSrc?: string;
  title?: string;
  subtitle?: string;
  daysLeft?: string;
  buttonLabel?: string;
  aiText?: string;
  barcodeNumbers?: [string, string, string, string];
  barcodeTime?: string;
}

// ── AI 타입 아이콘 — Figma 실제 SVG 경로, gradient #3617CE → #9A85FF ─────────
function AiSparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.9688 10.334C12.0824 10.0984 12.4175 10.0985 12.5312 10.334L12.874 11.0439C12.9969 11.2985 13.2024 11.5042 13.457 11.627L14.166 11.9688C14.4017 12.0824 14.4017 12.4176 14.166 12.5312L13.457 12.874C13.2023 12.9968 12.9968 13.2023 12.874 13.457L12.5312 14.166C12.4176 14.4017 12.0824 14.4017 11.9688 14.166L11.627 13.457C11.5042 13.2024 11.2985 12.9969 11.0439 12.874L10.334 12.5312C10.0985 12.4175 10.0984 12.0824 10.334 11.9688L11.0439 11.627C11.2985 11.5042 11.5042 11.2985 11.627 11.0439L11.9688 10.334ZM7.3125 2.79297C7.53986 2.32168 8.21123 2.32156 8.43848 2.79297L9.81348 5.64551C9.87488 5.7728 9.97719 5.87611 10.1045 5.9375L12.957 7.3125C13.4285 7.53978 13.4285 8.2112 12.957 8.43848L10.1045 9.81348C9.97739 9.87485 9.87485 9.97739 9.81348 10.1045L8.43848 12.957C8.2112 13.4285 7.53978 13.4285 7.3125 12.957L5.9375 10.1045C5.87611 9.97719 5.7728 9.87488 5.64551 9.81348L2.79297 8.43848C2.32156 8.21123 2.32168 7.53986 2.79297 7.3125L5.64551 5.9375C5.77289 5.87609 5.87609 5.77289 5.9375 5.64551L7.3125 2.79297Z"
        fill="url(#aiGradient)"
      />
      <defs>
        <linearGradient id="aiGradient" x1="2.44" y1="2.44" x2="14.34" y2="14.34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3617CE" />
          <stop offset="1" stopColor="#9A85FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Barcode: 실제 Figma 벡터 데이터 기반 SVG ──────────────────────────────────
// 각 bar: [x, width] — 어두운 바만 (#05001a), 흰 배경에 렌더링
const BARCODE_DARK_BARS: [number, number][] = [
  [0, 3.5], [3, 1.6], [5, 1.6], [9, 7.1], [18, 2], [25, 7.1],
  [34, 3.7], [41, 2], [45, 1.6], [49, 2], [54, 7], [63, 3.7],
  [68, 1.6], [72, 7.1], [81, 1.6], [88, 6.9], [97, 3.9],
  [104, 1.6], [108, 2], [113, 1.6], [117, 7.1], [126, 3.7],
  [131, 2], [135, 7.1], [144, 2], [151, 7.1], [160, 3.7],
  [167, 2], [171, 1.6], [175, 2], [180, 7.1], [189, 3.7],
  [194, 1.6], [197, 7.2], [207, 2], [214, 7.1], [223, 3.9],
  [230, 1.6], [234, 2], [238, 2], [243, 7], [252, 3.7],
  [257, 2], [261, 7], [270, 1.6], [277, 7.1], [286, 3.7],
  [293, 2], [297, 2], [302, 1.6], [306, 6.7],
];

function BarcodeDisplay({
  numbers = ['1234', '4561', '1506', '4932'],
  time = '19:58',
}: {
  numbers?: [string, string, string, string];
  time?: string;
}) {
  return (
    <div className={styles.barcodeWrap}>
      {/* 바코드 SVG — 313×48 실제 벡터 데이터 */}
      <svg
        width="313"
        height="48"
        viewBox="0 0 313 48"
        fill="none"
        className={styles.barcodeSvg}
      >
        {BARCODE_DARK_BARS.map(([x, w], i) => (
          <rect key={i} x={x} y={0} width={w} height={48} fill="#05001a" />
        ))}
      </svg>
      {/* 바코드 번호 + 시간 */}
      <div className={styles.barcodeNumRow}>
        <div className={styles.barcodeNums}>
          {numbers.map((n) => (
            <span key={n} className={styles.barcodeNum}>{n}</span>
          ))}
        </div>
        <span className={styles.barcodeTime}>{time}</span>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
export function CardContentsItem({
  type = 'list',
  imageSrc,
  title = '왕과 사는 남자',
  subtitle = 'VVIP CGV 1인 무료 이용',
  daysLeft = 'D-2',
  buttonLabel = '버튼',
  aiText = 'T 멤버십 사용 가능 포인트 65,300P',
  barcodeNumbers = ['1234', '4561', '1506', '4932'],
  barcodeTime = '19:58',
}: CardContentsItemProps) {
  // ── Type=Barcode ──
  if (type === 'barcode') {
    return <BarcodeDisplay numbers={barcodeNumbers} time={barcodeTime} />;
  }

  // ── Type=ai ──
  if (type === 'ai') {
    return (
      <div className={styles.aiRow}>
        <span className={styles.aiIconWrap}>
          <AiSparkleIcon />
        </span>
        <span className={styles.aiText}>{aiText}</span>
      </div>
    );
  }

  // ── Type=List ──
  return (
    <div className={styles.listRow}>
      {/* Info: ThumbnailItem + Text */}
      <div className={styles.listInfo}>
        <div className={styles.listThumbnail}>
          <img src={imageSrc ?? defaultThumb} alt={title} className={styles.listImg} />
        </div>
        <div className={styles.listText}>
          <span className={styles.listTitle}>{title}</span>
          <div className={styles.listSubRow}>
            <span className={styles.listSub}>{subtitle}</span>
            <span className={styles.dotSep} />
            <span className={styles.listSub}>{daysLeft}</span>
          </div>
        </div>
      </div>
      {/* Button: pill, #E2E6F1, pad 6/12 */}
      <button className={styles.listButton}>{buttonLabel}</button>
    </div>
  );
}
