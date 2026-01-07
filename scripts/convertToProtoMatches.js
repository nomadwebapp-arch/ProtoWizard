import fs from 'fs';

/**
 * betman-data.json을 protoMatches.ts 형식으로 변환
 */

// betman-data.json 읽기
const betmanData = JSON.parse(fs.readFileSync('./betman-data.json', 'utf-8'));

// 베트맨 종목 텍스트를 영문 코드로 변환
function convertSportText(sportText) {
  const sportMap = {
    '축구': 'soccer',
    '농구': 'basketball',
    '배구': 'volleyball',
    '야구': 'baseball',
  };

  return sportMap[sportText] || 'basketball'; // 기본값: basketball
}

// 마감시간 파싱 (한국시간 기준)
function parseDeadline(deadlineText, roundNumber) {
  // "01.07 (수)13:00 마감" 형식
  const match = deadlineText.match(/(\d{2})\.(\d{2})\s*\([^)]+\)(\d{2}):(\d{2})/);

  if (!match) {
    console.warn(`⚠️ 마감시간 파싱 실패: ${deadlineText}`);
    return 'new Date()';
  }

  const [_, month, day, hour, minute] = match;

  // 회차에서 연도 추출 (260003 -> 2026)
  const year = `20${roundNumber.substring(0, 2)}`;

  // KST 시간이므로 UTC로 변환 (-9시간)
  const kstDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00+09:00`);

  return `new Date('${kstDate.toISOString()}')`;
}

// baseMatchId 그룹 생성 (동일 팀 경기 = 동일 baseMatchId)
function generateBaseMatchIds(matches) {
  const baseMatchMap = new Map();
  const result = [];

  for (const match of matches) {
    const key = `${match.homeTeam}_${match.awayTeam}`;

    if (!baseMatchMap.has(key)) {
      baseMatchMap.set(key, `BM${match.gameNumber}`);
    }

    result.push({
      ...match,
      baseMatchId: baseMatchMap.get(key)
    });
  }

  return result;
}

// TypeScript 코드 생성
function generateTypeScriptCode(matches, roundNumber) {
  const processedMatches = generateBaseMatchIds(matches);

  let code = `import type { Match } from '../types/match';\n\n`;
  code += `// ${roundNumber.substring(0, 2)}년 프로토 ${parseInt(roundNumber.substring(2))}회차 실제 경기 데이터\n`;
  code += `export const protoMatches: Match[] = [\n`;

  for (const match of processedMatches) {
    const sport = convertSportText(match.sportText || '농구'); // betman에서 추출한 종목 사용
    const deadline = parseDeadline(match.deadlineText, roundNumber);

    code += `  {\n`;
    code += `    id: 'M${match.gameNumber}',\n`;
    code += `    baseMatchId: '${match.baseMatchId}',\n`;
    code += `    roundNumber: '${roundNumber}',\n`;
    code += `    gameNumber: ${match.gameNumber},\n`;
    code += `    sport: '${sport}',\n`;
    code += `    league: '${match.league}',\n`;
    code += `    homeTeam: '${match.homeTeam}',\n`;
    code += `    awayTeam: '${match.awayTeam}',\n`;
    code += `    matchType: '${match.matchType}',\n`;

    // 핸디캡 값
    if (match.handicapValue) {
      code += `    handicapValue: '${match.handicapValue}',\n`;
    }

    // 언더오버 값
    if (match.underOverValue) {
      code += `    underOverValue: '${match.underOverValue}',\n`;
    }

    // 싱글 가능 여부
    if (match.isSingle) {
      code += `    isSingle: true,\n`;
    }

    // 전반전 여부
    if (match.isHalfTime) {
      code += `    isHalfTime: true,\n`;
    }

    // 배당
    code += `    odds: {\n`;
    code += `      home: ${match.odds.home},\n`;
    if (match.odds.draw !== undefined) {
      code += `      draw: ${match.odds.draw},\n`;
    }
    code += `      away: ${match.odds.away},\n`;
    code += `    },\n`;

    code += `    deadline: ${deadline},\n`;
    code += `    status: 'open',\n`;
    code += `  },\n`;
  }

  code += `];\n`;

  return code;
}

// 실행
console.log('🔄 betman-data.json → protoMatches.ts 변환 중...\n');

const tsCode = generateTypeScriptCode(betmanData.matches, betmanData.roundNumber);

// 파일 저장
fs.writeFileSync('./src/data/protoMatches.ts', tsCode);

console.log(`✅ 변환 완료!`);
console.log(`📄 파일 저장: ./src/data/protoMatches.ts`);
console.log(`📊 경기 수: ${betmanData.matches.length}개\n`);

// 미리보기
console.log('📋 변환된 코드 미리보기:\n');
console.log(tsCode.split('\n').slice(0, 30).join('\n'));
console.log('...\n');
