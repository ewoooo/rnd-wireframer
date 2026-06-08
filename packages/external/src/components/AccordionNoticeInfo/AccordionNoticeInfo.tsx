import type { ReactNode } from 'react';
import styles from './AccordionNoticeInfo.module.css';
import chevronSvg from './assets/chevron.svg';

interface AccordionNoticeInfoProps {
  title?: string;
  showQLabel?: boolean;
  state?: 'Close' | 'Open';
  children?: ReactNode;
}

export function AccordionNoticeInfo({
  title = 'Title Text',
  showQLabel = true,
  state = 'Close',
  children,
}: AccordionNoticeInfoProps) {
  const isOpen = state === 'Open';

  return (
    <div className={`${styles.wrap} ${isOpen ? styles.wrapOpen : ''}`}>
      <div className={styles.title}>
        <div className={styles.titleText}>
          {showQLabel && <span className={styles.qLabel}>Q.</span>}
          <span className={styles.titleLabel}>{title}</span>
        </div>
        <div className={styles.chevronWrap}>
          <img
            src={chevronSvg}
            alt=""
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className={styles.slot}>
          {children ?? (
            <>
              <div className={styles.listText}>
                <span className={styles.listTitle}>타이틀 레이블</span>
              </div>
              <div className={styles.listText}>
                <ul className={styles.listBody}>
                  <li>본문</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
