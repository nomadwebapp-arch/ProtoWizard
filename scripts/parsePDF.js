import fs from 'fs';
import path from 'path';

/**
 * PDF에서 프로토 경기 데이터 파싱
 */
async function parsePDF(pdfPath) {
  console.log('📖 PDF 파싱 시작...');

  try {
    // pdf-parse v2 사용
    const { PDFParse } = await import('pdf-parse');

    // PDF 파일을 Buffer로 읽기
    const dataBuffer = fs.readFileSync(pdfPath);

    // PDF 파서 생성 및 텍스트 추출 (data 옵션 사용)
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();

    console.log(`📄 PDF 페이지 수: ${result.pages?.length || 'N/A'}`);
    console.log(`📝 텍스트 길이: ${result.text.length} 자`);

    // 텍스트 파싱
    const matches = parseProtoMatches(result.text);

    console.log(`✅ 파싱 완료! 총 ${matches.length}개 경기`);

    return matches;

  } catch (error) {
    console.error('❌ PDF 파싱 실패:', error.message);
    throw error;
  }
}

/**
 * PDF 텍스트에서 경기 정보 추출 (한국시간 기준 마감시간 필터링 포함)
 *
 * betman PDF 구조:
 * 1. 게임 메타데이터 섹션 (경기번호, 리그, 타입, 마감시간)
 * 2. 팀명과 배당 섹션 (실제 팀 이름과 배당률)
 */
function parseProtoMatches(text) {
  const matches = [];

  // 회차 정보 추출 (예: "프로토 승부식 3회차")
  const roundMatch = text.match(/(\d+)회차/);
  const roundNumber = roundMatch ? roundMatch[1].padStart(6, '26000') : '260003';

  console.log(`\n📅 회차: ${roundNumber}`);

  // 현재 한국시간 (KST = UTC+9)
  const now = new Date();
  // getTimezoneOffset()는 UTC와의 차이를 분 단위로 반환 (UTC보다 앞서면 음수)
  // KST로 변환: 현재 시간 + (현재 offset + 540분)
  const kstNow = new Date(now.getTime() + (now.getTimezoneOffset() + 9 * 60) * 60000);

  console.log(`🕐 현재 한국시간: ${formatKST(kstNow)}\n`);

  // 줄 단위로 분리
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  // Phase 1: 게임 메타데이터 수집
  const gameMetadata = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 경기 번호 패턴: "75 01.06 (화)" 또는 "75"
    const gameNumMatch = line.match(/^(\d{2,3})\s+(\d{2})\.(\d{2})\s+\(.\)/);
    if (gameNumMatch) {
      const gameNumber = parseInt(gameNumMatch[1]);
      const month = gameNumMatch[2];
      const day = gameNumMatch[3];

      // 다음 줄들에서 정보 수집
      let league = '';
      let matchType = '';
      let deadline = '';
      let matchTime = '';

      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const nextLine = lines[j];

        // 마감시간 + 리그 (예: "23:00 마감 세리에A")
        if (nextLine.includes('마감')) {
          const parts = nextLine.split('\t');
          if (parts.length > 1) {
            league = parts[1].trim();
          }
          deadline = `${month}/${day} ${nextLine.match(/(\d{2}:\d{2})/)?.[1] || ''}`;
        }

        // 게임 타입 (일반, 핸디캡, 언더오버, SUM)
        if (nextLine === '일반' || nextLine === '핸디캡' || nextLine === '언더오버' || nextLine === 'SUM') {
          matchType = nextLine;
        }

        // 경기 시간 찾기
        if (nextLine.match(/^\d{2}\.\d{2}\s+\(.\)$/)) {
          const timeMatch = lines[j + 1]?.match(/^(\d{2}:\d{2})$/);
          if (timeMatch) {
            matchTime = `${nextLine.match(/(\d{2}\.\d{2})/)[1]} ${timeMatch[1]}`;
            break;
          }
        }
      }

      if (league && matchType) {
        gameMetadata.push({
          gameNumber,
          league,
          matchType,
          deadline,
          matchTime,
        });
      }
    }
  }

  console.log(`📋 수집된 게임 메타데이터: ${gameMetadata.length}개\n`);

  // Phase 2: 팀명과 배당 수집
  const teamOddsData = [];
  const seenTeams = new Set(); // 중복 제거용

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 팀명 패턴: "팀1 : 팀2" (날짜/시간/URL 패턴 제외)
    // 날짜 패턴이 아니고, 콜론을 포함하며, vs가 아닌 경우
    if (line.includes(':') &&
        !line.includes('vs') &&
        !line.match(/\d{2}\.\d{2}/) &&   // 날짜 패턴 제외 (01.06)
        !line.match(/\d{2}:\d{2}/) &&    // 시간 패턴 제외 (23:00)
        !line.match(/\d+\.\s+\d+\./) &&  // 날짜 패턴 제외 (26. 1. 6.)
        !line.match(/오전|오후/) &&       // 시간 표시 제외
        !line.match(/http/) &&           // URL 제외
        !line.match(/U\/O/) &&           // U/O 패턴 제외
        !line.match(/^H\s/)) {           // 핸디캡 패턴 제외

      const teamMatch = line.match(/^(.+?)\s*:\s*(.+?)(?:\s+승|\s+무|\s+패|\s+-|\t|$)/);
      if (teamMatch) {
        const homeTeam = teamMatch[1].trim();
        const awayTeam = teamMatch[2]
          .replace(/\s+승.*$/, '')
          .replace(/\s+무.*$/, '')
          .replace(/\s+패.*$/, '')
          .replace(/\s+-.*$/, '')
          .replace(/\t.*$/, '')
          .trim();

        // 유효한 팀 이름인지 확인 (한글, 영문, 숫자 포함)
        if (homeTeam.length > 1 && awayTeam.length > 1) {
          const teamKey = `${homeTeam}:${awayTeam}`;

          // 중복되지 않은 경우만 추가
          if (!seenTeams.has(teamKey)) {
            seenTeams.add(teamKey);

            // 다음 줄들에서 배당 추출
            const oddsInfo = extractTeamOdds(lines, i);

            teamOddsData.push({
              homeTeam,
              awayTeam,
              ...oddsInfo,
            });
          }
        }
      }
    }
  }

  console.log(`📋 수집된 팀/배당 데이터: ${teamOddsData.length}개\n`);

  // Phase 3: 메타데이터와 팀 데이터 매칭
  let teamDataIndex = 0;
  let currentBaseMatch = null;

  for (const meta of gameMetadata) {
    // 마감시간 파싱
    const deadline = parseDeadlineKST(meta.deadline);

    // 마감시간 체크
    if (deadline && deadline < kstNow) {
      console.log(`⏰ [${meta.gameNumber}] ${meta.league} ${meta.matchType} - 마감됨 (${formatKST(deadline)})`);
      continue;
    }

    // 새로운 기본 경기인지 확인 (일반 타입이면 새 경기 시작)
    if (meta.matchType === '일반' && teamDataIndex < teamOddsData.length) {
      currentBaseMatch = teamOddsData[teamDataIndex];
      teamDataIndex++;
    }

    if (currentBaseMatch) {
      const match = {
        id: `M${String(meta.gameNumber).padStart(3, '0')}`,
        baseMatchId: `BM${String(meta.gameNumber).padStart(3, '0')}`,
        roundNumber: roundNumber,
        gameNumber: meta.gameNumber,
        sport: getSportFromLeague(meta.league),
        league: meta.league,
        homeTeam: currentBaseMatch.homeTeam,
        awayTeam: currentBaseMatch.awayTeam,
        matchType: matchTypeToEnglish(meta.matchType),
        odds: getOddsForType(currentBaseMatch, meta.matchType),
        deadline: deadline || new Date(),
        status: 'open',
      };

      if (currentBaseMatch.handicapValue) {
        match.handicapValue = currentBaseMatch.handicapValue;
      }
      if (currentBaseMatch.underOverValue) {
        match.underOverValue = currentBaseMatch.underOverValue;
      }

      console.log(`✅ [${meta.gameNumber}] ${currentBaseMatch.homeTeam} vs ${currentBaseMatch.awayTeam} - ${meta.matchType} (${formatKST(deadline)})`);
      matches.push(match);
    }
  }

  console.log(`\n📊 총 ${matches.length}개 경기 (마감 전 경기만 포함)\n`);

  return matches;
}

/**
 * 팀 이름 라인에서 배당 정보 추출
 */
function extractTeamOdds(lines, startIndex) {
  const result = {
    normalOdds: {},
    handicapValue: null,
    underOverValue: null,
  };

  // 다음 10줄 정도 확인
  for (let i = startIndex + 1; i < Math.min(startIndex + 15, lines.length); i++) {
    const line = lines[i];

    // 핸디캡 값 (예: "H +1.0", "H -1.5")
    const handicapMatch = line.match(/H\s+([-+]?\d+\.?\d*)/);
    if (handicapMatch) {
      result.handicapValue = parseFloat(handicapMatch[1]);
    }

    // 언더오버 값 (예: "U/O 2.5")
    const uoMatch = line.match(/U\/O\s+(\d+\.?\d*)/);
    if (uoMatch) {
      result.underOverValue = parseFloat(uoMatch[1]);
    }

    // 배당률 (숫자로만 이루어진 줄)
    if (/^\d+\.\d+$/.test(line)) {
      const value = parseFloat(line);
      if (value >= 1.0 && value <= 50.0) {
        // 승/무/패 또는 U/O 배당
        if (!result.normalOdds.home) {
          result.normalOdds.home = value;
        } else if (!result.normalOdds.draw && lines[i - 1] === '무') {
          result.normalOdds.draw = value;
        } else if (!result.normalOdds.away) {
          result.normalOdds.away = value;
        }
      }
    }

    // 다음 팀이 나오면 중단
    if (i > startIndex + 1 && line.includes(':') && !line.includes('U/O')) {
      break;
    }
  }

  return result;
}

/**
 * 매치 타입을 영어로 변환
 */
function matchTypeToEnglish(type) {
  const map = {
    '일반': 'normal',
    '핸디캡': 'handicap',
    '언더오버': 'underover',
    'SUM': 'sum',
  };
  return map[type] || 'normal';
}

/**
 * 타입에 맞는 배당 반환
 */
function getOddsForType(teamData, matchType) {
  // 모든 타입에 대해 기본 배당 반환
  return teamData.normalOdds;
}

/**
 * 리그명 추출
 */
function extractLeague(line) {
  const leagues = ['KBL', 'NBA', 'KOVO남', 'KOVO여', 'EPL', '세리에A', '분데스리가', 'La Liga', 'A리그', 'U23아컵'];
  for (const league of leagues) {
    if (line.includes(league)) {
      return league;
    }
  }
  return 'Unknown';
}

/**
 * 리그에서 종목 추론
 */
function getSportFromLeague(league) {
  if (league.includes('KBL') || league.includes('NBA') || league.includes('KOVO')) {
    return 'basketball';
  }
  if (league.includes('KBO') || league.includes('MLB')) {
    return 'baseball';
  }
  return 'soccer';
}

/**
 * 배당 정보 및 마감시간 추출
 */
function extractOdds(lines, startIndex) {
  // 다음 몇 줄을 확인하여 배당과 마감시간 찾기
  let deadlineText = '';
  let oddsMatch = null;

  // 다음 5줄 정도 확인
  for (let i = 1; i <= 5 && startIndex + i < lines.length; i++) {
    const line = lines[startIndex + i];

    // 배당 찾기 (예: "1.85 3.20 2.10" 또는 "1.75 2.05")
    if (!oddsMatch) {
      const match = line.match(/([\d.]+)\s+([\d.]+)(?:\s+([\d.]+))?/);
      if (match && parseFloat(match[1]) >= 1.0 && parseFloat(match[1]) <= 50.0) {
        oddsMatch = match;
      }
    }

    // 마감시간 찾기 (예: "01/05 21:00", "2025/01/05 21:00")
    if (line.match(/\d{1,4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}/) ||
        line.match(/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}/)) {
      deadlineText = line;
    }
  }

  if (oddsMatch) {
    const hasDrawOdds = oddsMatch[3] !== undefined;

    return {
      matchType: 'normal',
      odds: {
        home: parseFloat(oddsMatch[1]),
        draw: hasDrawOdds ? parseFloat(oddsMatch[2]) : undefined,
        away: hasDrawOdds ? parseFloat(oddsMatch[3]) : parseFloat(oddsMatch[2]),
      },
      deadlineText: deadlineText,
    };
  }

  return null;
}

/**
 * 한국시간 마감시간 파싱
 * 예: "01/05 21:00", "01/06 23:00"
 */
function parseDeadlineKST(deadlineText) {
  if (!deadlineText) return null;

  try {
    // "01/05 21:00" 또는 "2025/01/05 21:00" 형식
    const match = deadlineText.match(/(?:(\d{4})\/)?(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})/);

    if (!match) return null;

    const year = match[1] ? parseInt(match[1]) : 2026; // 현재 년도
    const month = parseInt(match[2]) - 1; // 0-based
    const day = parseInt(match[3]);
    const hour = parseInt(match[4]);
    const minute = parseInt(match[5]);

    // PDF의 시간은 이미 KST 기준이므로, UTC 시간으로 변환
    // KST 시간을 UTC로: UTC = KST - 9시간
    const utcTime = Date.UTC(year, month, day, hour, minute, 0) - 9 * 60 * 60 * 1000;

    // Date 객체 생성 (로컬 시간대로 자동 변환됨)
    return new Date(utcTime);
  } catch (error) {
    console.error('마감시간 파싱 오류:', deadlineText, error);
    return null;
  }
}

/**
 * 한국시간 포맷팅
 */
function formatKST(date) {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hour}:${minute}`;
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const pdfPath = process.argv[2] || './downloads/proto.pdf';

  parsePDF(pdfPath)
    .then((matches) => {
      console.log('파싱된 경기 데이터:');
      console.log(JSON.stringify(matches, null, 2));

      // JSON 파일로 저장
      fs.writeFileSync('./matches.json', JSON.stringify(matches, null, 2));
      console.log('💾 matches.json 저장 완료!');
    })
    .catch((error) => {
      console.error('💥 오류:', error);
      process.exit(1);
    });
}

export default parsePDF;
