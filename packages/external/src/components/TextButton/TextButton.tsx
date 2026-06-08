import styles from './TextButton.module.css';

interface TextButtonSingleProps {
  type?: 'single';
  label: string;
  color?: string;
  onClick?: () => void;
}

interface TextButtonDoubleProps {
  type: 'double';
  leftLabel: string;
  rightLabel: string;
  color?: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
}

type TextButtonProps = TextButtonSingleProps | TextButtonDoubleProps;

export function TextButton(props: TextButtonProps) {
  const { color = '#ffffff' } = props;

  if (props.type === 'double') {
    return (
      <div className={styles.row} style={{ color }}>
        <button className={styles.btn} onClick={props.onLeftClick}>
          {props.leftLabel}
        </button>
        <div className={styles.divider} />
        <button className={styles.btn} onClick={props.onRightClick}>
          {props.rightLabel}
        </button>
      </div>
    );
  }

  return (
    <button
      className={styles.btn}
      style={{ color }}
      onClick={(props as TextButtonSingleProps).onClick}
    >
      {props.label}
    </button>
  );
}
