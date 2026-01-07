import { useEffect } from 'react';

/**
 * PropellerAds Multitag 광고 컴포넌트
 *
 * Multitag은 자동으로 최적화된 광고를 표시합니다:
 * - 배너, 팝언더, 인터스티셜 등 여러 형식
 * - 가장 높은 수익률
 * - 모든 디바이스 지원
 */

// PropellerAds Multitag Zone ID
const PROPELLER_ZONE_ID = '199774';

export default function PropellerBanner() {
  useEffect(() => {
    // PropellerAds Multitag 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://quge5.com/88/tag.min.js';
    script.setAttribute('data-zone', PROPELLER_ZONE_ID);
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Multitag은 자동으로 광고를 표시하므로 별도의 컨테이너 불필요
  return null;
}
