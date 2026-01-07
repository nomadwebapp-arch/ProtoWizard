# 프로토 데이터 자동 업데이트 가이드

## 📋 개요

betman.co.kr에서 프로토 경기 데이터를 자동으로 다운로드하고 파싱하여 `protoMatches.ts` 파일을 업데이트하는 자동화 시스템입니다.

## 🚀 사용 방법

### 1. 수동 실행 (로컬)

```bash
# 전체 프로세스 실행 (PDF 다운로드 → 파싱 → TS 파일 생성)
npm run update:proto

# 단계별 실행
npm run download:pdf  # PDF만 다운로드
npm run parse:pdf     # PDF만 파싱
```

### 2. 자동 실행 (GitHub Actions)

GitHub에 푸시하면 자동으로 3시간마다 실행됩니다.

```bash
# 수동으로 GitHub Actions 트리거
# GitHub 리포지토리 → Actions → "프로토 데이터 자동 업데이트" → Run workflow
```

## ⚙️ 설정

### betman.co.kr 셀렉터 수정

`scripts/downloadPDF.js` 파일에서 실제 betman.co.kr의 버튼 셀렉터를 확인하고 수정하세요:

```javascript
// 1. betman.co.kr 접속
// 2. F12 개발자 도구 열기
// 3. 인쇄 버튼 요소 검사
// 4. 셀렉터 복사
const printButtonSelector = '실제_셀렉터';  // 여기 수정!
```

### PDF 파싱 로직 조정

`scripts/parsePDF.js` 파일에서 PDF 구조에 맞게 파싱 로직을 조정하세요.

## 🔧 문제 해결

### PDF 다운로드 실패

1. betman.co.kr URL 확인
2. 인쇄 버튼 셀렉터 확인
3. Puppeteer 로그 확인

### 파싱 실패

1. PDF 파일 구조 확인
2. 정규표현식 패턴 조정
3. 테스트 PDF로 디버깅

## 📅 업데이트 스케줄

기본 설정: **3시간마다 자동 실행**

변경하려면 `.github/workflows/update-proto-data.yml` 수정:

```yaml
schedule:
  - cron: '0 */3 * * *'  # 3시간마다
  # - cron: '0 8,12,18,22 * * *'  # 8시, 12시, 18시, 22시만
```

## 🎯 작업 흐름

```
1. betman.co.kr 접속
   ↓
2. "인쇄하기" 클릭
   ↓
3. PDF 다운로드
   ↓
4. PDF 텍스트 추출
   ↓
5. 정규표현식으로 파싱
   ↓
6. JSON 데이터 생성
   ↓
7. protoMatches.ts 업데이트
   ↓
8. Git 커밋 & 푸시
   ↓
9. Vercel 자동 배포
```

## ✅ 체크리스트

- [ ] betman.co.kr URL 확인
- [ ] 인쇄 버튼 셀렉터 확인
- [ ] PDF 파싱 로직 테스트
- [ ] GitHub Actions 설정
- [ ] 첫 실행 테스트
- [ ] Vercel 자동 배포 확인

## 🔐 보안

- GitHub Actions는 `GITHUB_TOKEN`으로 자동 인증
- 추가 권한 필요 없음
- betman.co.kr 로그인 불필요

## 📝 로그 확인

GitHub Actions 로그:
```
GitHub 리포지토리 → Actions → 최근 워크플로우 클릭
```

## 🎉 완료!

이제 프로토 데이터가 자동으로 업데이트됩니다!
