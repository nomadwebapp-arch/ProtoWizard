import { useEffect } from 'react';

/**
 * PropellerAds 배너 광고 컴포넌트
 *
 * 사용법:
 * 1. PropellerAds 가입: https://propellerads.com
 * 2. 배너 광고 생성 (320x50 모바일 또는 728x90 데스크탑)
 * 3. 받은 코드의 zoneId를 PROPELLER_ZONE_ID에 입력
 */

// PropellerAds Zone ID
const PROPELLER_ZONE_ID = '10429778';

export default function PropellerBanner() {
  useEffect(() => {
    // PropellerAds 스크립트 로드
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = `//thubanoa.com/${PROPELLER_ZONE_ID}/invoke.js`;

    const container = document.getElementById('propeller-banner-container');
    if (container) {
      container.appendChild(script);
    }

    return () => {
      // Cleanup
      if (container && script.parentNode) {
        container.removeChild(script);
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 999,
      background: '#000',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <div
        id="propeller-banner-container"
        style={{
          minHeight: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    </div>
  );
}
