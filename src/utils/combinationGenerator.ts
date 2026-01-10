import type { Match, Combination, FilterOptions } from '../types/match';

/**
 * 랜덤 조합 생성 알고리즘
 * 필터 적용:
 * 1) 총배당 범위: 목표의 0.5~2배
 * 2) 단일 경기 배당 쏠림 금지 (전체의 70% 초과 제거)
 * 3) 배당 포함 필터 (정배당/무배당/역배당 개수 보장)
 */

const MAX_ATTEMPTS = 100;

export interface GenerationError {
  type: 'NO_MATCHES' | 'NOT_ENOUGH_MATCHES' | 'NOT_ENOUGH_DRAW_MATCHES' | 'DUPLICATE_MATCH' | 'ODDS_RANGE' | 'UNKNOWN';
  message: string;
}

export interface GenerationResult {
  success: boolean;
  combination?: Combination;
  error?: GenerationError;
}

export function generateRandomCombination(
  matches: Match[],
  options: FilterOptions
): GenerationResult {
  const {
    targetOdds = 0,
    matchCount: inputMatchCount = 0,
    betAmount = 1000,
    allowedSports,
    allowedMatchTypes,
    allowedDates,
    isFullRandom = false,
  } = options;

  // 완전 랜덤 모드: 경기 수 2~10 사이 랜덤
  const matchCount = isFullRandom || inputMatchCount === 0
    ? Math.floor(Math.random() * 9) + 2
    : inputMatchCount;

  // 사용 가능한 경기 필터링 (마감 시간 체크)
  const now = new Date();
  let availableMatches = matches.filter(m => m.status === 'open' && m.deadline > now);

  if (availableMatches.length === 0) {
    return {
      success: false,
      error: {
        type: 'NO_MATCHES',
        message: '현재 배팅 가능한 경기가 없습니다. 모든 경기가 마감되었습니다.'
      }
    };
  }

  if (allowedSports && allowedSports.length > 0) {
    availableMatches = availableMatches.filter(m => allowedSports.includes(m.sport));
  }

  if (allowedMatchTypes && allowedMatchTypes.length > 0) {
    availableMatches = availableMatches.filter(m => allowedMatchTypes.includes(m.matchType));
  }

  if (allowedDates && allowedDates.length > 0) {
    availableMatches = availableMatches.filter(m => {
      const month = String(m.deadline.getMonth() + 1).padStart(2, '0');
      const day = String(m.deadline.getDate()).padStart(2, '0');
      const dateStr = `${month}.${day}`;
      return allowedDates.includes(dateStr);
    });
  }

  if (availableMatches.length === 0) {
    return {
      success: false,
      error: {
        type: 'NO_MATCHES',
        message: '선택한 필터 조건에 맞는 경기가 없습니다. 필터를 완화해보세요.'
      }
    };
  }

  // baseMatchId 기준으로 중복 제거 (같은 경기의 다른 베팅 타입은 하나만)
  const uniqueBaseMatches = new Map<string, Match[]>();
  availableMatches.forEach(m => {
    if (!uniqueBaseMatches.has(m.baseMatchId)) {
      uniqueBaseMatches.set(m.baseMatchId, []);
    }
    uniqueBaseMatches.get(m.baseMatchId)!.push(m);
  });

  const uniqueMatchCount = uniqueBaseMatches.size;

  if (uniqueMatchCount < matchCount) {
    return {
      success: false,
      error: {
        type: 'NOT_ENOUGH_MATCHES',
        message: `선택 가능한 경기가 ${uniqueMatchCount}개뿐입니다. 조합 경기 수(${matchCount}개)를 줄이거나 필터를 완화해주세요.`
      }
    };
  }

  // 무배당 필요 개수 체크
  const requiredDraws = options.includeDraws ? (options.drawCount || 0) : 0;
  if (requiredDraws > 0) {
    const matchesWithDraw = availableMatches.filter(m => m.odds.draw !== undefined);
    const uniqueDrawMatches = new Set(matchesWithDraw.map(m => m.baseMatchId));

    if (uniqueDrawMatches.size < requiredDraws) {
      return {
        success: false,
        error: {
          type: 'NOT_ENOUGH_DRAW_MATCHES',
          message: `무배당 가능한 경기(축구)가 ${uniqueDrawMatches.size}개뿐입니다. 무배당 개수(${requiredDraws}개)를 줄이거나 축구 경기를 포함해주세요.`
        }
      };
    }
  }

  // 완전 랜덤 모드: 배당 제한 없음
  const minOdds = isFullRandom || targetOdds === 0 ? 0 : targetOdds * 0.5;
  const maxOdds = isFullRandom || targetOdds === 0 ? Infinity : targetOdds * 2;

  // 여러 번 시도
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const combination = tryGenerateCombination(
      availableMatches,
      matchCount,
      minOdds,
      maxOdds,
      betAmount,
      options
    );

    if (combination && validateCombination(combination, options)) {
      return { success: true, combination };
    }
  }

  // 목표 배당 때문에 실패했을 가능성 체크
  if (targetOdds > 0) {
    return {
      success: false,
      error: {
        type: 'ODDS_RANGE',
        message: `목표 배당(${targetOdds}배) 범위(${minOdds.toFixed(0)}~${maxOdds.toFixed(0)}배)에 맞는 조합을 찾지 못했습니다. 목표 배당을 비우거나 조정해보세요.`
      }
    };
  }

  return {
    success: false,
    error: {
      type: 'UNKNOWN',
      message: '조건에 맞는 조합을 찾을 수 없습니다. 필터 조건을 완화해보세요.'
    }
  };
}

function tryGenerateCombination(
  matches: Match[],
  count: number,
  minOdds: number,
  maxOdds: number,
  betAmount: number,
  options?: FilterOptions
): Combination | null {
  const requiredDraws = options?.includeDraws ? (options.drawCount || 0) : 0;
  const requiredRegular = options?.includeRegularOdds ? (options.regularOddsCount || 0) : 0;
  const requiredHigh = options?.includeHighOdds ? (options.highOddsCount || 0) : 0;

  // baseMatchId별로 그룹화
  const matchesByBase = new Map<string, Match[]>();
  matches.forEach(m => {
    if (!matchesByBase.has(m.baseMatchId)) {
      matchesByBase.set(m.baseMatchId, []);
    }
    matchesByBase.get(m.baseMatchId)!.push(m);
  });

  // 무배당이 필요한 경우: 무승부 옵션이 있는 경기 우선 선택
  const baseIdsWithDraw: string[] = [];
  const baseIdsWithoutDraw: string[] = [];

  matchesByBase.forEach((matchList, baseId) => {
    if (matchList.some(m => m.odds.draw !== undefined)) {
      baseIdsWithDraw.push(baseId);
    } else {
      baseIdsWithoutDraw.push(baseId);
    }
  });

  // 셔플
  const shuffledWithDraw = [...baseIdsWithDraw].sort(() => Math.random() - 0.5);
  const shuffledWithoutDraw = [...baseIdsWithoutDraw].sort(() => Math.random() - 0.5);

  // 필요한 무배당 경기 먼저 선택
  const selectedBaseIds: string[] = [];

  // 무배당용 경기 선택
  for (let i = 0; i < requiredDraws && i < shuffledWithDraw.length; i++) {
    selectedBaseIds.push(shuffledWithDraw[i]);
  }

  // 나머지 경기 선택 (무배당 경기 포함 가능)
  const remainingBaseIds = [
    ...shuffledWithDraw.slice(requiredDraws),
    ...shuffledWithoutDraw
  ].sort(() => Math.random() - 0.5);

  for (const baseId of remainingBaseIds) {
    if (selectedBaseIds.length >= count) break;
    if (!selectedBaseIds.includes(baseId)) {
      selectedBaseIds.push(baseId);
    }
  }

  if (selectedBaseIds.length < count) {
    return null;
  }

  // 각 baseId에서 랜덤하게 하나의 경기 타입 선택
  const selectedMatches: Match[] = [];
  for (const baseId of selectedBaseIds) {
    const matchList = matchesByBase.get(baseId)!;
    const randomMatch = matchList[Math.floor(Math.random() * matchList.length)];
    selectedMatches.push(randomMatch);
  }

  // 배당 할당을 위한 준비
  const assignments: { match: Match; selected: 'home' | 'draw' | 'away' }[] = [];
  const unassignedMatches = [...selectedMatches];

  // 1. 무배당 할당 (무승부 옵션이 있는 경기에)
  for (let i = 0; i < requiredDraws; i++) {
    const drawMatchIndex = unassignedMatches.findIndex(m => m.odds.draw !== undefined);
    if (drawMatchIndex === -1) return null;
    const match = unassignedMatches.splice(drawMatchIndex, 1)[0];
    assignments.push({ match, selected: 'draw' });
  }

  // 2. 정배당 할당 (낮은 배당 선택)
  for (let i = 0; i < requiredRegular; i++) {
    if (unassignedMatches.length === 0) return null;
    // 랜덤하게 선택
    const randomIndex = Math.floor(Math.random() * unassignedMatches.length);
    const match = unassignedMatches.splice(randomIndex, 1)[0];
    const selected = match.odds.home <= match.odds.away ? 'home' : 'away';
    assignments.push({ match, selected });
  }

  // 3. 역배당 할당 (높은 배당 선택)
  for (let i = 0; i < requiredHigh; i++) {
    if (unassignedMatches.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * unassignedMatches.length);
    const match = unassignedMatches.splice(randomIndex, 1)[0];
    const selected = match.odds.home >= match.odds.away ? 'home' : 'away';
    assignments.push({ match, selected });
  }

  // 4. 나머지는 랜덤 선택
  for (const match of unassignedMatches) {
    const availableOptions: Array<'home' | 'draw' | 'away'> = ['home', 'away'];
    if (match.odds.draw) availableOptions.push('draw');
    const selected = availableOptions[Math.floor(Math.random() * availableOptions.length)];
    assignments.push({ match, selected });
  }

  // Combination 생성
  const combinationMatches = assignments.map(a => ({
    match: a.match,
    selected: a.selected,
    selectedOdds: a.match.odds[a.selected]!,
  }));

  // 총배당 계산 (프로토 규칙: 소수점 셋째 자리 절사 후 둘째 자리 반올림)
  const rawOdds = combinationMatches.reduce((acc, m) => acc * m.selectedOdds, 1);
  const truncatedOdds = Math.floor(rawOdds * 1000) / 1000;
  const totalOdds = Math.round(truncatedOdds * 100) / 100;

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
  // 0. 동일 경기 중복 체크 (baseMatchId 기준)
  if (combination.matches.length >= 2) {
    const baseMatchIds = new Set<string>();
    for (const match of combination.matches) {
      if (baseMatchIds.has(match.match.baseMatchId)) {
        return false;
      }
      baseMatchIds.add(match.match.baseMatchId);
    }
  }

  // 1. 단일 경기 배당 쏠림 체크 (2경기 이상일 때만)
  if (combination.matches.length >= 2) {
    const totalOdds = combination.totalOdds;
    for (const match of combination.matches) {
      const contribution = match.selectedOdds / totalOdds;
      if (contribution > 0.7) {
        return false;
      }
    }
  }

  // 2. 배당 포함 필터 체크 (이미 할당 단계에서 보장되지만 이중 체크)
  if (options.includeRegularOdds || options.includeDraws || options.includeHighOdds) {
    let regularCount = 0;
    let drawCount = 0;
    let highCount = 0;

    for (const match of combination.matches) {
      const { selected, match: m } = match;
      const homeOdds = m.odds.home;
      const awayOdds = m.odds.away;

      if (selected === 'draw') {
        drawCount++;
      } else {
        const lowerOdds = Math.min(homeOdds, awayOdds);
        const higherOdds = Math.max(homeOdds, awayOdds);
        const selectedOdds = match.selectedOdds;

        if (selectedOdds === lowerOdds) {
          regularCount++;
        } else if (selectedOdds === higherOdds) {
          highCount++;
        }
      }
    }

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
