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
  const [targetOdds, setTargetOdds] = useState(100);
  const [matchCount, setMatchCount] = useState(5);
  const [betAmount, setBetAmount] = useState(10000);
  const [avoidSameLeague, setAvoidSameLeague] = useState(true);

  const handleGenerate = () => {
    const options: FilterOptions = {
      targetOdds,
      matchCount,
      betAmount,
      avoidSameLeague,
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
    setTargetOdds(100);
    setMatchCount(5);
    setBetAmount(10000);
    setAvoidSameLeague(true);
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
                  placeholder="100"
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
                  placeholder="5"
                />
              </div>

              <div className="setting-item">
                <label className="setting-label">배팅 금액 (원)</label>
                <input
                  type="number"
                  className="setting-input"
                  value={betAmount || ''}
                  onChange={(e) => setBetAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                  min={1000}
                  step={1000}
                  placeholder="10000"
                />
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={avoidSameLeague}
                    onChange={(e) => setAvoidSameLeague(e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  동일 리그 제한 (최대 2경기)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Combination Display */}
        <div className="combination-card">
          {combination ? (
            <>
              <div className="match-list">
                {combination.matches.map((item, index) => (
                  <div key={item.match.id} className="match-item">
                    <div className="match-header">
                      <span className="match-league">{item.match.league}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span className="match-sport-badge">{item.match.sport}</span>
                        <span className="match-sport-badge" style={{ background: 'rgba(255, 193, 7, 0.2)', color: '#ffc107' }}>
                          {getMatchTypeLabel(item.match.matchType)}
                        </span>
                      </div>
                    </div>
                    <div className="match-teams">
                      {index + 1}. {item.match.homeTeam} vs {item.match.awayTeam}
                    </div>
                    <div className="match-result">
                      <span className="match-selected">
                        {getSelectedLabel(item.selected)}
                      </span>
                      <span className="match-odds">{item.selectedOdds.toFixed(2)}</span>
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
