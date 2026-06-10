import styles from './Footer.module.css';

interface FooterProps {
  type?: '01' | '02';
}

export function Footer({ type = '01' }: FooterProps) {
  const is01 = type === '01';

  return (
    <div className={`${styles.wrap} ${is01 ? styles.wrap01 : styles.wrap02}`}>
      {is01 ? <Footer01 /> : <Footer02 />}
    </div>
  );
}

function Footer01() {
  return (
    <>
      <div className={styles.linkRow}>
        <span className={styles.linkText}>이용약관</span>
        <div className={styles.linkDivider} />
        <span className={styles.linkText}>전자금융거래래 이용약관</span>
        <div className={styles.linkDivider} />
        <span className={styles.linkText}>개인정보처리방침</span>
      </div>

      <div className={styles.infoGroup01}>
        <div className={styles.infoRow01}>
          <span className={styles.infoText01}>사업자: SK플래닛(주)</span>
          <div className={styles.infoRowDivider} />
          <span className={styles.infoText01}>대표 : 유재욱</span>
        </div>
        <div className={styles.infoRow01}>
          <span className={styles.infoText01}>사업자등록번호 : 815-81-01244</span>
        </div>
        <div className={styles.infoRow01}>
          <span className={styles.infoText01}>경기도 성남시 분당구 판교로 264(삼평동)</span>
        </div>
        <div className={styles.infoRow01}>
          <span className={styles.infoText01}>통신판매매업신고 : 2014-경기성남-0036</span>
        </div>
        <div className={styles.infoRow01}>
          <span className={styles.infoText01}>전화 : 1800-0133</span>
        </div>
        <div className={styles.infoRow01}>
          <span className={styles.infoText01}>gifticon@skplanet.com</span>
        </div>
      </div>

      <span className={styles.copyright}>Copyright ©️ SK Planet All Rights Reserved</span>
    </>
  );
}

function Footer02() {
  return (
    <div className={styles.infoGroup02}>
      <div className={styles.infoSection02}>
        <span className={styles.infoTitle02}>통신 판매 중개업 안내</span>
        <p className={styles.infoBody02}>
          제 3자가 판매하는 상품 및 거래의 경우 SK텔레콤(주)은 통신판매 중개자이며, 통신판매의 당사자가 아닙니다.
        </p>
      </div>
      <div className={styles.infoSection02}>
        <span className={styles.infoTitle02}>거래 의무 책임 안내</span>
        <p className={styles.infoBody02}>상품 및 거래에 관한 의무와 책임은 판매자에게 있습니다.</p>
      </div>
      <div className={styles.infoSection02}>
        <span className={styles.infoTitle02}>미성년자 거래 안내</span>
        <p className={styles.infoBody02}>
          법정대리인의 동의를 받지 않은 미성년자의 거래는 관련 법령에 따라 취소될 수 있습니다.
        </p>
      </div>
    </div>
  );
}
