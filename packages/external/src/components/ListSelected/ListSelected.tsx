import { RadioText } from '../Radio/Radio';
import { CheckboxText } from '../Checkbox/Checkbox';
import { ListSelectedRightItem } from '../ListSelectedRightItem/ListSelectedRightItem';
import styles from './ListSelected.module.css';

interface ListSelectedProps {
  type?: 'radio' | 'checkbox';
  label?: string;
  price?: string;
  buttonLabel?: string;
  checked?: boolean;
  showPrice?: boolean;
  showButton?: boolean;
  onChange?: (checked: boolean) => void;
  onButtonClick?: () => void;
}

export function ListSelected({
  type = 'radio',
  label = '텍스트',
  price = '-9,900원',
  buttonLabel = '받기',
  checked = false,
  showPrice = true,
  showButton = true,
  onChange,
  onButtonClick,
}: ListSelectedProps) {
  return (
    <div className={styles.row}>
      <div className={styles.left}>
        {type === 'radio' ? (
          <RadioText label={label} checked={checked} onChange={onChange} />
        ) : (
          <CheckboxText label={label} checked={checked} onChange={onChange} />
        )}
      </div>
      {showPrice && <span className={styles.price}>{price}</span>}
      {showButton && (
        <ListSelectedRightItem
          type="buttonXsmallSolid"
          label={buttonLabel}
          onClick={onButtonClick}
        />
      )}
    </div>
  );
}
