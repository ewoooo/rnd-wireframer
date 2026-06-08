import { ButtonListOrder } from '../ButtonListOrder/ButtonListOrder';
import styles from './TitleSectionRightItem.module.css';

/* Figma: .TitleSectionRightItem — Type=Icon|TextButton|TextItemButton|ButtonListOrder|Text */
type TitleSectionRightItemType = 'icon' | 'textButton' | 'textItemButton' | 'buttonListOrder' | 'text';

interface TitleSectionRightItemProps {
  type: TitleSectionRightItemType;
  label?: string;
  subText?: string;
  highlight?: string;
  onClick?: () => void;
}

/* Figma: Union chevron — base shape points LEFT, rotate(90deg) = UP (Figma rotate-90) */
function ChevronIcon({ color = '#05001A', direction = 'up' }: { color?: string; direction?: 'up' | 'left' }) {
  const rotation = direction === 'up' ? 'rotate(90deg)' : 'none';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transform: rotation }}>
      <path
        transform="translate(5, 2.67)"
        d="M 4.861948903791567 0.1952626020320972 C 5.122299246515091 -0.06508754725620605 5.54431076533475 -0.06508754725620605 5.804661108058274 0.1952626020320972 C 6.0649616608307495 0.45561674484076475 6.064995218383551 0.8776398175628302 5.804661108058274 1.137973138434474 L 1.6093312223890741 5.333295345334847 L 5.804661108058274 9.528617472762177 C 6.064961740303936 9.788971397019978 6.064995297856737 10.210994886975516 5.804661108058274 10.471327969428033 C 5.5443275540452985 10.731661687664888 5.122303299647578 10.731628130172872 4.861948903791567 10.471327969428033 L 0.195262955725608 5.804650593667775 C -0.06508766515406703 5.544300722535119 -0.06508766515406703 5.1222899681345755 0.195262955725608 4.861940097001919 L 4.861948903791567 0.1952626020320972 Z"
        fill={color}
      />
    </svg>
  );
}

export function TitleSectionRightItem({
  type,
  label = '텍스트',
  subText = '선택한 휴대폰 번호',
  highlight = '3개',
  onClick,
}: TitleSectionRightItemProps) {
  if (type === 'icon') {
    return (
      <button className={styles.iconBtn} onClick={onClick} aria-label="더보기">
        <ChevronIcon />
      </button>
    );
  }

  if (type === 'textButton') {
    return (
      <button className={styles.textBtn} onClick={onClick}>
        {label}
      </button>
    );
  }

  if (type === 'textItemButton') {
    return (
      <button className={styles.textItemBtn} onClick={onClick}>
        {subText && <span className={styles.subText}>{subText}</span>}
        {highlight && <span className={styles.highlight}>{highlight}</span>}
        <ChevronIcon color="#05001A" />
      </button>
    );
  }

  if (type === 'buttonListOrder') {
    return <ButtonListOrder label={label} onClick={onClick} />;
  }

  // type === 'text'
  return <span className={styles.text}>{label}</span>;
}
