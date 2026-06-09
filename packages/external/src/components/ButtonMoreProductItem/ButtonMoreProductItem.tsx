import type { ReactNode } from 'react';
import styles from './ButtonMoreProductItem.module.css';

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 3L11 8L6 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ButtonMoreProductItemProps {
  label: string;
  logo?: ReactNode;
  logoColor?: string;
  onClick?: () => void;
}

export function ButtonMoreProductItem({
  label,
  logo,
  logoColor = '#dad2ff',
  onClick,
}: ButtonMoreProductItemProps) {
  return (
    <button className={styles.btn} onClick={onClick}>
      <div className={styles.info}>
        <div className={styles.logo} style={{ background: logoColor }}>
          {logo}
        </div>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.arrow}>
        <ChevronRightIcon />
      </div>
    </button>
  );
}
