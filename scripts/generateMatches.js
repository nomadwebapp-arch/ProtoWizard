import fs from 'fs';
import path from 'path';

/**
 * JSON 데이터를 TypeScript 파일로 변환
 */
function generateMatchesFile(matches) {
  console.log('📝 TypeScript 파일 생성 중...');

  const template = `import type { Match } from '../types/match';

// 프로토 경기 데이터 (자동 생성됨 - ${new Date().toLocaleString('ko-KR')})
export const protoMatches: Match[] = ${JSON.stringify(matches, null, 2)
    .replace(/"new Date\(([^)]+)\)"/g, 'new Date($1)')
    .replace(/"(\w+)":/g, '$1:')};
`;

  const outputPath = path.resolve('./src/data/protoMatches.ts');

  try {
    fs.writeFileSync(outputPath, template, 'utf-8');
    console.log(`✅ TypeScript 파일 생성 완료: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('❌ 파일 생성 실패:', error.message);
    throw error;
  }
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const jsonPath = process.argv[2] || './matches.json';

  try {
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const matches = JSON.parse(jsonData);

    generateMatchesFile(matches);
    console.log('🎉 완료!');
  } catch (error) {
    console.error('💥 오류:', error);
    process.exit(1);
  }
}

export default generateMatchesFile;
