import puppeteer from 'puppeteer';
import fs from 'fs';

/**
 * betman 메인 페이지에서 현재 활성화된 회차 번호 가져오기
 */
async function getCurrentRound(browser) {
  const page = await browser.newPage();

  try {
    console.log('🔍 현재 활성화된 회차 확인 중...\n');

    // betman 프로토 승부식 페이지 접속
    await page.goto('https://www.betman.co.kr/main/mainPage/gamebuy/gameSlip.do?gmId=G101', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // JavaScript 실행 대기
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 1차: URL에서 gmTs 추출
    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}\n`);

    let urlMatch = currentUrl.match(/gmTs=(\d+)/);

    // 2차: URL에 없으면 페이지 내 select 옵션이나 hidden input에서 찾기
    if (!urlMatch) {
      console.log('🔍 페이지 내에서 회차 검색 중...\n');
      const roundFromPage = await page.evaluate(() => {
        // select 옵션에서 선택된 회차
        const select = document.querySelector('select[name="gmTs"], select.gmTs, #gmTs');
        if (select && select.value) return select.value;

        // hidden input에서 회차
        const hidden = document.querySelector('input[name="gmTs"]');
        if (hidden && hidden.value) return hidden.value;

        // URL 파라미터에서 (JavaScript로 변경된 경우)
        const params = new URLSearchParams(window.location.search);
        if (params.get('gmTs')) return params.get('gmTs');

        // 페이지 내 텍스트에서 6자리 회차 패턴 찾기
        const bodyText = document.body.innerText;
        const match = bodyText.match(/(\d{6})회/);
        if (match) return match[1];

        return null;
      });

      if (roundFromPage) {
        console.log(`✅ 페이지에서 감지된 회차: ${roundFromPage}\n`);
        await page.close();
        return roundFromPage;
      }
    }

    await page.close();

    if (urlMatch) {
      const currentRound = urlMatch[1];
      console.log(`✅ URL에서 감지된 회차: ${currentRound}\n`);
      return currentRound;
    } else {
      console.log('⚠️ 회차를 찾을 수 없습니다.\n');
      return null;
    }
  } catch (error) {
    console.error('❌ 현재 회차 확인 실패:', error.message);
    try { await page.close(); } catch (e) {}
    return null;
  }
}

/**
 * betman.co.kr HTML 페이지에서 직접 데이터 추출
 */
async function fetchBetmanData(roundNumber = null) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-cache',
      '--disable-application-cache',
      '--disable-offline-load-stale-cache',
      '--disk-cache-size=0',
    ],
    // userDataDir 제거 - 캐시 문제 해결
  });

  try {
    const page = await browser.newPage();

    // 한국 타임존으로 설정 (베트맨이 브라우저 타임존 기준으로 시간 표시)
    await page.emulateTimezone('Asia/Seoul');

    // 캐시 비활성화
    await page.setCacheEnabled(false);

    // 캐시 방지 헤더 설정
    await page.setExtraHTTPHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    // betman.co.kr 게임 슬립 페이지
    // 캐시 방지를 위해 타임스탬프 추가
    const cacheBuster = `_t=${Date.now()}`;
    let url;
    if (roundNumber) {
      // 회차 번호가 지정되면 해당 회차
      const year = `20${roundNumber.substring(0, 2)}`; // 260005 -> 2026
      url = `https://www.betman.co.kr/main/mainPage/gamebuy/gameSlip.do?gmId=G101&year=${year}&gmTs=${roundNumber}&${cacheBuster}`;
      console.log(`🚀 betman.co.kr 데이터 가져오기 (지정 회차: ${roundNumber}, 연도: ${year})\n`);
    } else {
      // 회차 번호가 없으면 gmTs 없이 → 자동으로 최신 회차 데이터
      url = `https://www.betman.co.kr/main/mainPage/gamebuy/gameSlip.do?gmId=G101&${cacheBuster}`;
      console.log(`🚀 betman.co.kr 데이터 가져오기 (자동: 최신 회차)\n`);
    }

    console.log(`📄 페이지 접속 중: ${url}`);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('✅ 페이지 로딩 완료!\n');

    // 페이지 대기 (더 긴 시간)
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔍 경기 리스트 테이블 대기 중...\n');

    // 테이블이 로드될 때까지 대기
    await page.waitForSelector('#tbd_gmBuySlipList tr[data-matchseq]', { timeout: 30000 });

    // 페이지 끝까지 스크롤해서 모든 경기 로드 (충분히 반복)
    console.log('📜 페이지 스크롤하여 모든 경기 로드 중...\n');

    let previousMatchCount = 0;
    let stableCount = 0;

    // 경기 수가 안정될 때까지 스크롤 (최대 50회 - 450개 이상 경기 대응)
    for (let i = 0; i < 50; i++) {
      // 스크롤 다운 (더 확실하게)
      await page.evaluate(async () => {
        // 페이지 끝까지 스크롤
        window.scrollTo(0, document.body.scrollHeight);
        // 추가로 테이블 컨테이너도 스크롤
        const tableContainer = document.querySelector('#tbd_gmBuySlipList')?.parentElement;
        if (tableContainer) {
          tableContainer.scrollTop = tableContainer.scrollHeight;
        }
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // 현재 로드된 경기 수 확인
      const currentMatchCount = await page.evaluate(() => {
        return document.querySelectorAll('#tbd_gmBuySlipList tr[data-matchseq]').length;
      });

      console.log(`  스크롤 ${i + 1}: ${currentMatchCount}개 경기 로드됨`);

      // 경기 수가 변하지 않으면 카운트 증가
      if (currentMatchCount === previousMatchCount) {
        stableCount++;
        // 5번 연속 같으면 완료 (더 확실하게)
        if (stableCount >= 5) {
          console.log(`  ✅ 모든 경기 로드 완료! (${currentMatchCount}개)\n`);
          break;
        }
      } else {
        stableCount = 0;
      }

      previousMatchCount = currentMatchCount;
    }

    // 스크롤 후 추가 대기
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('✅ 테이블 로드 완료! 데이터 추출 중...\n');

    // HTML에서 경기 데이터 및 회차 정보 추출
    const { matches, debug, detectedRound, finishedMatches, lastMatchNumber } = await page.evaluate(() => {
      const matchList = [];
      const finishedMatchList = []; // 결과발표된 경기 목록
      const debugList = []; // 디버깅용
      let maxMatchNumber = 0; // 전체 경기 중 가장 큰 번호

      // 회차 정보 추출 (페이지 타이틀이나 특정 요소에서)
      let roundNumber = null;

      // 방법 1: URL 파라미터에서
      const urlParams = new URLSearchParams(window.location.search);
      roundNumber = urlParams.get('gmTs');

      // 방법 2: 페이지 내 요소에서 (필요시)
      if (!roundNumber) {
        const titleElements = document.querySelectorAll('h1, h2, .title, .gmTs');
        for (const el of titleElements) {
          const match = el.textContent.match(/(\d{6})/);
          if (match) {
            roundNumber = match[1];
            break;
          }
        }
      }

      // 실제 경기 테이블 행들 찾기
      const rows = document.querySelectorAll('#tbd_gmBuySlipList tr[data-matchseq]');

      rows.forEach((row) => {
        try {
          // 경기 번호
          const matchSeq = row.getAttribute('data-matchseq');
          const gameNumber = parseInt(matchSeq);

          // 전체 경기 중 가장 큰 번호 추적
          if (gameNumber > maxMatchNumber) {
            maxMatchNumber = gameNumber;
          }

          // 종목 (아이콘 텍스트에서 추출)
          const sportIconEl = row.querySelector('.icoGame');
          const sportText = sportIconEl?.textContent?.trim() || '';

          // 리그/대회 (사전조건 변경 텍스트 분리)
          const leagueEl = row.querySelector('.fs11');
          let league = leagueEl?.textContent?.trim() || '';
          let isConditionChanged = false;

          // "사전조건 변경" 텍스트 감지 및 제거
          if (league.includes('사전조건 변경')) {
            isConditionChanged = true;
            league = league.replace('사전조건 변경', '').trim();
          }

          // 게임 타입 (일반, 핸디캡, 언더오버, SUM) 및 경기 상태 체크
          const badgeEl = row.querySelector('.badge');
          const matchTypeKorean = badgeEl?.textContent?.trim() || '일반';

          // 경기가 종료되어 결과가 발표된 경우 건너뛰기
          if (matchTypeKorean === '결과발표') {
            finishedMatchList.push({
              gameNumber,
              sportText,
              league,
              status: '결과발표'
            });
            debugList.push({
              gameNumber,
              status: '결과발표 (종료된 경기)',
              passed: false
            });
            return; // 이 경기는 matchList에 추가하지 않음
          }

          // 한글 → 영문 변환
          const matchTypeMap = {
            '일반': 'normal',
            '핸디캡': 'handicap',
            '언더오버': 'underover',
            'SUM': 'sum'
          };
          const matchType = matchTypeMap[matchTypeKorean] || 'normal';

          // 팀명 (scoreDiv 안의 .cell 요소들)
          const scoreDiv = row.querySelector('.scoreDiv');
          const teamCells = scoreDiv?.querySelectorAll('.cell');
          const homeTeam = teamCells?.[0]?.querySelector('span')?.textContent?.trim() || '';
          const awayTeam = teamCells?.[1]?.querySelector('span')?.textContent?.trim() || '';

          // 핸디캡 값 (있는 경우) - 축구(fcOrange), 농구(fcBlue3) 모두 지원
          const handicapEl = row.querySelector('.udPoint.fcOrange, .udPoint.fcBlue3');
          let handicapValue = handicapEl?.textContent?.trim() || null;

          // 핸디캡 값에서 "사전조건 변경" 제거
          if (handicapValue && handicapValue.includes('사전조건 변경')) {
            isConditionChanged = true;
            handicapValue = handicapValue.replace('사전조건 변경', '').trim();
          }

          // 언더오버 값 (있는 경우)
          const underOverEl = row.querySelector('.udPoint.fcGreen');
          let underOverValue = underOverEl?.textContent?.trim() || null;

          // 언더오버 값에서 "사전조건 변경" 제거
          if (underOverValue && underOverValue.includes('사전조건 변경')) {
            isConditionChanged = true;
            underOverValue = underOverValue.replace('사전조건 변경', '').trim();
          }

          // 싱글 가능 여부 (S 표시)
          const singleBadge = row.querySelector('.badge_type[title="한경기구매"]');
          const isSingle = !!singleBadge;

          // 전반전 타입 체크
          const halfBadge = row.querySelector('.badge_type2');
          const isHalfTime = halfBadge?.textContent?.trim() === '전반';

          // 배당률 (승/무/패 또는 U/O 또는 홀/짝)
          const oddsButtons = row.querySelectorAll('.btnChk');
          const odds = {};
          oddsButtons.forEach((btn, idx) => {
            const labelSpan = btn.querySelector('span:nth-child(2)');
            const valueSpan = btn.querySelector('span.db');

            if (!labelSpan || !valueSpan) return;

            const label = labelSpan.textContent?.trim();
            const valueText = valueSpan.childNodes[0]?.textContent?.trim(); // 첫 번째 텍스트 노드만 (배당률 변동 아이콘 제외)

            if (label && valueText) {
              const oddsValue = parseFloat(valueText);
              if (!isNaN(oddsValue)) {
                if (label === '승' || label === 'U' || label === '홀') {
                  odds.home = oddsValue;
                } else if (label === '무') {
                  odds.draw = oddsValue;
                } else if (label === '패' || label === 'O' || label === '짝') {
                  odds.away = oddsValue;
                }
              }
            }
          });

          // 마감시간
          const deadlineEl = row.querySelectorAll('td')[1];
          const deadlineText = deadlineEl?.textContent?.replace(/\s+/g, ' ').trim() || '';

          // 디버깅 정보 저장
          debugList.push({
            gameNumber,
            sportText,
            homeTeam,
            awayTeam,
            matchType,
            oddsCount: Object.keys(odds).length,
            odds,
            isSingle,
            isHalfTime,
            passed: !!(gameNumber && homeTeam && awayTeam && Object.keys(odds).length > 0)
          });

          if (gameNumber && homeTeam && awayTeam && Object.keys(odds).length > 0) {
            matchList.push({
              gameNumber,
              league,
              sportText,  // 베트맨에서 직접 추출한 종목 정보
              matchType,
              homeTeam,
              awayTeam,
              handicapValue,
              underOverValue,
              odds,
              deadlineText,
              isSingle,
              isHalfTime,
              isConditionChanged,  // 사전조건 변경 여부
            });
          }
        } catch (error) {
          console.error('경기 파싱 오류:', error);
        }
      });

      return {
        matches: matchList,
        debug: debugList,
        detectedRound: roundNumber,
        finishedMatches: finishedMatchList,
        lastMatchNumber: maxMatchNumber
      };
    });

    // 감지된 회차 정보 사용
    if (detectedRound && !roundNumber) {
      roundNumber = detectedRound;
      console.log(`✅ 페이지에서 회차 감지: ${roundNumber}\n`);
    } else if (detectedRound) {
      console.log(`✅ 감지된 회차 확인: ${detectedRound} (지정 회차: ${roundNumber})\n`);
    }

    // 회차가 여전히 없으면 기본값
    if (!roundNumber) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(2);
      const weekOfYear = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
      roundNumber = `${year}${String(weekOfYear).padStart(4, '0')}`;
      console.log(`⚠️ 회차 감지 실패, 추정값 사용: ${roundNumber}\n`);
    }

    console.log(`✅ ${matches.length}개 경기 데이터 추출 완료!\n`);

    // 디버깅 정보 출력
    console.log('🔍 디버깅 정보:\n');
    debug.forEach((d, i) => {
      console.log(`[${i + 1}] 경기 ${d.gameNumber}: ${d.homeTeam} vs ${d.awayTeam}`);
      console.log(`    종목: ${d.sportText || '미정'}, 타입: ${d.matchType}, 배당 개수: ${d.oddsCount}`);
      console.log(`    배당:`, d.odds);
      console.log(`    싱글: ${d.isSingle ? 'S ✅' : '❌'}, 전반: ${d.isHalfTime ? '✅' : '❌'}`);
      console.log(`    통과: ${d.passed ? '✅' : '❌'}\n`);
    });

    // 디버깅: 항상 HTML 저장
    const html = await page.content();
    fs.writeFileSync('./page.html', html);
    console.log('📄 페이지 HTML 저장: ./page.html (디버깅용)\n');

    if (matches.length === 0) {
      console.log('⚠️ 경기 데이터를 찾지 못했습니다.');
      console.log('💡 페이지 HTML 구조를 확인해야 합니다.\n');
    } else {
      // 추출된 데이터 확인
      console.log('📋 추출된 데이터 샘플:\n');
      matches.slice(0, 3).forEach((match, i) => {
        console.log(`[${i + 1}] ${match.gameNumber} - ${match.league} (${match.matchType})`);
        console.log(`    ${match.homeTeam} vs ${match.awayTeam}`);
        const oddsStr = `승: ${match.odds.home || '-'}, 무: ${match.odds.draw || '-'}, 패: ${match.odds.away || '-'}`;
        console.log(`    배당: ${oddsStr}`);
        if (match.handicapValue) console.log(`    핸디캡: ${match.handicapValue}`);
        if (match.underOverValue) console.log(`    언더오버: ${match.underOverValue}`);
        console.log(`    마감: ${match.deadlineText}\n`);
      });
    }

    // 종료된 경기 정보 출력
    if (finishedMatches && finishedMatches.length > 0) {
      console.log(`\n📊 결과발표된 경기: ${finishedMatches.length}개`);
      console.log(`🏁 마지막 경기 번호: ${lastMatchNumber}\n`);

      // 마지막 경기가 종료되었는지 체크
      const lastMatchFinished = finishedMatches.some(m => m.gameNumber === lastMatchNumber);
      if (lastMatchFinished) {
        console.log('✅ 마지막 경기가 종료되었습니다! (회차 전환 가능)\n');
      }
    }

    return {
      roundNumber,
      matches,
      finishedMatches: finishedMatches || [],
      lastMatchNumber: lastMatchNumber || 0,
    };

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * 다음 회차 번호 계산
 */
function getNextRound(currentRound) {
  const year = currentRound.substring(0, 2); // "26"
  const round = parseInt(currentRound.substring(2), 10); // "0004" -> 4
  const nextRound = round + 1;
  return `${year}${String(nextRound).padStart(4, '0')}`; // "260005"
}

/**
 * 마지막 경기가 종료되었는지 체크 (회차 전환 조건)
 * @param {Array} finishedMatches - 결과발표된 경기 목록
 * @param {number} lastMatchNumber - 전체 경기 중 가장 큰 번호
 * @returns {boolean} 마지막 경기가 종료되었으면 true
 */
function isLastMatchFinished(finishedMatches, lastMatchNumber) {
  if (!finishedMatches || finishedMatches.length === 0 || !lastMatchNumber) {
    return false;
  }

  // 마지막 경기 번호가 종료된 경기 목록에 있는지 체크
  return finishedMatches.some(m => m.gameNumber === lastMatchNumber);
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      // 1. current-round.json 읽기
      let currentRoundData;
      try {
        currentRoundData = JSON.parse(fs.readFileSync('./current-round.json', 'utf-8'));
        console.log(`📌 저장된 회차: ${currentRoundData.roundNumber}\n`);
      } catch (error) {
        console.log('⚠️ current-round.json 없음\n');
        currentRoundData = { roundNumber: '260001' };
      }

      // 2. 베트맨에서 현재 활성 회차 감지 (URL 리다이렉트 이용)
      console.log('🔍 베트맨에서 현재 활성 회차 확인 중...\n');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const detectedRound = await getCurrentRound(browser);
      await browser.close();

      // 3. 사용할 회차 결정
      let roundNumber;
      if (detectedRound) {
        roundNumber = detectedRound;
        if (detectedRound !== currentRoundData.roundNumber) {
          console.log(`🔄 회차 변경 감지! ${currentRoundData.roundNumber} → ${detectedRound}\n`);
        } else {
          console.log(`✅ 현재 회차 확인: ${roundNumber}\n`);
        }
      } else {
        roundNumber = currentRoundData.roundNumber;
        console.log(`⚠️ 회차 감지 실패, 저장된 회차 사용: ${roundNumber}\n`);
      }

      // 4. 해당 회차 데이터 가져오기
      let data = await fetchBetmanData(roundNumber);

      // 5. current-round.json 업데이트
      currentRoundData.roundNumber = roundNumber;
      fs.writeFileSync('./current-round.json', JSON.stringify(currentRoundData, null, 2));

      console.log(`\n✨ 완료! 총 ${data.matches.length}개 경기`);

      // 6. JSON 파일로 저장
      fs.writeFileSync('./betman-data.json', JSON.stringify(data, null, 2));
      console.log('💾 betman-data.json 저장 완료!');

    } catch (error) {
      console.error('\n💥 실패:', error);
      process.exit(1);
    }
  })();
}

export default fetchBetmanData;
