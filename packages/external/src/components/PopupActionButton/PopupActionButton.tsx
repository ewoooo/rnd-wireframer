import styles from './PopupActionButton.module.css';

interface PopupActionButtonProps {
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}

export function PopupActionButton({ primaryLabel, secondaryLabel, onPrimary, onSecondary }: PopupActionButtonProps) {
  const hasTwoButtons = Boolean(secondaryLabel);

  return (
    <div className={`${styles.container} ${hasTwoButtons ? styles.twoButton : styles.oneButton}`}>
      {hasTwoButtons && (
        <button className={styles.secondary} onClick={onSecondary}>
          {secondaryLabel}
        </button>
      )}
      <button className={`${styles.btn} ${hasTwoButtons ? styles.primaryHalf : styles.primaryFull}`} onClick={onPrimary}>
        {primaryLabel}
      </button>
    </div>
  );
}
