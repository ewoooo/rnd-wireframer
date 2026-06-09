import styles from './ActionButton.module.css';
import { LeftItem } from '../LeftItem/LeftItem';
import { TextButton } from '../TextButton/TextButton';

/* ── 아이콘 (LeftItem과 동일한 SVG) ─────────────────────────────────────── */
function AiIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.3129 13.3179C15.4518 13.0298 15.8625 13.0298 16.0013 13.3179L16.4193 14.1851C16.5694 14.4963 16.8209 14.7479 17.1322 14.898L17.9984 15.316C18.2865 15.4549 18.2865 15.8646 17.9984 16.0035L17.1322 16.4214C16.8209 16.5715 16.5694 16.823 16.4193 17.1343L16.0013 18.0015C15.8625 18.2896 15.4518 18.2896 15.3129 18.0015L14.8949 17.1343C14.7448 16.823 14.4934 16.5715 14.182 16.4214L13.3148 16.0035C13.0272 15.8645 13.0272 15.455 13.3148 15.316L14.182 14.898C14.4933 14.7479 14.7448 14.4964 14.8949 14.1851L15.3129 13.3179ZM9.62244 4.10014C9.90022 3.52391 10.7206 3.52391 10.9984 4.10014L12.6791 7.58647C12.7541 7.74207 12.8799 7.86788 13.0355 7.94291L16.5219 9.62358C17.0981 9.90136 17.0981 10.7218 16.5219 10.9996L13.0355 12.6802C12.88 12.7553 12.7541 12.8811 12.6791 13.0367L10.9984 16.523C10.7205 17.0989 9.90023 17.099 9.62244 16.523L7.94177 13.0367C7.86672 12.881 7.74102 12.7553 7.58533 12.6802L4.099 10.9996C3.52292 10.7218 3.52306 9.90148 4.099 9.62358L7.58533 7.94291C7.74092 7.86791 7.8667 7.74202 7.94177 7.58647L9.62244 4.10014Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="ab-gift-mask-1" fill="white">
        <path d="M4 11H18V17C18 17.5523 17.5523 18 17 18H5C4.44772 18 4 17.5523 4 17V11Z" />
      </mask>
      <path d="M4 11H18V17C18 17.5523 17.5523 18 17 18H5C4.44772 18 4 17.5523 4 17V11Z" fill="currentColor" stroke="currentColor" strokeWidth="2.44444" mask="url(#ab-gift-mask-1)" />
      <mask id="ab-gift-mask-2" fill="white">
        <path d="M3 8C3 7.44772 3.44772 7 4 7H18C18.5523 7 19 7.44772 19 8V10H3V8Z" />
      </mask>
      <path d="M3 8C3 7.44772 3.44772 7 4 7H18C18.5523 7 19 7.44772 19 8V10H3V8Z" fill="currentColor" stroke="currentColor" strokeWidth="2.44444" mask="url(#ab-gift-mask-2)" />
      <path d="M13.5078 3.41597C14.2187 3.07907 15.1549 2.88406 15.9639 3.07515C16.3816 3.17385 16.7801 3.37984 17.0693 3.73531C17.3575 4.08954 17.4999 4.54529 17.5 5.08003C17.5 6.33089 16.3853 7.0543 15.2285 7.44527C14.1142 7.82179 12.7347 7.9759 11.498 7.99507L11.5 7.99995H10.5L10.501 7.99507C9.26453 7.97583 7.88549 7.82169 6.77148 7.44527C5.61467 7.0543 4.5 6.33089 4.5 5.08003C4.50008 4.54529 4.64248 4.08954 4.93066 3.73531C5.21989 3.37984 5.6184 3.17385 6.03613 3.07515C6.84508 2.88406 7.78129 3.07907 8.49219 3.41597C9.26411 3.78181 9.87904 4.47957 10.333 5.18648C10.5986 5.60015 10.8226 6.03926 11 6.45991C11.1774 6.03926 11.4014 5.60015 11.667 5.18648C12.121 4.47957 12.7359 3.78181 13.5078 3.41597ZM7.97266 4.35249C7.4198 4.09057 6.77465 3.98703 6.31836 4.09468C6.10359 4.14541 5.94708 4.23764 5.84082 4.36812C5.73368 4.49984 5.63973 4.7178 5.63965 5.08003C5.63965 5.62336 6.10624 6.09787 7.16309 6.45503C7.96865 6.72722 8.97915 6.87508 9.97363 6.92574C9.81337 6.53203 9.60471 6.11324 9.35449 5.72359C8.9445 5.08519 8.46496 4.58581 7.97266 4.35249ZM15.6816 4.09468C15.2253 3.98703 14.5802 4.09057 14.0273 4.35249C13.535 4.58581 13.0555 5.08519 12.6455 5.72359C12.3953 6.11324 12.1866 6.53203 12.0264 6.92574C13.0209 6.87508 14.0313 6.72722 14.8369 6.45503C15.8938 6.09787 16.3604 5.62336 16.3604 5.08003C16.3603 4.7178 16.2663 4.49984 16.1592 4.36812C16.0529 4.23764 15.8964 4.14541 15.6816 4.09468Z" fill="currentColor" />
    </svg>
  );
}

/* ── 툴팁 ─────────────────────────────────────────────────────────────────── */
interface TooltipProps {
  text: string;
  left: number;
  tailAlign?: 'start' | 'center';
}

function Tooltip({ text, left, tailAlign = 'start' }: TooltipProps) {
  return (
    <div className={styles.tooltip} style={{ left }}>
      <div className={styles.tooltipBubble}>
        <span className={styles.tooltipText}>{text}</span>
      </div>
      <div className={styles.tooltipTailWrap} style={{ justifyContent: tailAlign === 'center' ? 'center' : 'flex-start' }}>
        <svg width="11" height="5" viewBox="0 0 11 5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.5 5L0 0H11L5.5 5Z" fill="white" />
        </svg>
      </div>
    </div>
  );
}

/* ── Props ───────────────────────────────────────────────────────────────── */
export interface ActionButtonProps {
  type?: 'Default' | 'Ai' | 'Gift';
  button?: '1' | '2';
  showText?: boolean;
  showTooltip?: boolean;
  // Ai+2: 상단 텍스트
  topText?: string;
  // Ai+2 / Gift+1: 버튼 내 좌/우 텍스트
  leftText?: string;
  rightText?: string;
  // Ai+1: 버튼 텍스트
  buttonText?: string;
  // Default+1: 버튼 텍스트
  primaryText?: string;
  // Default+2: 좌(회색) / 우(파란) 버튼 텍스트
  secondaryText?: string;
  // Default+2: 가격 영역
  priceLabel?: string;
  period?: string;
  price?: string;
  // 툴팁 텍스트
  tooltipText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  onAiClick?: () => void;
  onGiftClick?: () => void;
}

/* ── 컴포넌트 ────────────────────────────────────────────────────────────── */
export function ActionButton({
  type = 'Ai',
  button = '2',
  showText = true,
  showTooltip = true,
  topText = '텍스트',
  leftText = '텍스트',
  rightText = '텍스트',
  buttonText = '맞춤 옵션 바로 선택하기',
  primaryText = '버튼',
  secondaryText = '버튼',
  priceLabel = '이용 금액',
  period = '1개월/',
  price = '7,900원',
  tooltipText,
  onPrimaryClick,
  onSecondaryClick,
  onAiClick,
  onGiftClick,
}: ActionButtonProps) {
  const isAi2 = type === 'Ai' && button === '2';
  const isAi1 = type === 'Ai' && button === '1';
  const isDefault1 = type === 'Default' && button === '1';
  const isDefault2 = type === 'Default' && button === '2';
  const isGift1 = type === 'Gift' && button === '1';

  return (
    <div className={styles.wrap}>

      {/* ── Ai + button=2 ────────────────────────────────────────────────── */}
      {isAi2 && showText && (
        <div className={styles.topRow}>
          <span className={styles.topLabel}>{topText}</span>
        </div>
      )}
      {isAi2 && (
        <div className={styles.btnPrimary}>
          <div className={styles.iconArea}>
            <span className={styles.iconColor}><AiIcon /></span>
          </div>
          {/* TextButton type="double" 활용 */}
          <TextButton
            type="double"
            leftLabel={leftText}
            rightLabel={rightText}
            color="#ffffff"
            onLeftClick={onAiClick}
            onRightClick={onPrimaryClick}
          />
        </div>
      )}

      {/* ── Ai + button=1 ────────────────────────────────────────────────── */}
      {isAi1 && showTooltip && (
        <Tooltip
          text={tooltipText ?? '56만원의 T 안심보상가 적용이 대기 중이에요!'}
          left={29}
          tailAlign="start"
        />
      )}
      {isAi1 && (
        <div className={styles.btnPrimary} style={{ justifyContent: 'space-between' }}>
          {/* LeftItem 활용 — Ai 아이콘 + 구분선 */}
          <LeftItem type="ai" color="#ffffff" onAiClick={onAiClick} />
          {/* TextButton type="single" 활용 */}
          <TextButton type="single" label={buttonText} color="#ffffff" onClick={onPrimaryClick} />
        </div>
      )}

      {/* ── Default + button=1 ───────────────────────────────────────────── */}
      {isDefault1 && (
        <div className={styles.btnPrimary} style={{ justifyContent: 'center' }}>
          {/* TextButton type="single" 활용 */}
          <TextButton type="single" label={primaryText} color="#ffffff" onClick={onPrimaryClick} />
        </div>
      )}

      {/* ── Default + button=2 ───────────────────────────────────────────── */}
      {isDefault2 && showText && (
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>{priceLabel}</span>
          <div className={styles.priceRight}>
            <span className={styles.period}>{period}</span>
            <span className={styles.price}>{price}</span>
          </div>
        </div>
      )}
      {isDefault2 && (
        <div className={styles.btnGroup}>
          <button className={styles.btnSecondary} onClick={onSecondaryClick}>
            {secondaryText}
          </button>
          <button className={styles.btnPrimaryBlock} onClick={onPrimaryClick}>
            {primaryText}
          </button>
        </div>
      )}

      {/* ── Gift + button=1 ──────────────────────────────────────────────── */}
      {isGift1 && showTooltip && (
        <Tooltip
          text={tooltipText ?? '선물가 14,900원'}
          left={169}
          tailAlign="center"
        />
      )}
      {isGift1 && (
        <div className={styles.btnPrimary} style={{ justifyContent: 'space-between' }}>
          <div className={styles.iconArea}>
            <span className={styles.iconColor}><GiftIcon /></span>
          </div>
          {/* TextButton type="double" 활용 */}
          <TextButton
            type="double"
            leftLabel={leftText === '텍스트' ? '선물하기' : leftText}
            rightLabel={rightText === '텍스트' ? '구독하기' : rightText}
            color="#ffffff"
            onLeftClick={onGiftClick}
            onRightClick={onPrimaryClick}
          />
        </div>
      )}

    </div>
  );
}
