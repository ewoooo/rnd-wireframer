import styles from './Spacing.module.css';

type SpacingSize = 2 | 4 | 8 | 12 | 16 | 20 | 24 | 28;

interface SpacingProps {
  size?: SpacingSize;
}

export function Spacing({ size = 2 }: SpacingProps) {
  return (
    <div className={styles.wrap} style={{ height: size }} />
  );
}
