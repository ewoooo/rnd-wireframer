import type { ReactNode } from 'react';
import styles from './PagestackItemCard.module.css';

interface PagestackItemCardProps {
  children?: ReactNode;
}

export function PagestackItemCard({ children }: PagestackItemCardProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.slot}>
        {children}
      </div>
    </div>
  );
}
