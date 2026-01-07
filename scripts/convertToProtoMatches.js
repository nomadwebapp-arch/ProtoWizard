import fs from 'fs';

/**
 * betman-data.json을 protoMatches.ts 형식으로 변환
 */

// betman-data.json 읽기
const betmanData = JSON.parse(fs.readFileSync('./betman-data.json', 'utf-8'));

// Sport 결정 함수 (팀명 기반)
function determineSport(homeTeam, awayTeam) {
  const teams = `${homeTeam} ${awayTeam}`.toLowerCase();

  // 배구 (V리그 팀)
  if (teams.includes('삼성화재') || teams.includes('kb손보') ||
      teams.includes('도로공사') || teams.includes('현대건설') ||
      teams.includes('페퍼저축') || teams.includes('흥국생명') ||
      teams.includes('한국전력') || teams.includes('현대캐피')) {
    return 'volleyball';
  }

  // 농구 (KBL, NBA 팀)
  if (teams.includes('lg') || teams.includes('삼성') || teams.includes('sk') ||
      teams.includes('kcc') || teams.includes('kt') || teams.includes('db') ||
      teams.includes('셀틱') || teams.includes('레이커') || teams.includes('워리') ||
      teams.includes('클리퍼') || teams.includes('76s') || teams.includes('닉스') ||
      teams.includes('랩터') || teams.includes('호네') || teams.includes('피스') ||
      teams.includes('불스') || teams.includes('위저') || teams.includes('호크') ||
      teams.includes('펠리') || teams.includes('매직') || teams.includes('네츠') ||
      teams.includes('그리') || teams.includes('선즈') || teams.includes('썬더') ||
      teams.includes('재즈') || teams.includes('스퍼') || teams.includes('벅스') ||
      teams.includes('로케') || teams.includes('트레')) {
    return 'basketball';
  }

  // 축구 (국가대표팀, 유럽 클럽)
  if (teams.includes('한국') || teams.includes('일본') || teams.includes('이란') ||
      teams.includes('시리아') || teams.includes('우즈베키') || teams.includes('레바논') ||
      teams.includes('카타르') || teams.includes('아랍') || teams.includes('사우디') ||
      teams.includes('바르셀로') || teams.includes('레알') || teams.includes('맨체스') ||
      teams.includes('리버풀') || teams.includes('첼시') || teams.includes('아스널') ||
      teams.includes('토트넘') || teams.includes('인테르') || teams.includes('밀란') ||
      teams.includes('나폴리') || teams.includes('아탈란타') || teams.includes('라치오') ||
      teams.includes('볼로냐') || teams.includes('파르마') || teams.includes('토리노') ||
      teams.includes('프랑크푸') || teams.includes('도르트문') || teams.includes('psg') ||
      teams.includes('마르세유') || teams.includes('빌바오') || teams.includes('본머스') ||
      teams.includes('브렌트퍼') || teams.includes('크리스털') || teams.includes('에버턴') ||
      teams.includes('풀럼') || teams.includes('울버햄프') || teams.includes('브라이턴') ||
      teams.includes('뉴캐슬') || teams.includes('번리') || teams.includes('선덜랜드') ||
      teams.includes('a빌라') || teams.includes('엘라스') || teams.includes('피오렌티') ||
      teams.includes('우디네세') || teams.includes('제노아') || teams.includes('칼리아리') ||
      teams.includes('크레모네') || teams.includes('헤타페') || teams.includes('소시에다') ||
      teams.includes('네이메헌') || teams.includes('위트레흐') || teams.includes('호주') ||
      teams.includes('태국') || teams.includes('중국') || teams.includes('이라크') ||
      teams.includes('베트남') || teams.includes('키르기스') || teams.includes('말리') ||
      teams.includes('세네갈') || teams.includes('요르단') || teams.includes('카메룬') ||
      teams.includes('모로코') || teams.includes('오클fc') || teams.includes('브리로어') ||
      teams.includes('리즈') || teams.includes('노팅엄포') || teams.includes('렉섬')) {
    return 'soccer';
  }

  // 야구
  if (teams.includes('mlb') || teams.includes('kbo') || teams.includes('npb') ||
      teams.includes('양키스') || teams.includes('다저스')) {
    return 'baseball';
  }

  // 기타 핸드볼
  if (teams.includes('이스') || teams.includes('안양') || teams.includes('울산') ||
      teams.includes('ok저축') || teams.includes('모비')) {
    return 'handball';
  }

  // 기본값: 농구
  return 'basketball';
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
    const sport = determineSport(match.homeTeam, match.awayTeam);
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
