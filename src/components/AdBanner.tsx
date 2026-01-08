import { useEffect } from 'react';

/**
 * 배너 광고 컴포넌트 (320x50)
 * 하단 고정 배너로 표시됩니다.
 */

export default function AdBanner() {
  useEffect(() => {
    // atOptions 전역 설정
    (window as any).atOptions = {
      'key': '27962193cce570f154eb49076e3f268a',
      'format': 'iframe',
      'height': 50,
      'width': 320,
      'params': {}
    };

    // 광고 스크립트 로드 - 컨테이너에 직접 삽입
    const script = document.createElement('script');
    script.src = 'https://www.highperformanceformat.com/27962193cce570f154eb49076e3f268a/invoke.js';
    script.async = true;

    const container = document.getElementById('ad-banner-container');
    if (container) {
      container.appendChild(script);
    } else {
      document.body.appendChild(script);
    }

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any).atOptions;
    };
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 py-2"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        id="ad-banner-container"
        style={{
          width: '320px',
          height: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* 광고 스크립트가 자동으로 이 영역에 광고를 삽입합니다 */}
      </div>
    </div>
  );
}
