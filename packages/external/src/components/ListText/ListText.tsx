import styles from './ListText.module.css';

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 4L10 8L6 12"
        stroke="#05001A"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Figma variants:
   off         — title (flex-1, truncate) + chevron
   on          — title (85px) + subText (gray-alpha-600, right)
   dot         — bullet body + chevron
   firstTitle  — large bold title (16px) + price (brand primary)
   secondTitle — bold title (14px) + chevron
*/
export type ListTextTable = 'off' | 'on' | 'dot' | 'firstTitle' | 'secondTitle';

interface ListTextProps {
  table?: ListTextTable;
  title?: string;
  subText?: string;
  price?: string;
  showRightItem?: boolean;
  onClick?: () => void;
}

export function ListText({
  table = 'off',
  title = '타이틀 레이블',
  subText = '본문',
  price = '999,999원',
  showRightItem = true,
  onClick,
}: ListTextProps) {
  const containerClass = [
    styles.row,
    styles[table] ?? '',
    ['firstTitle', 'secondTitle'].includes(table) ? styles.alignStart : styles.alignCenter,
  ].filter(Boolean).join(' ');

  if (table === 'off') {
    return (
      <div className={containerClass} onClick={onClick} role={onClick ? 'button' : undefined}>
        <div className={styles.leftItem}>
          <span className={styles.titleEllipsis}>{title}</span>
        </div>
        {showRightItem && (
          <div className={styles.rightItem}>
            <ChevronIcon />
          </div>
        )}
      </div>
    );
  }

  if (table === 'on') {
    return (
      <div className={containerClass}>
        <span className={styles.titleFixed}>{title}</span>
        {showRightItem && <span className={styles.subTextRight}>{subText}</span>}
      </div>
    );
  }

  if (table === 'dot') {
    return (
      <div className={containerClass} onClick={onClick} role={onClick ? 'button' : undefined}>
        <div className={styles.leftItem}>
          <ul className={styles.dotList}>
            <li>{subText}</li>
          </ul>
        </div>
        {showRightItem && (
          <div className={styles.rightItem}>
            <ChevronIcon />
          </div>
        )}
      </div>
    );
  }

  if (table === 'firstTitle') {
    return (
      <div className={containerClass}>
        <span className={styles.titleLarge}>{title}</span>
        {showRightItem && (
          <div className={styles.rightItem}>
            <span className={styles.priceText}>{price}</span>
          </div>
        )}
      </div>
    );
  }

  // secondTitle
  return (
    <div className={containerClass} onClick={onClick} role={onClick ? 'button' : undefined}>
      <span className={styles.titleMedium}>{title}</span>
      {showRightItem && (
        <div className={styles.rightItem}>
          <ChevronIcon />
        </div>
      )}
    </div>
  );
}
