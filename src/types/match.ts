export type Sport = 'soccer' | 'baseball' | 'basketball';
export type MatchType = 'normal' | 'handicap' | 'underover';
export type MatchStatus = 'open' | 'closed';

export interface Match {
  id: string;
  baseMatchId: string;  // 실제 경기 식별자 (동일 경기의 다른 베팅 타입은 같은 baseMatchId)
  roundNumber: string;  // 회차 번호 (예: "260003" = 26년도 3회차)
  gameNumber: number;   // 경기 번호 (회차 내 경기 순번)
  sport: Sport;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchType: MatchType;
  odds: {
    home: number;
    draw?: number;  // 축구만
    away: number;
  };
  deadline: Date;
  status: MatchStatus;
}

export interface Combination {
  matches: {
    match: Match;
    selected: 'home' | 'draw' | 'away';
    selectedOdds: number;
  }[];
  totalOdds: number;
  estimatedPayout: number;  // 배팅액 기준 예상 환급금
}

export interface FilterOptions {
  targetOdds?: number;  // 목표 배당
  oddsRange?: {
    min: number;
    max: number;
  };
  matchCount?: number;  // 몇 폴더
  betAmount?: number;   // 배팅 금액
  allowedSports?: Sport[];
  allowedMatchTypes?: MatchType[];
  avoidSameLeague?: boolean;
}
