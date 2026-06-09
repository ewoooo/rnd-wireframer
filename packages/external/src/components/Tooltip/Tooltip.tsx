import styles from './Tooltip.module.css';

type TailPosition = 'left' | 'center' | 'right';

interface TooltipProps {
  label: string;
  tailPosition?: TailPosition;
}

export function Tooltip({ label, tailPosition = 'center' }: TooltipProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.bubble}>{label}</div>
      <div className={`${styles.tail} ${styles[tailPosition]}`} />
    </div>
  );
}
