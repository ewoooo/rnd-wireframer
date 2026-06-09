import type { ReactNode } from 'react';
import styles from './PagestackItemDefault.module.css';

interface PagestackItemDefaultProps {
  children?: ReactNode;
}

export function PagestackItemDefault({ children }: PagestackItemDefaultProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.slot}>
        {children}
      </div>
    </div>
  );
}
