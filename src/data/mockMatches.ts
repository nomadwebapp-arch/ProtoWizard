import type { Match } from '../types/match';

// Mock data for testing
export const mockMatches: Match[] = [
  // 축구
  {
    id: 'M001',
    sport: 'soccer',
    league: 'EPL',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    matchType: 'normal',
    odds: {
      home: 2.10,
      draw: 3.20,
      away: 3.80,
    },
    deadline: new Date(Date.now() + 3600000 * 6), // 6시간 후
    status: 'open',
  },
  {
    id: 'M002',
    sport: 'soccer',
    league: 'EPL',
    homeTeam: 'Manchester City',
    awayTeam: 'Liverpool',
    matchType: 'normal',
    odds: {
      home: 1.95,
      draw: 3.50,
      away: 4.20,
    },
    deadline: new Date(Date.now() + 3600000 * 8),
    status: 'open',
  },
  {
    id: 'M003',
    sport: 'soccer',
    league: '분데스리가',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Dortmund',
    matchType: 'normal',
    odds: {
      home: 1.75,
      draw: 3.80,
      away: 5.50,
    },
    deadline: new Date(Date.now() + 3600000 * 10),
    status: 'open',
  },
  {
    id: 'M004',
    sport: 'soccer',
    league: 'La Liga',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    matchType: 'normal',
    odds: {
      home: 2.30,
      draw: 3.10,
      away: 3.40,
    },
    deadline: new Date(Date.now() + 3600000 * 12),
    status: 'open',
  },

  // 야구
  {
    id: 'M005',
    sport: 'baseball',
    league: 'MLB',
    homeTeam: 'NY Yankees',
    awayTeam: 'Boston Red Sox',
    matchType: 'normal',
    odds: {
      home: 1.85,
      away: 2.05,
    },
    deadline: new Date(Date.now() + 3600000 * 4),
    status: 'open',
  },
  {
    id: 'M006',
    sport: 'baseball',
    league: 'KBO',
    homeTeam: 'LG 트윈스',
    awayTeam: '삼성 라이온즈',
    matchType: 'normal',
    odds: {
      home: 2.15,
      away: 1.75,
    },
    deadline: new Date(Date.now() + 3600000 * 5),
    status: 'open',
  },

  // 농구
  {
    id: 'M007',
    sport: 'basketball',
    league: 'NBA',
    homeTeam: 'LA Lakers',
    awayTeam: 'Golden State Warriors',
    matchType: 'normal',
    odds: {
      home: 1.90,
      away: 1.95,
    },
    deadline: new Date(Date.now() + 3600000 * 7),
    status: 'open',
  },
  {
    id: 'M008',
    sport: 'basketball',
    league: 'NBA',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Miami Heat',
    matchType: 'normal',
    odds: {
      home: 1.70,
      away: 2.25,
    },
    deadline: new Date(Date.now() + 3600000 * 9),
    status: 'open',
  },

  // 추가 축구 경기
  {
    id: 'M009',
    sport: 'soccer',
    league: 'Serie A',
    homeTeam: 'Juventus',
    awayTeam: 'AC Milan',
    matchType: 'normal',
    odds: {
      home: 2.05,
      draw: 3.30,
      away: 3.90,
    },
    deadline: new Date(Date.now() + 3600000 * 11),
    status: 'open',
  },
  {
    id: 'M010',
    sport: 'soccer',
    league: 'Ligue 1',
    homeTeam: 'PSG',
    awayTeam: 'Marseille',
    matchType: 'normal',
    odds: {
      home: 1.50,
      draw: 4.20,
      away: 7.00,
    },
    deadline: new Date(Date.now() + 3600000 * 13),
    status: 'open',
  },
];
