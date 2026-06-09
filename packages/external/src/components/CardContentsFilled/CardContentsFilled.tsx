import type { ReactNode } from 'react';
import styles from './CardContentsFilled.module.css';
import chevronSvg from './assets/chevron.svg';

interface CardContentsFilledProps {
  title?: string;
  children?: ReactNode;
}

export function CardContentsFilled({
  title = '타이틀',
  children,
}: CardContentsFilledProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.slot}>
        <div className={styles.titleRow}>
          <span className={styles.titleText}>{title}</span>
          <div className={styles.chevronWrap}>
            <img src={chevronSvg} alt="" className={styles.chevron} />
          </div>
        </div>
        <div className={styles.spacing8} />
        {children ?? <DefaultRows />}
      </div>
    </div>
  );
}

function DefaultRows() {
  const rows = [
    { label: '타이틀 레이블', value: '-3,000원' },
    { label: '타이틀 레이블', value: '-3,000원' },
    { label: '타이틀 레이블', value: '-3,000원' },
  ];
  return (
    <>
      {rows.map((row, i) => (
        <div key={i}>
          {i > 0 && <div className={styles.spacing2} />}
          <div className={styles.listRow}>
            <span className={styles.rowLabel}>{row.label}</span>
            <span className={styles.rowValue}>{row.value}</span>
          </div>
        </div>
      ))}
    </>
  );
}
