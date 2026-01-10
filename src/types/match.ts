export type Sport = 'soccer' | 'baseball' | 'basketball' | 'volleyball';
export type MatchType = 'normal' | 'handicap' | 'underover' | 'sum';
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
  handicapValue?: string;   // 핸디캡 기준점 (예: "H +2.5", "H -1.0")
  underOverValue?: string;  // 언더오버 기준점 (예: "U/O 160.5", "U/O 2.5")
  isSingle?: boolean;       // 싱글 베팅 가능 여부 (S 표시)
  isHalfTime?: boolean;     // 전반전 결과 예측 (전반 표시)
  isConditionChanged?: boolean;  // 사전조건 변경 여부
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
  targetOdds?: number;  // 목표 배당 (0이면 제한 없음)
  oddsRange?: {
    min: number;
    max: number;
  };
  matchCount?: number;  // 몇 폴더 (0이면 2~10 랜덤)
  betAmount?: number;   // 배팅 금액
  allowedSports?: Sport[];
  allowedMatchTypes?: MatchType[];
  allowedDates?: string[];  // 허용할 날짜들 (예: ["01.10", "01.11"])
  avoidSameLeague?: boolean;
  // 배당 포함 필터
  includeRegularOdds?: boolean;  // 정배당 포함
  regularOddsCount?: number;     // 정배당 개수
  includeDraws?: boolean;        // 무배당 포함
  drawCount?: number;            // 무배당 개수
  includeHighOdds?: boolean;     // 역배당 포함
  highOddsCount?: number;        // 역배당 개수
  isFullRandom?: boolean;        // 완전 랜덤 모드
}
