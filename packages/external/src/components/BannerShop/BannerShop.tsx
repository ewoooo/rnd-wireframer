import styles from './BannerShop.module.css';
import appleLogo from './assets/apple-logo.svg';
import productMask from './assets/product-mask.svg';
import laptop from './assets/laptop.png';
import laptopGlow from './assets/laptop-glow.png';
import card from './assets/card.png';
import airtag from './assets/airtag.png';

interface BannerShopProps {
  subtitle?: string;
  titleLine1?: string;
  titleLine2?: string;
}

export function BannerShop({
  subtitle = 'iPhone20',
  titleLine1 = '기능 가득. 실속 가득.',
  titleLine2 = 'T 다이렉트샵 혜택',
}: BannerShopProps) {
  const mask = `url(${productMask})`;

  return (
    <div className={styles.wrap}>
      {/* 텍스트 영역 */}
      <div className={styles.titleArea}>
        <div className={styles.subtitle}>
          <img src={appleLogo} alt="" className={styles.appleLogo} />
          <span className={styles.subtitleText}>{subtitle}</span>
        </div>
        <div className={styles.titleGroup}>
          <p className={styles.titleLine}>{titleLine1}</p>
          <p className={styles.titleLine}>{titleLine2}</p>
        </div>
      </div>

      {/* 제품 이미지 영역 */}
      {/* 노트북 (큰) — rotate(-13.22deg), left=292.48, top=58.52 */}
      <div className={styles.productFrame} style={{ left: '292.48px', top: '58.52px', width: '64.724px', height: '78.195px' }}>
        <div style={{ transform: 'rotate(-13.22deg)', flexShrink: 0 }}>
          <div
            className={styles.maskedImg}
            style={{
              width: '50.401px',
              height: '68.486px',
              maskImage: mask,
              WebkitMaskImage: mask,
              maskPosition: '-71.477px -58.523px',
              WebkitMaskPosition: '-71.477px -58.523px',
              maskSize: '148px 146px',
              WebkitMaskSize: '148px 146px',
            }}
          >
            <img src={laptop} alt="" className={styles.productImg} />
          </div>
        </div>
      </div>

      {/* 노트북 글로우 — mix-blend-screen */}
      <div className={styles.productFrame} style={{ left: '292.48px', top: '58.52px', width: '64.724px', height: '78.195px', mixBlendMode: 'screen' }}>
        <div style={{ transform: 'rotate(-13.22deg)', flexShrink: 0 }}>
          <div
            className={styles.maskedImg}
            style={{
              width: '50.401px',
              height: '68.486px',
              opacity: 0.6,
              maskImage: mask,
              WebkitMaskImage: mask,
              maskPosition: '-71.477px -58.523px',
              WebkitMaskPosition: '-71.477px -58.523px',
              maskSize: '148px 146px',
              WebkitMaskSize: '148px 146px',
            }}
          >
            <div className={styles.overflowWrap}>
              <img src={laptopGlow} alt="" className={styles.productImgOffset} style={{ height: '106.95%', left: '-21.78%', top: '-6.95%', width: '145.33%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 카드 (작은 오른쪽 위) — rotate(-38.41deg), left=318.13, top=7.54 */}
      <div className={styles.productFrame} style={{ left: '318.13px', top: '7.54px', width: '48.335px', height: '51.573px' }}>
        <div style={{ transform: 'rotate(-38.41deg)', flexShrink: 0 }}>
          <div
            className={styles.maskedImg}
            style={{
              width: '25.591px',
              height: '45.525px',
              maskImage: mask,
              WebkitMaskImage: mask,
              maskPosition: '-97.125px -7.54px',
              WebkitMaskPosition: '-97.125px -7.54px',
              maskSize: '148px 146px',
              WebkitMaskSize: '148px 146px',
            }}
          >
            <div className={styles.overflowWrap}>
              <img src={card} alt="" className={styles.productImgOffset} style={{ height: '131.28%', left: '-67.54%', top: '-21.64%', width: '233.55%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 카드 글로우 — mix-blend-plus-lighter */}
      <div className={styles.productFrame} style={{ left: '318.13px', top: '7.54px', width: '48.335px', height: '51.573px', mixBlendMode: 'plus-lighter' as React.CSSProperties['mixBlendMode'] }}>
        <div style={{ transform: 'rotate(-38.41deg)', flexShrink: 0 }}>
          <div
            className={styles.maskedImg}
            style={{
              width: '25.591px',
              height: '45.525px',
              opacity: 0.2,
              maskImage: mask,
              WebkitMaskImage: mask,
              maskPosition: '-97.125px -7.54px',
              WebkitMaskPosition: '-97.125px -7.54px',
              maskSize: '148px 146px',
              WebkitMaskSize: '148px 146px',
            }}
          >
            <div className={styles.overflowWrap}>
              <img src={card} alt="" className={styles.productImgOffset} style={{ height: '131.28%', left: '-67.54%', top: '-21.64%', width: '233.55%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* AirTag — rotate(27.51deg), left=230.21, top=0.21 */}
      <div className={styles.productFrame} style={{ left: '230.21px', top: '0.21px', width: '103.248px', height: '103.344px' }}>
        <div style={{ transform: 'rotate(27.51deg) skewX(-0.06deg)', flexShrink: 0 }}>
          <div
            className={styles.maskedImg}
            style={{
              width: '76.331px',
              height: '76.81px',
              maskImage: mask,
              WebkitMaskImage: mask,
              maskPosition: '-9.209px -0.211px',
              WebkitMaskPosition: '-9.209px -0.211px',
              maskSize: '148px 146px',
              WebkitMaskSize: '148px 146px',
            }}
          >
            <div className={styles.overflowWrap}>
              <img src={airtag} alt="" className={styles.productImgOffset} style={{ height: '158.36%', left: '-22.63%', top: '-29.05%', width: '145.66%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* AirTag 글로우 — mix-blend-plus-lighter */}
      <div className={styles.productFrame} style={{ left: '230.21px', top: '0.21px', width: '103.248px', height: '103.344px', mixBlendMode: 'plus-lighter' as React.CSSProperties['mixBlendMode'] }}>
        <div style={{ transform: 'rotate(27.51deg) skewX(-0.06deg)', flexShrink: 0 }}>
          <div
            className={styles.maskedImg}
            style={{
              width: '76.331px',
              height: '76.81px',
              opacity: 0.2,
              maskImage: mask,
              WebkitMaskImage: mask,
              maskPosition: '-9.209px -0.211px',
              WebkitMaskPosition: '-9.209px -0.211px',
              maskSize: '148px 146px',
              WebkitMaskSize: '148px 146px',
            }}
          >
            <div className={styles.overflowWrap}>
              <img src={airtag} alt="" className={styles.productImgOffset} style={{ height: '158.36%', left: '-22.63%', top: '-29.05%', width: '145.66%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
