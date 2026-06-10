import type { ReactNode } from 'react';
import styles from './AccordionPriceInfo.module.css';
import chevronSvg from './assets/chevron.svg';
import infoIconSvg from './assets/info-icon.svg';
import checkboxCheckedSvg from './assets/checkbox-checked.svg';
import checkboxUncheckedSvg from './assets/checkbox-unchecked.svg';
import arrowDownSvg from './assets/arrow-down.svg';

interface AccordionPriceInfoProps {
  states?: 'Default' | 'Open';
  type?: 'SelectedList' | 'TextList';
  // SelectedList header
  discountPercent?: string;
  price?: string;
  priceLabel?: string;
  // TextList header
  title?: string;
  rightText?: string;
  children?: ReactNode;
}

export function AccordionPriceInfo({
  states = 'Default',
  type = 'SelectedList',
  discountPercent = '66%',
  price = '6,086원',
  priceLabel = '최대 할인 구독가',
  title = '배송 정보',
  rightText = '배송비 3,000원',
  children,
}: AccordionPriceInfoProps) {
  const isOpen = states === 'Open';
  const isSelectedList = type === 'SelectedList';

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        {isSelectedList ? (
          <div className={styles.priceText}>
            <span className={styles.percent}>{discountPercent}</span>
            <span className={styles.price}>{price}</span>
          </div>
        ) : (
          <span className={styles.titleText}>{title}</span>
        )}

        <div className={styles.headerRight}>
          {isSelectedList && (
            <img src={infoIconSvg} alt="" className={styles.infoIcon} />
          )}
          <span className={styles.priceLabel}>
            {isSelectedList ? priceLabel : rightText}
          </span>
          <div className={styles.chevronWrap}>
            <img
              src={chevronSvg}
              alt=""
              className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
            />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className={styles.slot}>
          {children ?? (
            isSelectedList
              ? <SelectedListContent />
              : <TextListContent />
          )}
        </div>
      )}
    </div>
  );
}

function SelectedListContent() {
  return (
    <>
      <div className={styles.spacing} />
      <div className={styles.divider} />
      <div className={styles.spacing} />

      <p className={styles.sectionTitle}>쿠폰 할인</p>
      <div className={styles.listRow}>
        <div className={styles.checkboxText}>
          <img src={checkboxCheckedSvg} alt="선택됨" className={styles.checkbox} />
          <span className={styles.itemLabel}>티빙 109요금제 계열</span>
        </div>
        <span className={styles.itemPrice}>-9,900원</span>
        <button className={styles.btnReceive}>
          <span className={styles.btnReceiveText}>받기</span>
          <img src={arrowDownSvg} alt="" className={styles.btnReceiveIcon} />
        </button>
      </div>
      <div className={styles.listRow}>
        <div className={styles.checkboxText}>
          <img src={checkboxUncheckedSvg} alt="미선택" className={styles.checkbox} />
          <span className={styles.itemLabel}>티빙 109요금제 계열</span>
        </div>
        <span className={styles.itemPrice}>-9,900원</span>
        <div className={styles.btnOwned}>
          <span className={styles.btnOwnedText}>보유중</span>
        </div>
      </div>

      <div className={styles.spacing} />
      <div className={styles.divider} />
      <div className={styles.spacing} />

      <p className={styles.sectionTitle}>SKT 할인</p>
      {(['티빙 109요금제 계열', '티빙 109요금제 계열', '티빙 109요금제 계열'] as const).map((label, i) => (
        <div key={i} className={`${styles.listRow} ${styles.checkboxTextTop}`}>
          <div className={styles.checkboxText}>
            <img src={checkboxUncheckedSvg} alt="미선택" className={styles.checkbox} />
            <span className={styles.itemLabel}>{label}</span>
          </div>
          <span className={styles.itemPrice}>-9,900원</span>
        </div>
      ))}
    </>
  );
}

function TextListContent() {
  return (
    <>
      <div className={styles.spacing} />
      <div className={styles.divider} />
      <div className={styles.spacing} />

      <p className={styles.sectionTitle}>배송 관련 정보</p>
      {([
        ['배송비', '-3,000원'],
        ['배송 방법', '한진택배'],
        ['배송 예정일', '판매자가 지정한 날짜에 발송'],
        ['도서/산간 배송 여부', '배송 불가'],
      ] as const).map(([key, val]) => (
        <div key={key} className={styles.textRow}>
          <span className={styles.textRowKey}>{key}</span>
          <span className={styles.textRowVal}>{val}</span>
        </div>
      ))}

      <div className={styles.spacing} />
      <div className={styles.divider} />
      <div className={styles.spacing} />

      <p className={styles.sectionTitle}>기타 지역 추가 배송비</p>
      {([
        ['제주 지역', '+3,000원'],
        ['도서/산간 지역', '+5,500원'],
      ] as const).map(([key, val]) => (
        <div key={key} className={styles.textRow}>
          <span className={styles.textRowKey}>{key}</span>
          <span className={styles.textRowVal}>{val}</span>
        </div>
      ))}
    </>
  );
}
