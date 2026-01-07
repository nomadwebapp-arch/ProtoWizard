import { useEffect } from 'react';

/**
 * PropellerAds 배너 광고 컴포넌트
 *
 * 사용법:
 * 1. PropellerAds 가입: https://propellerads.com
 * 2. 배너 광고 생성 (320x50 모바일 또는 728x90 데스크탑)
 * 3. 받은 코드의 zoneId를 PROPELLER_ZONE_ID에 입력
 */

// TODO: PropellerAds 가입 후 실제 Zone ID로 교체
const PROPELLER_ZONE_ID = 'YOUR_ZONE_ID_HERE';

export default function PropellerBanner() {
  useEffect(() => {
    // PropellerAds 스크립트가 이미 로드되어 있으면 광고 표시
    if (PROPELLER_ZONE_ID !== 'YOUR_ZONE_ID_HERE') {
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
    }
  }, []);

  // 실제 Zone ID가 없으면 개발용 플레이스홀더 표시
  if (PROPELLER_ZONE_ID === 'YOUR_ZONE_ID_HERE') {
    return (
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '0.85rem',
        zIndex: 999,
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        📢 PropellerAds 배너 광고 영역 (Zone ID 설정 필요)
      </div>
    );
  }

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
