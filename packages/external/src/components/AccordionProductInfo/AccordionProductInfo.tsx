import type { ReactNode } from 'react';
import styles from './AccordionProductInfo.module.css';
import logoImg from './assets/logo.png';
import chevronSvg from './assets/chevron.svg';

interface AccordionProductInfoProps {
  states?: 'Default' | 'Open';
  logoSrc?: string;
  logoBg?: string;
  brandName?: string;
  productName?: string;
  children?: ReactNode;
}

export function AccordionProductInfo({
  states = 'Default',
  logoSrc = logoImg,
  logoBg = '#ff143b',
  brandName = '티빙',
  productName = 'TVING 광고형 스탠다드(결합)',
  children,
}: AccordionProductInfoProps) {
  const isOpen = states === 'Open';

  return (
    <div className={`${styles.wrap} ${isOpen ? styles.wrapOpen : ''}`}>
      <div className={styles.title}>
        <div className={styles.leftItem}>
          <div className={styles.logo} style={{ background: logoBg }}>
            <img src={logoSrc} alt={brandName} className={styles.logoImg} />
          </div>
          <div className={styles.info}>
            <span className={styles.brandName}>{brandName}</span>
            <span className={styles.productName}>{productName}</span>
          </div>
        </div>
        <div className={styles.chevronWrap}>
          <img
            src={chevronSvg}
            alt=""
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <>
          <div className={styles.spacing} />
          <div className={styles.divider} />
          <div className={styles.spacing} />
          <div className={styles.slot}>
            {children ?? <DefaultSlotContent />}
          </div>
        </>
      )}
    </div>
  );
}

function DefaultSlotContent() {
  return (
    <>
      <p className={styles.sectionTitle}>1. 상품의 배송 정보와 옵션을 확인해주세요.</p>
      <ul className={styles.list}>
        <li>옵션이 없는 상품의 경우 판매자 정책에 따라 상품이 제공됩니다.</li>
        <li>한정 수량 상품이거나 재고가 없는 경우, 구독이 제한될 수 있습니다.</li>
      </ul>
      <div className={styles.sectionSpacing} />

      <p className={styles.sectionTitle}>2. 지정된 배송지로 배송 주기에 따라 자동으로 배송됩니다.</p>
      <ul className={styles.list}>
        <li>판매자의 배송 정책에 따라 도서/산간 지역 또는 특정 지역은 구독이 제한될 수 있습니다.</li>
      </ul>
      <div className={styles.sectionSpacing} />

      <p className={styles.sectionTitle}>3. 상품 발송은 배송 희망일에 맞춰 진행되며, 판매자 상황에 따라 1~2일 정도 지연될 수 있습니다.</p>
      <ul className={styles.list}>
        <li>판매자 사정 또는 상품 특성에 따라 발송 일정 및 배송 예정일이 변경될 수 있습니다.</li>
        <li>배송 진행 현황은 [정기배송 상세]에서 확인하실 수 있습니다.</li>
      </ul>
      <div className={styles.sectionSpacing} />

      <p className={styles.sectionTitle}>4. 배송받은 상품에 문제가 없는지 잘 확인해 주세요.</p>
      <ul className={styles.list}>
        <li>단순 변심 혹은 상품 불량으로 교환/반품이 필요한 경우 판매자에게 먼저 연락해 주세요.</li>
      </ul>
      <div className={styles.sectionSpacing} />

      <p className={styles.sectionTitle}>5. 배송 현황에 따라 상품 옵션 및 배송지 정보를 변경하실 수 있습니다.</p>
    </>
  );
}
