import { useEffect, useRef } from 'react';

/**
 * PopAds 팝업 광고 훅
 *
 * 사용법:
 * 1. PopAds 가입: https://popads.net
 * 2. 팝업 광고 생성
 * 3. 받은 코드의 zoneId를 POPADS_ZONE_ID에 입력
 *
 * 기능:
 * - 5회 클릭마다 팝업 광고 표시
 * - LocalStorage로 클릭 카운트 저장
 */

// TODO: PopAds 가입 후 실제 Zone ID로 교체
const POPADS_ZONE_ID = 'YOUR_POPADS_ZONE_ID';
const CLICKS_PER_POPUP = 5; // 5회마다 팝업

export function usePopAds() {
  const clickCountRef = useRef(0);

  useEffect(() => {
    // LocalStorage에서 클릭 카운트 불러오기
    const savedCount = localStorage.getItem('adClickCount');
    clickCountRef.current = savedCount ? parseInt(savedCount, 10) : 0;
  }, []);

  const trackClick = () => {
    clickCountRef.current += 1;
    localStorage.setItem('adClickCount', clickCountRef.current.toString());

    // 5회마다 팝업 표시
    if (clickCountRef.current % CLICKS_PER_POPUP === 0) {
      showPopAd();
    }
  };

  const showPopAd = () => {
    // 실제 Zone ID가 설정되어 있으면 PopAds 팝업 실행
    if (POPADS_ZONE_ID !== 'YOUR_POPADS_ZONE_ID') {
      // PopAds 팝업 스크립트 실행
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = `//c1.popads.net/pop.js`;
      script.onload = () => {
        // @ts-ignore - PopAds 글로벌 변수
        if (window.pop_config) {
          // @ts-ignore
          window.pop_config.zone_id = POPADS_ZONE_ID;
        }
      };
      document.body.appendChild(script);

      setTimeout(() => {
        document.body.removeChild(script);
      }, 1000);
    } else {
      // 개발 모드: 콘솔에만 표시
      console.log(`🎉 팝업 광고 표시! (${clickCountRef.current}회 클릭)`);
      alert(`🎉 팝업 광고가 표시됩니다!\n(${clickCountRef.current}회 클릭)`);
    }
  };

  const getClickCount = () => clickCountRef.current;
  const getRemainingClicks = () => CLICKS_PER_POPUP - (clickCountRef.current % CLICKS_PER_POPUP);

  return {
    trackClick,
    getClickCount,
    getRemainingClicks,
  };
}
