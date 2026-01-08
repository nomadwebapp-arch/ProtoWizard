import { useEffect, useRef } from 'react';

/**
 * PopAds 팝업 광고 훅
 *
 * 기능:
 * - 5회 클릭마다 정확히 한 번씩 팝업 광고 표시
 * - LocalStorage로 클릭 카운트 저장
 */

const CLICKS_PER_POPUP = 5; // 5회마다 팝업
let popupScriptLoaded = false; // 팝업 스크립트 중복 실행 방지

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
    // 중복 실행 방지
    if (popupScriptLoaded) {
      console.log('팝업 스크립트가 이미 로드 중입니다.');
      return;
    }

    console.log(`🎉 팝업 광고 표시! (${clickCountRef.current}회 클릭)`);
    popupScriptLoaded = true;

    // PopAds 팝업 스크립트 일시적으로 추가
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.setAttribute('data-cfasync', 'false');

    // PopAds 제공 스크립트
    script.innerHTML = `
(function(){var m=window,x="dbad321b985cef11468eb20fab1ff519",c=[["siteId",5267166],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],o=["d3d3LmRpc3BsYXl2ZXJ0aXNpbmcuY29tL29HL3pwNS5taW4uanM=","ZDNtem9rdHk5NTFjNXcuY2xvdWRmcm9udC5uZXQvQXJoc1IvZVhlcXQvanZleC5taW4uY3Nz"],d=-1,j,v,f=function(){clearTimeout(v);d++;if(o[d]&&!(1793760412000<(new Date).getTime()&&1<d)){j=m.document.createElement("script");j.type="text/javascript";j.async=!0;var b=m.document.getElementsByTagName("script")[0];j.src="https://"+atob(o[d]);j.crossOrigin="anonymous";j.onerror=f;j.onload=function(){clearTimeout(v);m[x.slice(0,16)+x.slice(0,16)]||f()};v=setTimeout(f,5E3);b.parentNode.insertBefore(j,b)}};if(!m[x]){try{Object.freeze(m[x]=c)}catch(e){}f()}})();
    `;

    document.body.appendChild(script);

    // 팝업 트리거를 위한 클릭 이벤트 생성
    setTimeout(() => {
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      document.body.dispatchEvent(clickEvent);

      // 스크립트 제거 (3초 후, 다음 5번째 클릭까지 팝업 방지)
      setTimeout(() => {
        if (script.parentNode) {
          document.body.removeChild(script);
        }
        popupScriptLoaded = false;
        console.log('팝업 스크립트 제거 완료');
      }, 3000);
    }, 100);
  };

  const getClickCount = () => clickCountRef.current;
  const getRemainingClicks = () => CLICKS_PER_POPUP - (clickCountRef.current % CLICKS_PER_POPUP);

  return {
    trackClick,
    getClickCount,
    getRemainingClicks,
  };
}
