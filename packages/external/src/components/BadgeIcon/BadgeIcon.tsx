import type { ReactNode } from 'react';
import styles from './BadgeIcon.module.css';

interface BadgeIconProps {
  icon: ReactNode;
  label: string;
  subLabel?: string;
}

export function BadgeIcon({ icon, label, subLabel }: BadgeIconProps) {
  return (
    <div className={styles.badge}>
      <div className={styles.main}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </div>
      {subLabel && <span className={styles.subLabel}>{subLabel}</span>}
    </div>
  );
}
