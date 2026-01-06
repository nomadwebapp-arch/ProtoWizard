import type { Match } from '../types/match';

// 2026년 프로토 3회차 실제 경기 데이터 (2026.01.06 기준)
export const protoMatches: Match[] = [
  // 54번: 멜버시티 vs 브리로어 (A리그, 일반)
  {
    id: 'M054',
    baseMatchId: 'BM054',
    roundNumber: '260003',
    gameNumber: 54,
    sport: 'soccer',
    league: 'A리그',
    homeTeam: '멜버시티',
    awayTeam: '브리로어',
    matchType: 'normal',
    odds: {
      home: 1.72,
      draw: 3.10,
      away: 3.85,
    },
    deadline: new Date('2026-01-06T17:00:00'),
    status: 'open',
  },
  // 55번: 멜버시티 vs 브리로어 (A리그, 핸디캡)
  {
    id: 'M055',
    baseMatchId: 'BM054',  // 동일 경기
    roundNumber: '260003',
    gameNumber: 55,
    sport: 'soccer',
    league: 'A리그',
    homeTeam: '멜버시티',
    awayTeam: '브리로어',
    matchType: 'handicap',
    odds: {
      home: 3.15,
      draw: 3.15,
      away: 1.89,
    },
    deadline: new Date('2026-01-06T17:00:00'),
    status: 'open',
  },
  // 56번: 멜버시티 vs 브리로어 (A리그, 언더오버)
  {
    id: 'M056',
    baseMatchId: 'BM054',  // 동일 경기
    roundNumber: '260003',
    gameNumber: 56,
    sport: 'soccer',
    league: 'A리그',
    homeTeam: '멜버시티',
    awayTeam: '브리로어',
    matchType: 'underover',
    odds: {
      home: 1.62,  // Under
      away: 1.88,  // Over
    },
    deadline: new Date('2026-01-06T17:00:00'),
    status: 'open',
  },
  // 58번: 울산모비스 vs 부산KCC (KBL, 일반)
  {
    id: 'M058',
    baseMatchId: 'BM058',
    roundNumber: '260003',
    gameNumber: 58,
    sport: 'basketball',
    league: 'KBL',
    homeTeam: '울산모비스',
    awayTeam: '부산KCC',
    matchType: 'normal',
    odds: {
      home: 2.00,
      away: 1.54,
    },
    deadline: new Date('2026-01-06T19:00:00'),
    status: 'open',
  },
  // 59번: 울산모비스 vs 부산KCC (KBL, 승5패)
  {
    id: 'M059',
    baseMatchId: 'BM058',  // 동일 경기
    roundNumber: '260003',
    gameNumber: 59,
    sport: 'basketball',
    league: 'KBL',
    homeTeam: '울산모비스',
    awayTeam: '부산KCC',
    matchType: 'normal',
    odds: {
      home: 3.10,
      draw: 2.55,  // 승5패의 중간 구간
      away: 2.23,
    },
    deadline: new Date('2026-01-06T19:00:00'),
    status: 'open',
  },
  // 60번: 울산모비스 vs 부산KCC (KBL, 핸디캡)
  {
    id: 'M060',
    baseMatchId: 'BM058',  // 동일 경기
    roundNumber: '260003',
    gameNumber: 60,
    sport: 'basketball',
    league: 'KBL',
    homeTeam: '울산모비스',
    awayTeam: '부산KCC',
    matchType: 'handicap',
    odds: {
      home: 1.75,
      away: 1.73,
    },
    deadline: new Date('2026-01-06T19:00:00'),
    status: 'open',
  },
  // 61번: 울산모비스 vs 부산KCC (KBL, 언더오버)
  {
    id: 'M061',
    baseMatchId: 'BM058',  // 동일 경기
    roundNumber: '260003',
    gameNumber: 61,
    sport: 'basketball',
    league: 'KBL',
    homeTeam: '울산모비스',
    awayTeam: '부산KCC',
    matchType: 'underover',
    odds: {
      home: 1.72,  // Under
      away: 1.76,  // Over
    },
    deadline: new Date('2026-01-06T19:00:00'),
    status: 'open',
  },
  // 63번: 한국전력 vs OK저축은행 (KOVO남, 일반)
  {
    id: 'M063',
    baseMatchId: 'BM063',
    roundNumber: '260003',
    gameNumber: 63,
    sport: 'basketball',
    league: 'KOVO남',
    homeTeam: '한국전력',
    awayTeam: 'OK저축은행',
    matchType: 'normal',
    odds: {
      home: 1.43,
      away: 2.22,
    },
    deadline: new Date('2026-01-06T19:00:00'),
    status: 'open',
  },
  // 64번: 한국전력 vs OK저축은행 (KOVO남, 핸디캡)
  {
    id: 'M064',
    baseMatchId: 'BM063',  // 동일 경기
    roundNumber: '260003',
    gameNumber: 64,
    sport: 'basketball',
    league: 'KOVO남',
    homeTeam: '한국전력',
    awayTeam: 'OK저축은행',
    matchType: 'handicap',
    odds: {
      home: 1.84,
      away: 1.65,
    },
    deadline: new Date('2026-01-06T19:00:00'),
    status: 'open',
  },
  // 65번: 한국전력 vs OK저축은행 (KOVO남, 언더오버)
  {
    id: 'M065',
    baseMatchId: 'BM063',  // 동일 경기
    roundNumber: '260003',
    gameNumber: 65,
    sport: 'basketball',
    league: 'KOVO남',
    homeTeam: '한국전력',
    awayTeam: 'OK저축은행',
    matchType: 'underover',
    odds: {
      home: 1.79,  // Under
      away: 1.69,  // Over
    },
    deadline: new Date('2026-01-06T19:00:00'),
    status: 'open',
  },
  // 67번: GS칼텍스 vs 페퍼저축은행 (KOVO여, 일반)
  {
    id: 'M067',
    baseMatchId: 'BM067',
    roundNumber: '260003',
    gameNumber: 67,
    sport: 'basketball',
    league: 'KOVO여',
    homeTeam: 'GS칼텍스',
    awayTeam: '페퍼저축은행',
    matchType: 'normal',
    odds: {
      home: 1.23,
      away: 2.97,
    },
    deadline: new Date('2026-01-06T19:00:00'),
    status: 'open',
  },
  // 71번: 베트남 vs 요르단 (U23아컵, 일반)
  {
    id: 'M071',
    baseMatchId: 'BM071',
    roundNumber: '260003',
    gameNumber: 71,
    sport: 'soccer',
    league: 'U23아컵',
    homeTeam: '베트남',
    awayTeam: '요르단',
    matchType: 'normal',
    odds: {
      home: 3.80,
      draw: 3.00,
      away: 1.77,
    },
    deadline: new Date('2026-01-06T20:30:00'),
    status: 'open',
  },
  // 75번: 피사SC vs 코모1907 (세리에A, 일반)
  {
    id: 'M075',
    baseMatchId: 'BM075',
    roundNumber: '260003',
    gameNumber: 75,
    sport: 'soccer',
    league: '세리에A',
    homeTeam: '피사SC',
    awayTeam: '코모1907',
    matchType: 'normal',
    odds: {
      home: 4.65,
      draw: 3.40,
      away: 1.53,
    },
    deadline: new Date('2026-01-06T23:00:00'),
    status: 'open',
  },
  // 80번: 사우디 vs 키르기스 (U23아컵, 일반)
  {
    id: 'M080',
    baseMatchId: 'BM080',
    roundNumber: '260003',
    gameNumber: 80,
    sport: 'soccer',
    league: 'U23아컵',
    homeTeam: '사우디',
    awayTeam: '키르기스',
    matchType: 'normal',
    odds: {
      home: 1.20,
      draw: 4.35,
      away: 10.00,
    },
    deadline: new Date('2026-01-06T23:00:00'),
    status: 'open',
  },
  // 90번: US레체 vs AS로마 (세리에A, 일반)
  {
    id: 'M090',
    baseMatchId: 'BM090',
    roundNumber: '260003',
    gameNumber: 90,
    sport: 'soccer',
    league: '세리에A',
    homeTeam: 'US레체',
    awayTeam: 'AS로마',
    matchType: 'normal',
    odds: {
      home: 4.95,
      draw: 3.25,
      away: 1.53,
    },
    deadline: new Date('2026-01-06T23:00:00'),
    status: 'open',
  },
  // 99번: 사수올로 vs 유벤투스 (세리에A, 일반)
  {
    id: 'M099',
    baseMatchId: 'BM099',
    roundNumber: '260003',
    gameNumber: 99,
    sport: 'soccer',
    league: '세리에A',
    homeTeam: '사수올로',
    awayTeam: '유벤투스',
    matchType: 'normal',
    odds: {
      home: 4.65,
      draw: 3.45,
      away: 1.52,
    },
    deadline: new Date('2026-01-06T23:00:00'),
    status: 'open',
  },
  // 104번: 웨스트햄 vs 노팅엄포레스트 (EPL, 일반)
  {
    id: 'M104',
    baseMatchId: 'BM104',
    roundNumber: '260003',
    gameNumber: 104,
    sport: 'soccer',
    league: 'EPL',
    homeTeam: '웨스트햄',
    awayTeam: '노팅엄포레스트',
    matchType: 'normal',
    odds: {
      home: 2.80,
      draw: 3.10,
      away: 2.07,
    },
    deadline: new Date('2026-01-06T23:00:00'),
    status: 'open',
  },
  // 109번: 인디애나페이서스 vs 클리블랜드캐벌리어스 (NBA, 일반)
  {
    id: 'M109',
    baseMatchId: 'BM109',
    roundNumber: '260003',
    gameNumber: 109,
    sport: 'basketball',
    league: 'NBA',
    homeTeam: '인디애나페이서스',
    awayTeam: '클리블랜드캐벌리어스',
    matchType: 'normal',
    odds: {
      home: 2.55,
      away: 1.32,
    },
    deadline: new Date('2026-01-07T09:00:00'),
    status: 'open',
  },
  // 113번: 워싱턴위저즈 vs 올랜도매직 (NBA, 일반)
  {
    id: 'M113',
    baseMatchId: 'BM113',
    roundNumber: '260003',
    gameNumber: 113,
    sport: 'basketball',
    league: 'NBA',
    homeTeam: '워싱턴위저즈',
    awayTeam: '올랜도매직',
    matchType: 'normal',
    odds: {
      home: 2.97,
      away: 1.23,
    },
    deadline: new Date('2026-01-07T09:00:00'),
    status: 'open',
  },
  // 117번: 멤피스그리즐리스 vs 샌안토니오스퍼스 (NBA, 일반)
  {
    id: 'M117',
    baseMatchId: 'BM117',
    roundNumber: '260003',
    gameNumber: 117,
    sport: 'basketball',
    league: 'NBA',
    homeTeam: '멤피스그리즐리스',
    awayTeam: '샌안토니오스퍼스',
    matchType: 'normal',
    odds: {
      home: 2.59,
      away: 1.31,
    },
    deadline: new Date('2026-01-07T10:00:00'),
    status: 'open',
  },
  // 121번: 미네소타팀버울브스 vs 마이애미히트 (NBA, 일반)
  {
    id: 'M121',
    baseMatchId: 'BM121',
    roundNumber: '260003',
    gameNumber: 121,
    sport: 'basketball',
    league: 'NBA',
    homeTeam: '미네소타팀버울브스',
    awayTeam: '마이애미히트',
    matchType: 'normal',
    odds: {
      home: 1.36,
      away: 2.41,
    },
    deadline: new Date('2026-01-07T10:00:00'),
    status: 'open',
  },
  // 125번: 뉴올리언스펠리컨스 vs LA레이커스 (NBA, 일반)
  {
    id: 'M125',
    baseMatchId: 'BM125',
    roundNumber: '260003',
    gameNumber: 125,
    sport: 'basketball',
    league: 'NBA',
    homeTeam: '뉴올리언스펠리컨스',
    awayTeam: 'LA레이커스',
    matchType: 'normal',
    odds: {
      home: 2.45,
      away: 1.35,
    },
    deadline: new Date('2026-01-07T10:00:00'),
    status: 'open',
  },
  // 129번: 새크라멘토킹스 vs 댈러스매버릭스 (NBA, 일반)
  {
    id: 'M129',
    baseMatchId: 'BM129',
    roundNumber: '260003',
    gameNumber: 129,
    sport: 'basketball',
    league: 'NBA',
    homeTeam: '새크라멘토킹스',
    awayTeam: '댈러스매버릭스',
    matchType: 'normal',
    odds: {
      home: 2.59,
      away: 1.31,
    },
    deadline: new Date('2026-01-07T13:00:00'),
    status: 'open',
  },
];
