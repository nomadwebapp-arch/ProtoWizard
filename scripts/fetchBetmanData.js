import puppeteer from 'puppeteer';
import fs from 'fs';

/**
 * betman 메인 페이지에서 현재 활성화된 회차 번호 가져오기
 */
async function getCurrentRound(browser) {
  const page = await browser.newPage();

  try {
    console.log('🔍 현재 활성화된 회차 확인 중...\n');

    // betman 프로토 승부식 페이지 접속 (gmTs 없이 → 자동으로 최신 회차로 리다이렉트됨)
    await page.goto('https://www.betman.co.kr/main/mainPage/gamebuy/gameSlip.do?gmId=G101', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // 리다이렉트 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 리다이렉트된 URL에서 gmTs 추출
    const currentUrl = page.url();
    console.log(`📍 리다이렉트된 URL: ${currentUrl}\n`);

    const urlMatch = currentUrl.match(/gmTs=(\d+)/);

    await page.close();

    if (urlMatch) {
      const currentRound = urlMatch[1];
      console.log(`✅ 자동 감지된 현재 회차: ${currentRound}\n`);
      return currentRound;
    } else {
      console.log('⚠️ URL에서 회차를 찾을 수 없습니다.\n');
      return null;
    }
  } catch (error) {
    console.error('❌ 현재 회차 확인 실패:', error.message);
    if (page) await page.close();
    return null;
  }
}

/**
 * betman.co.kr HTML 페이지에서 직접 데이터 추출
 */
async function fetchBetmanData(roundNumber = null) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // betman.co.kr 게임 슬립 페이지
    let url;
    if (roundNumber) {
      // 회차 번호가 지정되면 해당 회차
      url = `https://www.betman.co.kr/main/mainPage/gamebuy/gameSlip.do?gmId=G101&gmTs=${roundNumber}`;
      console.log(`🚀 betman.co.kr 데이터 가져오기 (지정 회차: ${roundNumber})\n`);
    } else {
      // 회차 번호가 없으면 gmTs 없이 → 자동으로 최신 회차 데이터
      url = `https://www.betman.co.kr/main/mainPage/gamebuy/gameSlip.do?gmId=G101`;
      console.log(`🚀 betman.co.kr 데이터 가져오기 (자동: 최신 회차)\n`);
    }

    console.log(`📄 페이지 접속 중: ${url}`);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('✅ 페이지 로딩 완료!\n');

    // 페이지 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🔍 경기 리스트 테이블 대기 중...\n');

    // 테이블이 로드될 때까지 대기
    await page.waitForSelector('#tbd_gmBuySlipList tr[data-matchseq]', { timeout: 10000 });

    // 페이지 끝까지 스크롤해서 모든 경기 로드 (여러 번 반복)
    console.log('📜 페이지 스크롤하여 모든 경기 로드 중...\n');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 200;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 150);
        });
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 스크롤 후 추가 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('✅ 테이블 로드 완료! 데이터 추출 중...\n');

    // HTML에서 경기 데이터 및 회차 정보 추출
    const { matches, debug, detectedRound } = await page.evaluate(() => {
      const matchList = [];
      const debugList = []; // 디버깅용

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

          // 리그/대회
          const leagueEl = row.querySelector('.fs11');
          const league = leagueEl?.textContent?.trim() || '';

          // 게임 타입 (일반, 핸디캡, 언더오버, SUM)
          const badgeEl = row.querySelector('.badge');
          const matchTypeKorean = badgeEl?.textContent?.trim() || '일반';

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
          const handicapValue = handicapEl?.textContent?.trim() || null;

          // 언더오버 값 (있는 경우)
          const underOverEl = row.querySelector('.udPoint.fcGreen');
          const underOverValue = underOverEl?.textContent?.trim() || null;

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
              matchType,
              homeTeam,
              awayTeam,
              handicapValue,
              underOverValue,
              odds,
              deadlineText,
              isSingle,
              isHalfTime,
            });
          }
        } catch (error) {
          console.error('경기 파싱 오류:', error);
        }
      });

      return { matches: matchList, debug: debugList, detectedRound: roundNumber };
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
      console.log(`    타입: ${d.matchType}, 배당 개수: ${d.oddsCount}`);
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

    return {
      roundNumber,
      matches,
    };

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const roundNumber = process.argv[2]; // 파라미터 없으면 자동 감지

  fetchBetmanData(roundNumber)
    .then((data) => {
      console.log(`\n✨ 완료! 총 ${data.matches.length}개 경기`);

      // JSON 파일로 저장
      fs.writeFileSync('./betman-data.json', JSON.stringify(data, null, 2));
      console.log('💾 betman-data.json 저장 완료!');
    })
    .catch((error) => {
      console.error('\n💥 실패:', error);
      process.exit(1);
    });
}

export default fetchBetmanData;
