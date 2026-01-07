import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

/**
 * betman.co.kr에서 프로토 PDF 자동 다운로드
 */
async function downloadProtoPDF() {
  console.log('🚀 PDF 다운로드 시작...');

  const browser = await puppeteer.launch({
    headless: true, // 브라우저 숨김 모드
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // 다운로드 경로 설정
    const downloadPath = path.resolve('./downloads');
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    // 다운로드 경로 설정
    await page._client().send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath,
    });

    // 현재 회차 정보 가져오기 (현재는 260003 고정)
    // TODO: 나중에 동적으로 가져오기
    const currentRound = '260003';

    // PDF URL 직접 접속
    const pdfUrl = `https://www.betman.co.kr/main/mainPage/gamebuy/printpopup/slipPrintPop.do?gmId=G101&gmTs=${currentRound}&gameYear=&year=undefined&externalMark=`;

    console.log(`📄 PDF URL 접속 중... (회차: ${currentRound})`);
    await page.goto(pdfUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // 페이지 로딩 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🖨️ PDF 생성 중...');

    // PDF로 저장
    const pdfPath = `${downloadPath}/proto_${currentRound}_${Date.now()}.pdf`;
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
    });

    console.log(`💾 PDF 저장 완료: ${pdfPath}`);

    console.log('✅ PDF 다운로드 완료!');
    console.log(`📁 저장 위치: ${pdfPath}`);

    return pdfPath;

  } catch (error) {
    console.error('❌ PDF 다운로드 실패:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadProtoPDF()
    .then(() => {
      console.log('🎉 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 오류 발생:', error);
      process.exit(1);
    });
}

export default downloadProtoPDF;
