import { useEffect, useRef, useState } from 'react';

/**
 * PopAds 팝업 광고 훅
 *
 * 기능:
 * - 5회 클릭마다 정확히 한 번씩 팝업 광고 표시
 * - LocalStorage로 클릭 카운트 저장
 */

const CLICKS_PER_POPUP = 5; // 5회마다 팝업
const POPUP_SCRIPT_ID = 'popads-popup-script';

export function usePopAds() {
  const clickCountRef = useRef(0);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);

  useEffect(() => {
    // LocalStorage에서 클릭 카운트 불러오기
    const savedCount = localStorage.getItem('adClickCount');
    clickCountRef.current = savedCount ? parseInt(savedCount, 10) : 0;
  }, []);

  // 5번째 클릭 시 팝업 스크립트 로드
  useEffect(() => {
    if (!shouldShowPopup) return;

    console.log(`🎉 팝업 광고 로드 중... (${clickCountRef.current}회 클릭)`);

    // 기존 스크립트가 있으면 제거
    const existingScript = document.getElementById(POPUP_SCRIPT_ID);
    if (existingScript) {
      existingScript.remove();
    }

    // PopAds 팝업 스크립트를 head에 추가
    const script = document.createElement('script');
    script.id = POPUP_SCRIPT_ID;
    script.type = 'text/javascript';
    script.setAttribute('data-cfasync', 'false');

    // PopAds 제공 스크립트 (올바른 siteId 5267420, popundersPerIP 0 = 무제한)
    script.innerHTML = `
(function(){var m=window,x="dbad321b985cef11468eb20fab1ff519",c=[["siteId",5267420],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",true],["defaultPerDay",0],["topmostLayer","auto"]],o=["d3d3LmRpc3BsYXl2ZXJ0aXNpbmcuY29tL29HL3pwNS5taW4uanM=","ZDNtem9rdHk5NTFjNXcuY2xvdWRmcm9udC5uZXQvQXJoc1IvZVhlcXQvanZleC5taW4uY3Nz"],d=-1,j,v,f=function(){clearTimeout(v);d++;if(o[d]&&!(1793760412000<(new Date).getTime()&&1<d)){j=m.document.createElement("script");j.type="text/javascript";j.async=!0;var b=m.document.getElementsByTagName("script")[0];j.src="https://"+atob(o[d]);j.crossOrigin="anonymous";j.onerror=f;j.onload=function(){clearTimeout(v);m[x.slice(0,16)+x.slice(0,16)]||f()};v=setTimeout(f,5E3);b.parentNode.insertBefore(j,b)}};if(!m[x]){try{Object.freeze(m[x]=c)}catch(e){}f()}})();
    `;

    document.head.appendChild(script);

    // 5초 후 스크립트 제거 및 플래그 리셋
    const timeoutId = setTimeout(() => {
      const scriptToRemove = document.getElementById(POPUP_SCRIPT_ID);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
      setShouldShowPopup(false);
      console.log('팝업 스크립트 제거 완료');
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [shouldShowPopup]);

  const trackClick = () => {
    clickCountRef.current += 1;
    localStorage.setItem('adClickCount', clickCountRef.current.toString());

    // 5회마다 팝업 표시
    if (clickCountRef.current % CLICKS_PER_POPUP === 0) {
      setShouldShowPopup(true);
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
