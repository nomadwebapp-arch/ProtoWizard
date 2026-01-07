import type { Match, Combination, FilterOptions } from '../types/match';

/**
 * 랜덤 조합 생성 알고리즘
 * 4가지 필터 적용:
 * 1) 총배당 범위: 목표의 0.5~2배
 * 2) 단일 경기 배당 쏠림 금지 (전체의 70% 초과 제거)
 * 3) 동일 리그 과다 제거
 * 4) 극단적 고배당 몰림 제거
 */

const MAX_ATTEMPTS = 100; // 최대 시도 횟수

export function generateRandomCombination(
  matches: Match[],
  options: FilterOptions
): Combination | null {
  const {
    targetOdds = 100,
    matchCount = 5,
    betAmount = 1000,
    allowedSports,
    allowedMatchTypes,
  } = options;

  // 사용 가능한 경기 필터링 (마감 시간 체크 추가)
  const now = new Date();
  let availableMatches = matches.filter(m => m.status === 'open' && m.deadline > now);

  if (allowedSports && allowedSports.length > 0) {
    availableMatches = availableMatches.filter(m => allowedSports.includes(m.sport));
  }

  if (allowedMatchTypes && allowedMatchTypes.length > 0) {
    availableMatches = availableMatches.filter(m => allowedMatchTypes.includes(m.matchType));
  }

  // 경기가 충분하지 않으면 null 반환
  if (availableMatches.length < matchCount) {
    return null;
  }

  // 목표 배당 범위
  const minOdds = targetOdds * 0.5;
  const maxOdds = targetOdds * 2;

  // 여러 번 시도
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const combination = tryGenerateCombination(
      availableMatches,
      matchCount,
      minOdds,
      maxOdds,
      betAmount
    );

    if (combination && validateCombination(combination, options)) {
      return combination;
    }
  }

  // 실패 시 null 반환
  return null;
}

function tryGenerateCombination(
  matches: Match[],
  count: number,
  minOdds: number,
  maxOdds: number,
  betAmount: number
): Combination | null {
  // 랜덤하게 경기 선택
  const shuffled = [...matches].sort(() => Math.random() - 0.5);
  const selectedMatches = shuffled.slice(0, count);

  const combinationMatches = selectedMatches.map(match => {
    // 랜덤하게 홈/무/원정 선택
    const options: Array<'home' | 'draw' | 'away'> = ['home', 'away'];
    if (match.odds.draw) options.push('draw');

    const selected = options[Math.floor(Math.random() * options.length)];
    const selectedOdds = match.odds[selected]!;

    return {
      match,
      selected,
      selectedOdds,
    };
  });

  // 총배당 계산 (프로토 규칙: 소수점 셋째 자리 절사 후 둘째 자리 반올림)
  const rawOdds = combinationMatches.reduce((acc, m) => acc * m.selectedOdds, 1);
  const truncatedOdds = Math.floor(rawOdds * 1000) / 1000;  // 셋째 자리까지 절사
  const totalOdds = Math.round(truncatedOdds * 100) / 100;  // 둘째 자리 반올림

  // 배당 범위 체크
  if (totalOdds < minOdds || totalOdds > maxOdds) {
    return null;
  }

  // 경기 번호 기준 오름차순 정렬
  const sortedMatches = combinationMatches.sort((a, b) => a.match.gameNumber - b.match.gameNumber);

  return {
    matches: sortedMatches,
    totalOdds,
    estimatedPayout: Math.round(betAmount * totalOdds),
  };
}

function validateCombination(combination: Combination, options: FilterOptions): boolean {
  // 0. 동일 경기 중복 체크 (2경기 이상 조합일 때만 체크)
  if (combination.matches.length >= 2) {
    const baseMatchIds = new Set<string>();
    for (const match of combination.matches) {
      if (baseMatchIds.has(match.match.baseMatchId)) {
        return false;  // 동일 경기가 이미 포함됨
      }
      baseMatchIds.add(match.match.baseMatchId);
    }
  }

  // 1. 단일 경기 배당 쏠림 체크 (2경기 이상일 때만 체크)
  if (combination.matches.length >= 2) {
    const totalOdds = combination.totalOdds;
    for (const match of combination.matches) {
      const contribution = match.selectedOdds / totalOdds;
      if (contribution > 0.7) {
        return false;
      }
    }
  }

  // 2. 극단적 고배당 몰림 체크 (5.0 이상 배당이 2개 이상이면 제거)
  const highOddsCount = combination.matches.filter(m => m.selectedOdds >= 5.0).length;
  if (highOddsCount >= 2) {
    return false;
  }

  // 3. 배당 포함 필터 체크
  if (options.includeRegularOdds || options.includeDraws || options.includeHighOdds) {
    let regularCount = 0;  // 정배당 개수
    let drawCount = 0;     // 무배당 개수
    let highCount = 0;     // 역배당 개수

    for (const match of combination.matches) {
      const { selected, match: m } = match;
      const homeOdds = m.odds.home;
      const awayOdds = m.odds.away;

      // 무배당 체크 (무승부)
      if (selected === 'draw') {
        drawCount++;
      } else {
        // 정배당/역배당 체크 (홈/원정 중)
        const lowerOdds = Math.min(homeOdds, awayOdds);
        const higherOdds = Math.max(homeOdds, awayOdds);
        const selectedOdds = match.selectedOdds;

        if (selectedOdds === lowerOdds) {
          regularCount++;  // 정배당 (낮은 배당)
        } else if (selectedOdds === higherOdds) {
          highCount++;  // 역배당 (높은 배당)
        }
      }
    }

    // 요구사항 체크
    if (options.includeRegularOdds && regularCount < (options.regularOddsCount || 0)) {
      return false;
    }
    if (options.includeDraws && drawCount < (options.drawCount || 0)) {
      return false;
    }
    if (options.includeHighOdds && highCount < (options.highOddsCount || 0)) {
      return false;
    }
  }

  return true;
}
