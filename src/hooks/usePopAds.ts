import { useEffect, useRef } from 'react';

/**
 * A-Ads 팝언더 광고 훅
 *
 * 기능:
 * - 5회 클릭 시 팝언더 스크립트를 한 번만 로드하고 계속 유지
 * - A-Ads가 자체적으로 빈도 제한 관리
 * - LocalStorage로 클릭 카운트 저장
 */

const CLICKS_PER_POPUP = 5; // 5회마다 팝업
const POPUP_SCRIPT_ID = 'aads-popunder-script';
const AADS_SCRIPT_URL = 'https://pl28426339.effectivegatecpm.com/dc/86/e9/dc86e90a92ad778a5268a7c1062768ed.js';

let scriptLoaded = false; // 스크립트 로드 여부 추적

export function usePopAds() {
  const clickCountRef = useRef(0);

  useEffect(() => {
    // LocalStorage에서 클릭 카운트 불러오기
    const savedCount = localStorage.getItem('adClickCount');
    clickCountRef.current = savedCount ? parseInt(savedCount, 10) : 0;
  }, []);

  const loadPopunderScript = () => {
    // 이미 로드되었으면 다시 로드하지 않음
    if (scriptLoaded) {
      console.log('팝언더 스크립트 이미 로드됨 - A-Ads가 자체적으로 빈도 관리');
      return;
    }

    // 스크립트가 이미 DOM에 있는지 확인
    const existingScript = document.getElementById(POPUP_SCRIPT_ID);
    if (existingScript) {
      scriptLoaded = true;
      console.log('팝언더 스크립트 이미 존재함');
      return;
    }

    console.log('🎉 A-Ads 팝언더 스크립트 로드 (영구 유지)');

    // A-Ads 팝언더 스크립트를 head에 추가하고 영구 유지
    const script = document.createElement('script');
    script.id = POPUP_SCRIPT_ID;
    script.src = AADS_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      scriptLoaded = true;
      console.log('A-Ads 팝언더 스크립트 로드 완료 - 사용자 다음 클릭 시 팝언더 작동');
    };

    script.onerror = () => {
      console.error('A-Ads 팝언더 스크립트 로드 실패');
      scriptLoaded = false;
    };

    document.head.appendChild(script);
  };

  const trackClick = () => {
    clickCountRef.current += 1;
    localStorage.setItem('adClickCount', clickCountRef.current.toString());

    // 5회마다 스크립트 로드 (최초 1회만)
    if (clickCountRef.current % CLICKS_PER_POPUP === 0) {
      loadPopunderScript();
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
