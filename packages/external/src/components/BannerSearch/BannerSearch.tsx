import styles from './BannerSearch.module.css';
import productMask from './assets/product-mask.svg';
import tube from './assets/tube.png';
import poreClear from './assets/pore-clear.png';
import serum from './assets/serum.png';
import dropper from './assets/dropper.png';

export function BannerSearch() {
  const mask = `url(${productMask})`;

  return (
    <div className={styles.wrap}>
      {/* 튜브 (오른쪽 위) — rotate(-14.53deg), left=250, top=14 */}
      <div className={styles.frame} style={{ left: '250px', top: '14px', width: '73.608px', height: '125.454px' }}>
        <div style={{ transform: 'rotate(-14.53deg)', flexShrink: 0 }}>
          <div
            className={styles.masked}
            style={{
              width: '45.507px',
              height: '117.805px',
              maskImage: mask,
              WebkitMaskImage: mask,
              maskPosition: '-250px -14.004px',
              WebkitMaskPosition: '-250px -14.004px',
              maskSize: '393px 310px',
              WebkitMaskSize: '393px 310px',
              boxShadow: '0px 38px 30px 0px rgba(140,144,154,0.3)',
            }}
          >
            <div className={styles.overflowWrap}>
              <img src={tube} alt="" className={styles.imgOffset} style={{ height: '133.96%', left: '-122.58%', top: '-17.76%', width: '346.77%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 포어클리어 (중앙 큰) — rotate(24.97deg), left=77, top=16 */}
      <div className={styles.frame} style={{ left: '77px', top: '16px', width: '228.126px', height: '232px' }}>
        <div style={{ transform: 'rotate(24.97deg)', flexShrink: 0 }}>
          <div
            className={styles.masked}
            style={{
              width: '169.157px',
              height: '177.153px',
              maskImage: mask,
              WebkitMaskImage: mask,
              maskPosition: '-77.002px -16px',
              WebkitMaskPosition: '-77.002px -16px',
              maskSize: '393px 310px',
              WebkitMaskSize: '393px 310px',
            }}
          >
            <div className={styles.overflowWrap}>
              <img src={poreClear} alt="" className={styles.imgOffset} style={{ height: '173.61%', left: '-40.73%', top: '-42.36%', width: '181.82%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 포어클리어 color-burn 레이어 */}
      <div className={styles.frame} style={{ left: '77px', top: '16px', width: '228.126px', height: '232px', mixBlendMode: 'color-burn' }}>
        <div style={{ transform: 'rotate(24.97deg)', flexShrink: 0 }}>
          <div
            className={styles.masked}
            style={{
              width: '169.157px',
              height: '177.153px',
              opacity: 0.5,
              maskImage: mask,
              WebkitMaskImage: mask,
              maskPosition: '-77.002px -16px',
              WebkitMaskPosition: '-77.002px -16px',
              maskSize: '393px 310px',
              WebkitMaskSize: '393px 310px',
            }}
          >
            <div className={styles.overflowWrap}>
              <img src={poreClear} alt="" className={styles.imgOffset} style={{ height: '173.61%', left: '-40.73%', top: '-42.36%', width: '181.82%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 세럼 (오른쪽 아래) — rotate(2.69deg), left=231, top=180 */}
      <div className={styles.frame} style={{ left: '231px', top: '180px', width: '53.774px', height: '138.447px' }}>
        <div style={{ transform: 'rotate(2.69deg)', flexShrink: 0 }}>
          <div
            className={styles.masked}
            style={{
              width: '47.434px',
              height: '136.374px',
              maskImage: mask,
              WebkitMaskImage: mask,
              maskPosition: '-231px -180px',
              WebkitMaskPosition: '-231px -180px',
              maskSize: '393px 310px',
              WebkitMaskSize: '393px 310px',
              boxShadow: '0px 38px 30px 0px rgba(140,144,154,0.3)',
            }}
          >
            <div className={styles.overflowWrap}>
              <img src={serum} alt="" className={styles.imgOffset} style={{ height: '120.77%', left: '-123.26%', top: '-10.87%', width: '347.22%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 드로퍼 (왼쪽 아래) — rotate(-27.87deg), left=49.13, top=141.05 */}
      <div className={styles.frame} style={{ left: '49.13px', top: '141.05px', width: '121.959px', height: '154.759px' }}>
        <div style={{ transform: 'rotate(-27.87deg)', flexShrink: 0 }}>
          <div
            className={styles.masked}
            style={{
              width: '63px',
              height: '141.75px',
              maskImage: mask,
              WebkitMaskImage: mask,
              maskPosition: '-49.135px -141.052px',
              WebkitMaskPosition: '-49.135px -141.052px',
              maskSize: '393px 310px',
              WebkitMaskSize: '393px 310px',
            }}
          >
            <div className={styles.overflowWrap}>
              <img src={dropper} alt="" className={styles.imgOffset} style={{ height: '134.23%', left: '-100.91%', top: '-17.45%', width: '302.11%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 드로퍼 글로우 레이어 — opacity 12% */}
      <div className={styles.frame} style={{ left: '49.13px', top: '141.05px', width: '121.959px', height: '154.759px' }}>
        <div style={{ transform: 'rotate(-27.87deg)', flexShrink: 0 }}>
          <div
            className={styles.masked}
            style={{
              width: '63px',
              height: '141.75px',
              opacity: 0.12,
              maskImage: mask,
              WebkitMaskImage: mask,
              maskPosition: '-49.135px -141.052px',
              WebkitMaskPosition: '-49.135px -141.052px',
              maskSize: '393px 310px',
              WebkitMaskSize: '393px 310px',
            }}
          >
            <div className={styles.overflowWrap}>
              <img src={dropper} alt="" className={styles.imgOffset} style={{ height: '134.23%', left: '-100.91%', top: '-17.45%', width: '302.11%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
