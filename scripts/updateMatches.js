import downloadProtoPDF from './downloadPDF.js';
import parsePDF from './parsePDF.js';
import generateMatchesFile from './generateMatches.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * 전체 자동화 프로세스
 * 1. PDF 다운로드
 * 2. PDF 파싱
 * 3. TypeScript 파일 생성
 * 4. Git 커밋 & 푸시
 */
async function updateMatches() {
  console.log('🚀 프로토 경기 데이터 자동 업데이트 시작\n');

  try {
    // 1. PDF 다운로드
    console.log('1️⃣ PDF 다운로드...');
    const downloadPath = await downloadProtoPDF();

    // 다운로드된 PDF 파일 찾기
    const files = fs.readdirSync(downloadPath);
    const pdfFile = files.find(file => file.endsWith('.pdf'));

    if (!pdfFile) {
      throw new Error('PDF 파일을 찾을 수 없습니다.');
    }

    const pdfPath = path.join(downloadPath, pdfFile);
    console.log(`✅ PDF 파일: ${pdfPath}\n`);

    // 2. PDF 파싱
    console.log('2️⃣ PDF 파싱...');
    const matches = await parsePDF(pdfPath);
    console.log(`✅ ${matches.length}개 경기 파싱 완료\n`);

    // 3. TypeScript 파일 생성
    console.log('3️⃣ TypeScript 파일 생성...');
    generateMatchesFile(matches);
    console.log('✅ protoMatches.ts 업데이트 완료\n');

    // 4. Git 커밋 & 푸시 (선택사항)
    if (process.env.AUTO_COMMIT === 'true') {
      console.log('4️⃣ Git 커밋 & 푸시...');
      try {
        execSync('git add src/data/protoMatches.ts', { stdio: 'inherit' });
        execSync(`git commit -m "chore: 프로토 경기 데이터 자동 업데이트 (${new Date().toLocaleString('ko-KR')})"`, { stdio: 'inherit' });
        execSync('git push', { stdio: 'inherit' });
        console.log('✅ Git 푸시 완료\n');
      } catch (error) {
        console.log('⚠️ Git 커밋/푸시 실패 (변경사항이 없거나 권한 문제)');
      }
    }

    console.log('🎉 모든 작업 완료!');
    return matches;

  } catch (error) {
    console.error('💥 오류 발생:', error.message);
    throw error;
  }
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  updateMatches()
    .then(() => {
      console.log('\n✨ 성공적으로 완료되었습니다!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 실패:', error);
      process.exit(1);
    });
}

export default updateMatches;
