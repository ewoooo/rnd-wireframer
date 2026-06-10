import type { ReactNode } from 'react';
import styles from './Pagestack.module.css';
import { TitleSection } from '../TitleSection/TitleSection';

interface PagestackProps {
  title?: string;
  showTitle?: boolean;
  children?: ReactNode;
}

export function Pagestack({
  title = '타이틀',
  showTitle = true,
  children,
}: PagestackProps) {
  return (
    <div className={styles.wrap}>
      {showTitle && (
        <div className={styles.contentsTitle}>
          <TitleSection
            title={title}
            showSubtitle={false}
            showCount={false}
            showChevron={false}
          />
        </div>
      )}
      <div className={styles.contentsSlot}>
        {children}
      </div>
    </div>
  );
}
