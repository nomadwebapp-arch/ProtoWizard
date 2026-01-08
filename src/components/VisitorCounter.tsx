import { useEffect, useState } from 'react';

/**
 * 방문자 수 카운터 컴포넌트
 * TODAY: 오늘 방문자 수
 * TOTAL: 전체 방문자 수
 */

export default function VisitorCounter() {
  const [todayCount, setTodayCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // LocalStorage에서 데이터 불러오기
    const lastVisitDate = localStorage.getItem('lastVisitDate');
    const storedTodayCount = parseInt(localStorage.getItem('todayVisitors') || '0', 10);
    const storedTotalCount = parseInt(localStorage.getItem('totalVisitors') || '0', 10);

    let newTodayCount = storedTodayCount;
    let newTotalCount = storedTotalCount;

    // 날짜가 바뀌었으면 오늘 카운트 초기화
    if (lastVisitDate !== today) {
      newTodayCount = 1;
      localStorage.setItem('lastVisitDate', today);
    } else {
      newTodayCount = storedTodayCount + 1;
    }

    // 총 방문자 수 증가
    newTotalCount = storedTotalCount + 1;

    // LocalStorage에 저장
    localStorage.setItem('todayVisitors', newTodayCount.toString());
    localStorage.setItem('totalVisitors', newTotalCount.toString());

    // State 업데이트
    setTodayCount(newTodayCount);
    setTotalCount(newTotalCount);
  }, []);

  return (
    <div style={{
      marginBottom: '80px',
      padding: '12px',
      background: 'rgba(102, 126, 234, 0.1)',
      border: '1px solid rgba(102, 126, 234, 0.3)',
      borderRadius: '8px',
      fontSize: '0.75rem',
      color: '#667eea',
      textAlign: 'center',
      fontFamily: 'monospace',
    }}>
      <span style={{ fontWeight: '600' }}>TODAY:</span> <strong>{todayCount}</strong>
      {' | '}
      <span style={{ fontWeight: '600' }}>TOTAL:</span> <strong>{totalCount}</strong>
    </div>
  );
}
