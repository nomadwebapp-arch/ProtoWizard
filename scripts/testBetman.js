import puppeteer from 'puppeteer';

/**
 * betman.co.kr 페이지 구조 확인
 */
async function testBetmanPage() {
  console.log('🔍 betman.co.kr 페이지 구조 확인 중...\n');

  const browser = await puppeteer.launch({
    headless: false, // 브라우저 보이게 (디버깅용)
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // betman.co.kr 프로토 페이지 접속
    console.log('📄 페이지 접속 중...');
    await page.goto('https://www.betman.co.kr/proto/proto.do', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('✅ 페이지 로딩 완료!\n');

    // 페이지 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📋 페이지 제목: ${title}\n`);

    // '인쇄' 관련 요소 찾기
    console.log('🔍 "인쇄" 버튼 찾는 중...\n');

    const printButtons = await page.evaluate(() => {
      const buttons = [];

      // 모든 링크와 버튼 검색
      const elements = document.querySelectorAll('a, button, input[type="button"]');

      elements.forEach((el, index) => {
        const text = el.textContent?.trim() || '';
        const href = el.getAttribute('href') || '';
        const onclick = el.getAttribute('onclick') || '';
        const className = el.className || '';
        const id = el.id || '';

        // '인쇄' 관련 텍스트나 속성 찾기
        if (text.includes('인쇄') ||
            href.includes('print') ||
            onclick.includes('print') ||
            className.includes('print') ||
            id.includes('print')) {

          buttons.push({
            index,
            tag: el.tagName,
            text: text.substring(0, 50),
            href: href.substring(0, 100),
            onclick: onclick.substring(0, 100),
            className,
            id,
          });
        }
      });

      return buttons;
    });

    if (printButtons.length > 0) {
      console.log(`✅ 발견! ${printButtons.length}개의 인쇄 관련 요소:\n`);
      printButtons.forEach((btn, i) => {
        console.log(`[${i + 1}] ${btn.tag}`);
        console.log(`   텍스트: ${btn.text}`);
        if (btn.href) console.log(`   href: ${btn.href}`);
        if (btn.onclick) console.log(`   onclick: ${btn.onclick}`);
        if (btn.className) console.log(`   class: ${btn.className}`);
        if (btn.id) console.log(`   id: ${btn.id}`);
        console.log('');
      });
    } else {
      console.log('⚠️ "인쇄" 버튼을 찾지 못했습니다.');
      console.log('💡 수동으로 확인해보세요:\n');
      console.log('   1. 브라우저에서 betman.co.kr/proto 접속');
      console.log('   2. F12 개발자 도구 열기');
      console.log('   3. "인쇄하기" 버튼에 마우스 올리기');
      console.log('   4. 개발자 도구에서 요소 확인');
    }

    // PDF 직접 URL 찾기
    console.log('\n🔍 PDF 직접 링크 찾는 중...\n');

    const pdfLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a[href*=".pdf"], a[href*="print"]').forEach(a => {
        links.push({
          text: a.textContent?.trim(),
          href: a.href,
        });
      });
      return links;
    });

    if (pdfLinks.length > 0) {
      console.log('📄 PDF 링크 발견:');
      pdfLinks.forEach(link => {
        console.log(`   ${link.text}: ${link.href}`);
      });
    }

    console.log('\n⏸️  브라우저를 20초간 열어둡니다. 직접 확인해보세요!');
    console.log('💡 "인쇄하기" 버튼을 찾아서 클릭해보세요.\n');

    // 20초 대기 (수동 확인 시간)
    await new Promise(resolve => setTimeout(resolve, 20000));

    console.log('\n✅ 테스트 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

// 실행
testBetmanPage()
  .then(() => {
    console.log('\n🎉 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 실패:', error);
    process.exit(1);
  });
