import styles from './TitleBottomSheet.module.css';

interface TitleBottomSheetProps {
  title: string;
  subText?: string;
  subTextHighlight?: string;
  onClose?: () => void;
}

export function TitleBottomSheet({ title, subText, subTextHighlight, onClose }: TitleBottomSheetProps) {
  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <span className={styles.title}>{title}</span>
        <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18.29 4.29094C18.6805 3.90042 19.3135 3.90042 19.704 4.29094C20.0945 4.68147 20.0945 5.3145 19.704 5.705L13.4101 11.9989L19.706 18.2948C20.0965 18.6854 20.0965 19.3184 19.706 19.7089C19.3155 20.0994 18.6824 20.0994 18.2919 19.7089L11.996 13.413L5.70989 19.6991C5.31939 20.0896 4.68635 20.0896 4.29582 19.6991C3.9053 19.3086 3.9053 18.6756 4.29582 18.2851L10.582 11.9989L4.29778 5.71477C3.90725 5.32424 3.90725 4.69123 4.29778 4.30071C4.6883 3.91018 5.32131 3.91018 5.71184 4.30071L11.996 10.5849L18.29 4.29094Z" fill="#05001A"/>
          </svg>
        </button>
      </div>
      {(subText || subTextHighlight) && (
        <div className={styles.subTextRow}>
          {subText && <span className={styles.subText}>{subText}</span>}
          {subTextHighlight && <span className={styles.subTextHighlight}>{subTextHighlight}</span>}
        </div>
      )}
    </div>
  );
}
