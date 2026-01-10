import { useState, useRef } from 'react';
import './App.css';
import { protoMatches } from './data/protoMatches';
import { generateRandomCombination } from './utils/combinationGenerator';
import type { Combination, FilterOptions } from './types/match';
import html2canvas from 'html2canvas';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [combination, setCombination] = useState<Combination | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMatchesModal, setShowMatchesModal] = useState(false);
  const combinationRef = useRef<HTMLDivElement>(null);

  // Filter options state
  const [targetOdds, setTargetOdds] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [betAmount, setBetAmount] = useState(10000);
  const [allowedSports, setAllowedSports] = useState<string[]>([]);
  const [allowedMatchTypes, setAllowedMatchTypes] = useState<string[]>([]);

  // 추가 필터
  const [includeRegularOdds, setIncludeRegularOdds] = useState(false);
  const [regularOddsCount, setRegularOddsCount] = useState(1);
  const [includeDraws, setIncludeDraws] = useState(false);
  const [drawCount, setDrawCount] = useState(1);
  const [includeHighOdds, setIncludeHighOdds] = useState(false);
  const [highOddsCount, setHighOddsCount] = useState(1);

  // 날짜 필터 - 데이터에서 고유한 날짜 추출
  const availableDates = (() => {
    const now = new Date();
    const dates = new Set<string>();
    protoMatches
      .filter(m => m.status === 'open' && m.deadline > now)
      .forEach(m => {
        const month = String(m.deadline.getMonth() + 1).padStart(2, '0');
        const day = String(m.deadline.getDate()).padStart(2, '0');
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][m.deadline.getDay()];
        dates.add(`${month}.${day}|${dayOfWeek}`);
      });
    return Array.from(dates).sort();
  })();

  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const handleGenerate = () => {
    // 완전 랜덤 모드 체크
    const isFullRandom = targetOdds === 0 && matchCount === 0;
    const actualMatchCount = isFullRandom ? Math.floor(Math.random() * 9) + 2 : (matchCount || 3);

    // 마감 시간 체크 - 사용 가능한 경기 확인
    const now = new Date();
    let availableMatches = protoMatches.filter(m => m.status === 'open' && m.deadline > now);

    // 날짜 필터 적용 (선택된 날짜가 있을 때만)
    if (selectedDates.length > 0) {
      availableMatches = availableMatches.filter(m => {
        const month = String(m.deadline.getMonth() + 1).padStart(2, '0');
        const day = String(m.deadline.getDate()).padStart(2, '0');
        return selectedDates.includes(`${month}.${day}`);
      });
    }

    if (availableMatches.length === 0) {
      alert('현재 배팅 가능한 경기가 없습니다. 모든 경기가 마감되었거나 선택한 날짜에 경기가 없습니다.');
      return;
    }

    if (!isFullRandom && availableMatches.length < actualMatchCount) {
      alert(`배팅 가능한 경기가 ${availableMatches.length}개 뿐입니다. 조합 경기 수를 줄여주세요.`);
      return;
    }

    // 배당 포함 개수 검증 (완전 랜덤이 아닐 때만)
    if (!isFullRandom) {
      const totalOddsCount =
        (includeRegularOdds ? regularOddsCount : 0) +
        (includeDraws ? drawCount : 0) +
        (includeHighOdds ? highOddsCount : 0);

      if (totalOddsCount > actualMatchCount) {
        alert(`배당 포함 개수 합계(${totalOddsCount}개)가 조합 경기 수(${actualMatchCount}개)를 초과할 수 없습니다!`);
        return;
      }
    }

    const options: FilterOptions = {
      targetOdds: targetOdds || 0,
      matchCount: matchCount || 0,
      betAmount,
      allowedSports: allowedSports.length > 0 ? allowedSports as any[] : undefined,
      allowedMatchTypes: allowedMatchTypes.length > 0 ? allowedMatchTypes as any[] : undefined,
      allowedDates: selectedDates.length > 0 ? selectedDates : undefined,
      // 배당 포함 필터
      includeRegularOdds: isFullRandom ? false : includeRegularOdds,
      regularOddsCount,
      includeDraws: isFullRandom ? false : includeDraws,
      drawCount,
      includeHighOdds: isFullRandom ? false : includeHighOdds,
      highOddsCount,
      isFullRandom,
    };

    const result = generateRandomCombination(protoMatches, options);

    if (!result) {
      alert('조건에 맞는 조합을 찾을 수 없습니다. 필터 조건을 완화해보세요.');
      return;
    }

    setCombination(result);
  };

  const handleReset = () => {
    setCombination(null);
    setTargetOdds(0);
    setMatchCount(0);
    setBetAmount(10000);
    setAllowedSports([]);
    setAllowedMatchTypes([]);
    setIncludeRegularOdds(false);
    setRegularOddsCount(1);
    setIncludeDraws(false);
    setDrawCount(1);
    setIncludeHighOdds(false);
    setHighOddsCount(1);
    setSelectedDates([]);
  };

  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  // Input 커서를 끝으로 이동하는 핸들러
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    setTimeout(() => {
      input.setSelectionRange(input.value.length, input.value.length);
    }, 0);
  };

  const generateImage = async () => {
    if (!combinationRef.current) return null;

    try {
      const canvas = await html2canvas(combinationRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        logging: false,
      });

      // 워터마크 추가 (흰색, 크게, 그림자 효과)
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 캔버스 중앙 하단 (총배당/배팅금액 영역)에 워터마크
        ctx.save();

        // 대각선으로 회전
        ctx.translate(canvas.width / 2, canvas.height - 400);
        ctx.rotate(-15 * Math.PI / 180);

        // 작고 은은한 흰색 텍스트 (테두리 + 채우기)
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';

        // 테두리 (연하게)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeText('ProtoWizard', 0, 0);

        // 채우기 (연하게)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillText('ProtoWizard', 0, 0);

        ctx.restore();
      }

      return canvas;
    } catch (error) {
      console.error('이미지 생성 실패:', error);
      return null;
    }
  };

  const handleShareImage = async () => {
    const canvas = await generateImage();
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `proto-combination-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setShowShareModal(false);
    });
  };

  const handleShareKakao = async () => {
    const canvas = await generateImage();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], 'proto-combination.png', { type: 'image/png' });

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'ProtoWizard 조합',
            text: `총 배당: ${combination?.totalOdds.toFixed(2)}배`,
            files: [file],
          });
          setShowShareModal(false);
        } catch (error) {
          console.error('공유 실패:', error);
        }
      } else {
        alert('이 브라우저는 공유 기능을 지원하지 않습니다.');
      }
    });
  };

  const handleShareSMS = async () => {
    const canvas = await generateImage();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], 'proto-combination.png', { type: 'image/png' });

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'ProtoWizard 조합',
            text: `총 배당: ${combination?.totalOdds.toFixed(2)}배\n예상 환급: ${formatNumber(combination?.estimatedPayout || 0)}원`,
            files: [file],
          });
          setShowShareModal(false);
        } catch (error) {
          console.error('공유 실패:', error);
          // Web Share API 실패 시 텍스트만 SMS로 전송
          if (combination) {
            const message = `ProtoWizard 조합\n총 배당: ${combination.totalOdds.toFixed(2)}배\n예상 환급: ${formatNumber(combination.estimatedPayout)}원`;
            const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
            window.location.href = smsUrl;
            setShowShareModal(false);
          }
        }
      } else {
        // Web Share API 미지원 시 텍스트만 SMS로 전송
        if (combination) {
          const message = `ProtoWizard 조합\n총 배당: ${combination.totalOdds.toFixed(2)}배\n예상 환급: ${formatNumber(combination.estimatedPayout)}원`;
          const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
          window.location.href = smsUrl;
          setShowShareModal(false);
        }
      }
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  const getSelectedLabel = (selected: 'home' | 'draw' | 'away', matchType: string) => {
    // 언더오버
    if (matchType === 'underover') {
      switch (selected) {
        case 'home':
          return 'U (언더)';
        case 'away':
          return 'O (오버)';
        default:
          return '-';
      }
    }

    // SUM (홀/짝)
    if (matchType === 'sum') {
      switch (selected) {
        case 'home':
          return '홀';
        case 'away':
          return '짝';
        default:
          return '-';
      }
    }

    // 일반, 핸디캡 (승/무/패)
    switch (selected) {
      case 'home':
        return '승';
      case 'draw':
        return '무';
      case 'away':
        return '패';
    }
  };

  const getMatchTypeLabel = (matchType: string, handicapValue?: string, underOverValue?: string) => {
    switch (matchType) {
      case 'normal':
        return '일반';
      case 'handicap':
        return `핸디캡 ${handicapValue || ''}`;
      case 'underover':
        return `언더오버 ${underOverValue || ''}`;
      case 'sum':
        return 'SUM (홀/짝)';
      default:
        return matchType;
    }
  };

  const formatDeadline = (deadline: Date) => {
    const month = String(deadline.getMonth() + 1).padStart(2, '0');
    const day = String(deadline.getDate()).padStart(2, '0');
    const hours = String(deadline.getHours()).padStart(2, '0');
    const minutes = String(deadline.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const formatRoundNumber = (roundNumber: string) => {
    // "260003" -> "2026년 프로토 3회차"
    const year = roundNumber.substring(0, 2); // "26"
    const round = parseInt(roundNumber.substring(2), 10); // "0003" -> 3
    return `20${year}년 프로토 ${round}회차`;
  };

  const getSportLabel = (sport: string) => {
    const sportMap: { [key: string]: string } = {
      'soccer': '⚽ 축구',
      'basketball': '🏀 농구',
      'volleyball': '🏐 배구',
      'baseball': '⚾ 야구',
    };
    return sportMap[sport] || sport;
  };

  const getSelectionColor = (selected: 'home' | 'draw' | 'away') => {
    switch (selected) {
      case 'home':
        return '#4a9eff'; // 파란색
      case 'draw':
        return '#22c55e'; // 초록색
      case 'away':
        return '#ff4444'; // 빨간색
    }
  };

  const toggleSport = (sport: string) => {
    setAllowedSports(prev =>
      prev.includes(sport)
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
  };

  const toggleMatchType = (type: string) => {
    setAllowedMatchTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1
          className="app-title"
          onClick={() => window.location.href = '/'}
          style={{ cursor: 'pointer' }}
        >
          프로토 조합 생성기
        </h1>
      </header>

      <main className="app-main">
        {/* Settings Panel */}
        <div className="settings-panel">
            <h2 className="settings-title">조합 생성 조건 설정</h2>
            {/* 윗줄: 목표배당 | 조합경기수 | 베팅금액 | 발매중인 정보 */}
            <div className="grid-4">
              <div className="setting-item">
                <label className="setting-label">목표 배당 (비우면 랜덤)</label>
                <input
                  type="number"
                  className="setting-input"
                  value={targetOdds || ''}
                  onChange={(e) => setTargetOdds(e.target.value === '' ? 0 : Number(e.target.value))}
                  onFocus={handleInputFocus}
                  min={10}
                  max={1000}
                  placeholder="미입력시 랜덤"
                />
              </div>

              <div className="setting-item">
                <label className="setting-label">조합 경기 수 (비우면 2~10)</label>
                <input
                  type="number"
                  className="setting-input"
                  value={matchCount || ''}
                  onChange={(e) => setMatchCount(e.target.value === '' ? 0 : Number(e.target.value))}
                  onFocus={handleInputFocus}
                  min={2}
                  max={10}
                  placeholder="미입력시 2~10"
                />
              </div>

              <div className="setting-item">
                <label className="setting-label">배팅 금액 (원)</label>
                <input
                  type="text"
                  className="setting-input"
                  value={betAmount ? formatNumber(betAmount) : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    setBetAmount(value === '' ? 0 : Number(value));
                  }}
                  placeholder="10,000"
                />
              </div>

              <div className="setting-item">
                <label className="setting-label">발매중인 경기</label>
                <button
                  type="button"
                  onClick={() => setShowMatchesModal(true)}
                  className="setting-input"
                  style={{
                    background: 'rgba(74, 158, 255, 0.15)',
                    border: '1px solid rgba(74, 158, 255, 0.4)',
                    color: '#4a9eff',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  경기 정보 보기
                </button>
              </div>
            </div>

            {/* 아랫줄: 종목 | 경기타입 | 배당포함 | 경기날짜 */}
            <div className="grid-4 grid-4-margin">
              {/* 종목 선택 */}
              <div className="setting-item">
                <label className="setting-label">종목 (미선택시 전체)</label>
                <div className="filter-buttons">
                  {[
                    { value: 'soccer', label: '⚽축구' },
                    { value: 'basketball', label: '🏀농구' },
                    { value: 'volleyball', label: '🏐배구' },
                    { value: 'baseball', label: '⚾야구' },
                  ].map((sport) => (
                    <button
                      key={sport.value}
                      type="button"
                      onClick={() => toggleSport(sport.value)}
                      style={{
                        padding: '6px 8px',
                        fontSize: '0.75rem',
                        background: allowedSports.includes(sport.value)
                          ? 'rgba(74, 158, 255, 0.3)'
                          : 'rgba(255, 255, 255, 0.08)',
                        border: allowedSports.includes(sport.value)
                          ? '1px solid rgba(74, 158, 255, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sport.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 경기 타입 */}
              <div className="setting-item">
                <label className="setting-label">경기 타입</label>
                <div className="filter-buttons">
                  {[
                    { value: 'normal', label: '일반', color: { bg: 'rgba(33, 150, 243, 0.2)', border: 'rgba(33, 150, 243, 0.5)', text: '#2196f3' } },
                    { value: 'handicap', label: '핸디', color: { bg: 'rgba(255, 152, 0, 0.2)', border: 'rgba(255, 152, 0, 0.5)', text: '#ff9800' } },
                    { value: 'underover', label: 'U/O', color: { bg: 'rgba(76, 175, 80, 0.2)', border: 'rgba(76, 175, 80, 0.5)', text: '#4caf50' } },
                    { value: 'sum', label: '홀짝', color: { bg: 'rgba(255, 193, 7, 0.2)', border: 'rgba(255, 193, 7, 0.5)', text: '#ffc107' } },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => toggleMatchType(type.value)}
                      style={{
                        padding: '6px 8px',
                        fontSize: '0.75rem',
                        background: allowedMatchTypes.includes(type.value)
                          ? type.color.bg
                          : 'rgba(255, 255, 255, 0.08)',
                        border: allowedMatchTypes.includes(type.value)
                          ? `1px solid ${type.color.border}`
                          : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: allowedMatchTypes.includes(type.value) ? type.color.text : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 정배당/무배당/역배당 */}
              <div className="setting-item">
                <label className="setting-label">배당 포함</label>
                <div className="filter-buttons" style={{ alignItems: 'center' }}>
                  {[
                    { key: 'regular', label: '정배', active: includeRegularOdds, setActive: setIncludeRegularOdds, count: regularOddsCount, setCount: setRegularOddsCount, color: { bg: 'rgba(74, 158, 255, 0.2)', border: 'rgba(74, 158, 255, 0.5)', text: '#4a9eff' } },
                    { key: 'draw', label: '무', active: includeDraws, setActive: setIncludeDraws, count: drawCount, setCount: setDrawCount, color: { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.5)', text: '#22c55e' } },
                    { key: 'high', label: '역배', active: includeHighOdds, setActive: setIncludeHighOdds, count: highOddsCount, setCount: setHighOddsCount, color: { bg: 'rgba(255, 68, 68, 0.2)', border: 'rgba(255, 68, 68, 0.5)', text: '#ff4444' } },
                  ].map((item) => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => item.setActive(!item.active)}
                        style={{
                          padding: '6px 8px',
                          fontSize: '0.75rem',
                          background: item.active ? item.color.bg : 'rgba(255, 255, 255, 0.08)',
                          border: item.active ? `1px solid ${item.color.border}` : '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          color: item.active ? item.color.text : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.label}
                      </button>
                      {item.active && (
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={item.count}
                          onChange={(e) => item.setCount(Number(e.target.value))}
                          style={{
                            width: '36px',
                            padding: '4px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 날짜 필터 */}
              <div className="setting-item">
                <label className="setting-label">경기 날짜 (미선택시 전체)</label>
                <div className="filter-buttons">
                  {availableDates.map((dateInfo) => {
                    const [dateStr, dayOfWeek] = dateInfo.split('|');
                    const isSelected = selectedDates.includes(dateStr);
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => toggleDate(dateStr)}
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          background: isSelected
                            ? 'rgba(156, 39, 176, 0.3)'
                            : 'rgba(255, 255, 255, 0.08)',
                          border: isSelected
                            ? '1px solid rgba(156, 39, 176, 0.5)'
                            : '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          color: isSelected ? '#ce93d8' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {dateStr.replace('.', '/')}({dayOfWeek})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
        </div>

        {/* Combination Display */}
        <div className="combination-card" ref={combinationRef}>
          {combination ? (
            <>
              {/* 회차 정보 표시 */}
              {combination.matches.length > 0 && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  background: 'rgba(74, 158, 255, 0.1)',
                  border: '1px solid rgba(74, 158, 255, 0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.9rem', color: '#4a9eff', fontWeight: '600' }}>
                    📋 {formatRoundNumber(combination.matches[0].match.roundNumber)}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    {combination.matches.length}경기 조합
                  </span>
                </div>
              )}

              <div className="match-list">
                {combination.matches.map((item) => (
                  <div key={item.match.id} className="match-item">
                    <div className="match-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="match-league">{item.match.league}</span>
                        <span style={{
                          fontSize: '0.8rem',
                          color: '#888',
                          fontWeight: '500'
                        }}>
                          ⏰ {formatDeadline(item.match.deadline)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="match-sport-badge">{getSportLabel(item.match.sport)}</span>
                      </div>
                    </div>
                    <div className="match-teams" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: item.match.matchType === 'handicap'
                          ? 'rgba(255, 152, 0, 0.2)'  // 주황색 (핸디캡)
                          : item.match.matchType === 'underover'
                          ? 'rgba(76, 175, 80, 0.2)'  // 초록색 (언더오버)
                          : item.match.matchType === 'sum'
                          ? 'rgba(255, 193, 7, 0.2)'  // 노란색 (SUM)
                          : 'rgba(33, 150, 243, 0.2)', // 파란색 (일반)
                        border: item.match.matchType === 'handicap'
                          ? '1px solid rgba(255, 152, 0, 0.5)'
                          : item.match.matchType === 'underover'
                          ? '1px solid rgba(76, 175, 80, 0.5)'
                          : item.match.matchType === 'sum'
                          ? '1px solid rgba(255, 193, 7, 0.5)'
                          : '1px solid rgba(33, 150, 243, 0.5)',
                        color: item.match.matchType === 'handicap'
                          ? '#ff9800'  // 주황색
                          : item.match.matchType === 'underover'
                          ? '#4caf50'  // 초록색
                          : item.match.matchType === 'sum'
                          ? '#ffc107'  // 노란색
                          : '#2196f3',  // 파란색
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {getMatchTypeLabel(item.match.matchType, item.match.handicapValue, item.match.underOverValue)}
                      </span>
                      {item.match.isConditionChanged && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255, 87, 51, 0.2)',
                          border: '1px solid rgba(255, 87, 51, 0.5)',
                          color: '#ff5733',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}>
                          사전조건 변경
                        </span>
                      )}
                      <span>{item.match.homeTeam} vs {item.match.awayTeam}</span>
                    </div>
                    <div className="match-result" style={{ color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                          {String(item.match.gameNumber).padStart(3, '0')}
                        </span>
                        {item.match.isSingle && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: '1.5px solid #4a9eff',
                            color: '#4a9eff',
                            fontSize: '0.7rem',
                            fontWeight: '700'
                          }}>
                            S
                          </span>
                        )}
                        {item.match.isHalfTime && (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 152, 0, 0.2)',
                            border: '1px solid rgba(255, 152, 0, 0.5)',
                            color: '#ff9800',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            전반
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '1.1rem', fontWeight: '500', color: '#888' }}>
                        -
                      </span>
                      <span style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: getSelectionColor(item.selected)
                      }}>
                        {getSelectedLabel(item.selected, item.match.matchType)}
                      </span>
                      <span style={{
                        background: 'rgba(255, 193, 7, 0.2)',
                        color: '#ffc107',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '1.1rem',
                        fontWeight: '600'
                      }}>
                        {item.selectedOdds.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="combination-summary">
                <div className="summary-row">
                  <span className="summary-label">총 배당</span>
                  <span className="summary-value highlight">
                    {combination.totalOdds.toFixed(2)}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">배팅 금액</span>
                  <span className="summary-value">{formatNumber(betAmount)}원</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">예상 환급금</span>
                  <span className="summary-value highlight">
                    {formatNumber(combination.estimatedPayout)}원
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="combination-empty">
              <div className="combination-empty-icon">🎲</div>
              <div className="combination-empty-text">조합이 생성되지 않았습니다</div>
              <div className="combination-empty-subtext">
                아래 버튼을 눌러 랜덤 조합을 생성하세요
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="button-group">
          {combination ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowShareModal(true)}
              >
                📤 공유하기
              </button>
              <button className="btn btn-secondary" onClick={handleReset}>
                초기화
              </button>
              <button className="btn btn-primary" onClick={handleGenerate}>
                다시 하기
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleGenerate}>
              조합 생성
            </button>
          )}
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowShareModal(false)}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxWidth: '400px',
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  color: '#fff',
                  fontSize: '1.5rem',
                  marginBottom: '24px',
                  textAlign: 'center',
                }}
              >
                조합 공유하기
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={handleShareImage}
                  style={{
                    padding: '16px',
                    background: 'rgba(74, 158, 255, 0.2)',
                    border: '1px solid rgba(74, 158, 255, 0.5)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(74, 158, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(74, 158, 255, 0.2)';
                  }}
                >
                  📷 이미지로 저장
                </button>
                <button
                  onClick={handleShareKakao}
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 235, 59, 0.2)',
                    border: '1px solid rgba(255, 235, 59, 0.5)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 235, 59, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 235, 59, 0.2)';
                  }}
                >
                  💬 카카오톡 공유
                </button>
                <button
                  onClick={handleShareSMS}
                  style={{
                    padding: '16px',
                    background: 'rgba(76, 175, 80, 0.2)',
                    border: '1px solid rgba(76, 175, 80, 0.5)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(76, 175, 80, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(76, 175, 80, 0.2)';
                  }}
                >
                  📱 문자 메시지
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  style={{
                    padding: '12px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#888',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    marginTop: '8px',
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Matches Info Modal */}
        {showMatchesModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowMatchesModal(false)}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxWidth: '800px',
                width: '95%',
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', margin: 0 }}>
                  📋 발매중인 경기 정보
                </h3>
                <span style={{ color: '#888', fontSize: '0.85rem' }}>
                  {(() => {
                    const now = new Date();
                    return protoMatches.filter(m => m.status === 'open' && m.deadline > now).length;
                  })()}개 경기
                </span>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#1a1a1a', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#888', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>번호</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', color: '#888', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>경기</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#888', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>타입</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#4a9eff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>승</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#22c55e', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>무</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#ff4444', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>패</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#888', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>마감</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const now = new Date();
                      return protoMatches
                        .filter(m => m.status === 'open' && m.deadline > now)
                        .sort((a, b) => a.gameNumber - b.gameNumber)
                        .map((match) => (
                          <tr key={match.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#fff', fontWeight: '600' }}>
                              {String(match.gameNumber).padStart(3, '0')}
                              {match.isSingle && <span style={{ color: '#4a9eff', marginLeft: '4px', fontSize: '0.7rem' }}>S</span>}
                            </td>
                            <td style={{ padding: '8px', color: '#ccc' }}>
                              <div style={{ fontSize: '0.75rem', color: '#888' }}>{getSportLabel(match.sport)}</div>
                              {match.homeTeam} vs {match.awayTeam}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                background: match.matchType === 'handicap' ? 'rgba(255,152,0,0.2)' : match.matchType === 'underover' ? 'rgba(76,175,80,0.2)' : 'rgba(33,150,243,0.2)',
                                color: match.matchType === 'handicap' ? '#ff9800' : match.matchType === 'underover' ? '#4caf50' : '#2196f3',
                              }}>
                                {match.matchType === 'normal' ? '일반' : match.matchType === 'handicap' ? `핸디 ${match.handicapValue || ''}` : match.matchType === 'underover' ? `U/O ${match.underOverValue || ''}` : 'SUM'}
                              </span>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#4a9eff', fontWeight: '500' }}>
                              {match.matchType === 'underover' ? 'U' : match.matchType === 'sum' ? '홀' : ''} {match.odds.home.toFixed(2)}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#22c55e', fontWeight: '500' }}>
                              {match.odds.draw ? match.odds.draw.toFixed(2) : '-'}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#ff4444', fontWeight: '500' }}>
                              {match.matchType === 'underover' ? 'O' : match.matchType === 'sum' ? '짝' : ''} {match.odds.away.toFixed(2)}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#888', fontSize: '0.75rem' }}>
                              {formatDeadline(match.deadline)}
                            </td>
                          </tr>
                        ));
                    })()}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => setShowMatchesModal(false)}
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#888',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* Warning Notice */}
        <div style={{
          marginTop: '24px',
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '12px',
          fontSize: '0.8rem',
          color: '#ffc107',
          textAlign: 'center',
          lineHeight: '1.6',
        }}>
          ⚠️ 본 서비스는 랜덤 시뮬레이션 도구입니다. 실제 배팅을 권장하거나 예측하지 않습니다.
          <br />
          또한 배팅 결과와 관련해서는 아무런 책임이 없음을 다시 한번 안내드립니다.
        </div>
      </main>

      {/* Vercel Analytics */}
      <Analytics />
    </div>
  );
}

export default App;
