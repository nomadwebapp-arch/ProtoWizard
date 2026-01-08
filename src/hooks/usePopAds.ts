import { useEffect, useRef, useState } from 'react';

/**
 * A-Ads 팝언더 광고 훅
 *
 * 기능:
 * - 5회 클릭마다 정확히 한 번씩 팝언더 광고 표시
 * - LocalStorage로 클릭 카운트 저장
 */

const CLICKS_PER_POPUP = 5; // 5회마다 팝업
const POPUP_SCRIPT_ID = 'aads-popunder-script';
const AADS_SCRIPT_URL = 'https://pl28426339.effectivegatecpm.com/dc/86/e9/dc86e90a92ad778a5268a7c1062768ed.js';

export function usePopAds() {
  const clickCountRef = useRef(0);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);

  useEffect(() => {
    // LocalStorage에서 클릭 카운트 불러오기
    const savedCount = localStorage.getItem('adClickCount');
    clickCountRef.current = savedCount ? parseInt(savedCount, 10) : 0;
  }, []);

  // 5번째 클릭 시 팝언더 스크립트 로드
  useEffect(() => {
    if (!shouldShowPopup) return;

    console.log(`🎉 A-Ads 팝언더 광고 로드 중... (${clickCountRef.current}회 클릭)`);

    // 기존 스크립트가 있으면 제거
    const existingScript = document.getElementById(POPUP_SCRIPT_ID);
    if (existingScript) {
      existingScript.remove();
    }

    // A-Ads 팝언더 스크립트를 head에 추가
    const script = document.createElement('script');
    script.id = POPUP_SCRIPT_ID;
    script.src = AADS_SCRIPT_URL;
    script.async = true;

    document.head.appendChild(script);

    // 3초 후 스크립트 제거 및 플래그 리셋
    const timeoutId = setTimeout(() => {
      const scriptToRemove = document.getElementById(POPUP_SCRIPT_ID);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
      setShouldShowPopup(false);
      console.log('A-Ads 팝언더 스크립트 제거 완료');
    }, 3000);

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
