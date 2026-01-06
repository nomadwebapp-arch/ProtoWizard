import { useState } from 'react';
import './App.css';
import { mockMatches } from './data/mockMatches';
import { generateRandomCombination } from './utils/combinationGenerator';
import type { Combination, FilterOptions } from './types/match';

function App() {
  const [combination, setCombination] = useState<Combination | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [clickCount, setClickCount] = useState(0);

  // Filter options state
  const [targetOdds, setTargetOdds] = useState(20);
  const [matchCount, setMatchCount] = useState(3);
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

  const handleGenerate = () => {
    // 마감 시간 체크 - 사용 가능한 경기 확인
    const now = new Date();
    const availableMatches = mockMatches.filter(m => m.status === 'open' && m.deadline > now);

    if (availableMatches.length === 0) {
      alert('현재 배팅 가능한 경기가 없습니다. 모든 경기가 마감되었습니다.');
      return;
    }

    if (availableMatches.length < matchCount) {
      alert(`배팅 가능한 경기가 ${availableMatches.length}개 뿐입니다. 조합 경기 수를 줄여주세요.`);
      return;
    }

    // 배당 포함 개수 검증
    const totalOddsCount =
      (includeRegularOdds ? regularOddsCount : 0) +
      (includeDraws ? drawCount : 0) +
      (includeHighOdds ? highOddsCount : 0);

    if (totalOddsCount > matchCount) {
      alert(`배당 포함 개수 합계(${totalOddsCount}개)가 조합 경기 수(${matchCount}개)를 초과할 수 없습니다!`);
      return;
    }

    const options: FilterOptions = {
      targetOdds,
      matchCount,
      betAmount,
      allowedSports: allowedSports.length > 0 ? allowedSports as any[] : undefined,
      allowedMatchTypes: allowedMatchTypes.length > 0 ? allowedMatchTypes as any[] : undefined,
    };

    const result = generateRandomCombination(mockMatches, options);
    setCombination(result);
    setClickCount(prev => prev + 1);

    // TODO: Ad logic - show ad every 5 clicks
    if (clickCount > 0 && clickCount % 5 === 0) {
      console.log('Show ad here (click count:', clickCount, ')');
    }
  };

  const handleReset = () => {
    setCombination(null);
    setTargetOdds(20);
    setMatchCount(3);
    setBetAmount(10000);
    setAllowedSports([]);
    setAllowedMatchTypes([]);
    setIncludeRegularOdds(false);
    setRegularOddsCount(1);
    setIncludeDraws(false);
    setDrawCount(1);
    setIncludeHighOdds(false);
    setHighOddsCount(1);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  const getSelectedLabel = (selected: 'home' | 'draw' | 'away') => {
    switch (selected) {
      case 'home':
        return '홈 승';
      case 'draw':
        return '무승부';
      case 'away':
        return '원정 승';
    }
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'normal':
        return '일반';
      case 'handicap':
        return '핸디캡';
      case 'underover':
        return '언더오버';
      default:
        return matchType;
    }
  };

  const formatRoundNumber = (roundNumber: string) => {
    // "260003" -> "2026년 프로토 3회차"
    const year = roundNumber.substring(0, 2); // "26"
    const round = parseInt(roundNumber.substring(2), 10); // "0003" -> 3
    return `20${year}년 프로토 ${round}회차`;
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
        <h1 className="app-title">ComOddsProto</h1>
        <p className="app-subtitle">프로토 배당 조합 생성기</p>
      </header>

      <main className="app-main">
        {/* Settings Panel */}
        {showSettings && (
          <div className="settings-panel">
            <h2 className="settings-title">조합 생성 조건 설정</h2>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">목표 배당</label>
                <input
                  type="number"
                  className="setting-input"
                  value={targetOdds || ''}
                  onChange={(e) => setTargetOdds(e.target.value === '' ? 0 : Number(e.target.value))}
                  min={10}
                  max={1000}
                  placeholder="20"
                />
              </div>

              <div className="setting-item">
                <label className="setting-label">조합 경기 수</label>
                <input
                  type="number"
                  className="setting-input"
                  value={matchCount || ''}
                  onChange={(e) => setMatchCount(e.target.value === '' ? 0 : Number(e.target.value))}
                  min={2}
                  max={10}
                  placeholder="3"
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
            </div>

            {/* 필터 섹션 - 구역별 분리 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginTop: '16px',
            }}>
              {/* 종목 선택 */}
              <div className="setting-item">
                <label className="setting-label">종목 (미선택시 전체)</label>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {[
                    { value: 'soccer', label: '⚽ 축구' },
                    { value: 'baseball', label: '⚾ 야구' },
                    { value: 'basketball', label: '🏀 농구' },
                  ].map((sport) => (
                    <button
                      key={sport.value}
                      type="button"
                      onClick={() => toggleSport(sport.value)}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        background: allowedSports.includes(sport.value)
                          ? 'rgba(74, 158, 255, 0.3)'
                          : 'rgba(255, 255, 255, 0.08)',
                        border: allowedSports.includes(sport.value)
                          ? '1px solid rgba(74, 158, 255, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
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
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {[
                    { value: 'normal', label: '일반' },
                    { value: 'handicap', label: '핸디캡' },
                    { value: 'underover', label: '언더오버' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => toggleMatchType(type.value)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        background: allowedMatchTypes.includes(type.value)
                          ? 'rgba(74, 158, 255, 0.3)'
                          : 'rgba(255, 255, 255, 0.08)',
                        border: allowedMatchTypes.includes(type.value)
                          ? '1px solid rgba(74, 158, 255, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
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
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* 정배당 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeRegularOdds}
                        onChange={(e) => setIncludeRegularOdds(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#aaa' }}>정배당</span>
                    </label>
                    {includeRegularOdds && (
                      <>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={regularOddsCount}
                          onChange={(e) => setRegularOddsCount(Number(e.target.value))}
                          style={{
                            width: '50px',
                            padding: '4px 8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.85rem',
                          }}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>개</span>
                      </>
                    )}
                  </div>

                  {/* 무배당 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeDraws}
                        onChange={(e) => setIncludeDraws(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#aaa' }}>무배당</span>
                    </label>
                    {includeDraws && (
                      <>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={drawCount}
                          onChange={(e) => setDrawCount(Number(e.target.value))}
                          style={{
                            width: '50px',
                            padding: '4px 8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.85rem',
                          }}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>개</span>
                      </>
                    )}
                  </div>

                  {/* 역배당 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeHighOdds}
                        onChange={(e) => setIncludeHighOdds(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#aaa' }}>역배당</span>
                    </label>
                    {includeHighOdds && (
                      <>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={highOddsCount}
                          onChange={(e) => setHighOddsCount(Number(e.target.value))}
                          style={{
                            width: '50px',
                            padding: '4px 8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.85rem',
                          }}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>개</span>
                      </>
                    )}
                  </div>
                </div>
                {/* 배당 포함 개수 합계 표시 */}
                {(() => {
                  const total =
                    (includeRegularOdds ? regularOddsCount : 0) +
                    (includeDraws ? drawCount : 0) +
                    (includeHighOdds ? highOddsCount : 0);
                  if (total > 0) {
                    const isExceeded = total > matchCount;
                    return (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '0.75rem',
                        color: isExceeded ? '#ff4444' : '#888',
                        fontWeight: isExceeded ? '600' : '400',
                      }}>
                        {isExceeded && '⚠️ '}
                        배당 포함 합계: {total}개 / 조합 경기 수: {matchCount}개
                        {isExceeded && ' (초과!)'}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Combination Display */}
        <div className="combination-card">
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
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span className="match-sport-badge">{item.match.sport}</span>
                        <span className="match-sport-badge" style={{ background: 'rgba(255, 193, 7, 0.2)', color: '#ffc107' }}>
                          {getMatchTypeLabel(item.match.matchType)}
                        </span>
                      </div>
                    </div>
                    <div className="match-teams">
                      {item.match.homeTeam} vs {item.match.awayTeam}
                    </div>
                    <div className="match-result" style={{ color: '#fff' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                        {String(item.match.gameNumber).padStart(3, '0')}
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '500', color: '#888' }}>
                        -
                      </span>
                      <span style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: getSelectionColor(item.selected)
                      }}>
                        {getSelectedLabel(item.selected)}
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
          <button className="btn btn-primary" onClick={handleGenerate}>
            {combination ? '새로운 조합 생성' : '조합 생성'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? '설정 숨기기' : '설정 보기'}
          </button>
          {combination && (
            <button className="btn btn-secondary" onClick={handleReset}>
              초기화
            </button>
          )}
        </div>

        {/* Warning Notice */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '12px',
          fontSize: '0.8rem',
          color: '#ffc107',
          textAlign: 'center',
        }}>
          ⚠️ 본 서비스는 랜덤 시뮬레이션 도구입니다. 실제 배팅을 권장하거나 예측하지 않습니다.
        </div>
      </main>
    </div>
  );
}

export default App;
