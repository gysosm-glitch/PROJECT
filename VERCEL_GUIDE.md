# Vercel 배포 및 모니터링 가이드

## 📍 Vercel 대시보드 접근

### 1️⃣ 대시보드 URL
```
https://vercel.com/dashboard
```

### 2️⃣ 로그인 방법
- GitHub 계정으로 로그인
- 프로젝트 자동 연동 (GitHub 저장소 연결됨)

---

## 🎯 Vercel에서 확인할 주요 항목

### 1. 배포 상태 (Deployments)

#### 📍 위치
```
Dashboard → 프로젝트 선택 → Deployments 탭
```

#### 🔍 확인 항목

**배포 상태 (Deployment Status):**
```
┌─────────────────────────────────────┐
│ Status: ✅ Ready                    │
│ Duration: 2m 34s                    │
│ Created: 2026-05-28 14:30 UTC       │
│                                     │
│ [Production] [Preview] [Staging]    │
└─────────────────────────────────────┘
```

| 상태 | 의미 | 색상 |
|------|------|------|
| ✅ Ready | 배포 완료, 서비스 중 | 초록색 |
| 🔄 Building | 빌드 진행 중 | 파란색 |
| ⏳ Queued | 빌드 대기 중 | 회색 |
| ❌ Error | 빌드 또는 배포 실패 | 빨강색 |
| 🚫 Canceled | 배포 취소됨 | 회색 |

**배포 목록:**
```
최신 배포부터 역순으로 표시

1. 1ea1371 - feat: PRD v2.0 기반 UI 개선
   Status: ✅ Ready (2h ago)
   Branch: main
   Commit: 1ea1371 (6글자)

2. ad725c7 - feat: 스포츠 시설 코트별 분리
   Status: ✅ Ready (5h ago)
   Branch: main
   Commit: ad725c7

3. c2c928b - fix: resolve cardinality constraint
   Status: ✅ Ready (1d ago)
   Branch: main
   Commit: c2c928b
```

#### ✅ 확인 사항

```
□ 최신 배포의 Status가 "Ready"인가?
□ 배포 소요 시간이 정상 범위(2~5분)인가?
□ 에러 메시지는 없는가?
□ 배포 로그에서 경고는 없는가?
```

---

### 2. 배포 로그 (Build Logs)

#### 📍 위치
```
Deployments → 배포 선택 → "Logs" 버튼
```

#### 🔍 확인 내용

**로그 구조:**
```
[1/5] Retrieving build cache...
[2/5] Building application...
      ✓ Compiled successfully
[3/5] Generating static files...
[4/5] Uploading deployment artifacts...
[5/5] Deployment complete

Total time: 2m 34s
```

**로그에서 찾아야 할 항목:**

```
✓ "Compiled successfully" 또는 "Build complete"
  → 빌드 성공

✗ "ERR!" 또는 "Error"
  → 빌드 실패 (원인 확인 필요)

⚠️ "WARN" 또는 "Warning"
  → 경고 (무시 가능하지만 체크)
```

**일반적인 오류 패턴:**

| 오류 | 원인 | 해결책 |
|------|------|--------|
| `Module not found` | 의존성 누락 | npm install 재실행 |
| `TypeScript error` | 타입 오류 | 타입 정의 수정 |
| `Syntax Error` | 코드 문법 오류 | 코드 검토 |
| `Memory exceeded` | 빌드 메모리 부족 | 캐시 초기화 |

**로그 다운로드:**
```
Logs 페이지 → ⋯ 메뉴 → "Download logs"
```

---

### 3. 프로덕션 URL 확인

#### 📍 위치
```
Dashboard → 프로젝트 → Domains 탭
또는
Deployments → 배포 → "Visit" 버튼
```

#### 🔗 URL 형태

**자동 생성 도메인:**
```
https://PROJECT-git-main-gysosm.vercel.app
```

**커스텀 도메인 (설정 시):**
```
https://yourdomain.com
```

**Preview 배포:**
```
https://PROJECT-pr-123-gysosm.vercel.app
```

#### ✅ 확인 사항

```
□ URL에 접속 가능한가?
□ 404 에러는 없는가?
□ 로딩 속도는 정상인가? (3초 이내)
□ 콘솔에 JavaScript 에러는 없는가? (F12 개발자 도구)
```

---

### 4. 환경 변수 (Environment Variables)

#### 📍 위치
```
프로젝트 → Settings → Environment Variables
```

#### 🎯 필수 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
CRON_SECRET
NEXT_PUBLIC_APP_URL
```

#### ✅ 확인 방법

**1) 환경 변수 설정 확인:**
```
Settings → Environment Variables

각 변수 옆에 "●" 표시:
✓ 설정됨
✗ 설정 안 됨 (빈 입력)
```

**2) 각 환경 선택:**
```
┌──────────────────────────┐
│ Development (로컬)       │
│ Preview (PR/테스트)      │
│ Production (실제 서비스) │
└──────────────────────────┘
```

**3) 배포 환경에 반영 확인:**
```
프로젝트 재배포 필요
(환경 변수 변경 후 자동 반영 안 됨)

GitHub에 push → Vercel 자동 빌드
```

#### ⚠️ 주의사항

```
NEVER: 민감한 키를 GitHub에 commit
ALWAYS: 환경 변수로 관리
```

---

### 5. 성능 분석 (Analytics)

#### 📍 위치
```
Dashboard → 프로젝트 → Analytics 탭
(Pro 플랜 이상 필요)
```

#### 📊 확인 메트릭

**응답 시간 (Response Time):**
```
평균: 100ms
P95: 300ms (상위 5% 느린 요청)
P99: 500ms (상위 1% 느린 요청)
```

**트래픽 (Traffic):**
```
일일 요청: 1,234건
고유 방문자: 456명
지역별 분포: 한국 95%, 기타 5%
```

**오류율 (Error Rate):**
```
5xx 서버 오류: 0.1%
4xx 클라이언트 오류: 2.3%
```

#### ✅ 정상 범위

| 메트릭 | 정상 범위 | 경고 |
|--------|----------|------|
| 응답 시간 | < 200ms | > 500ms |
| 오류율 | < 1% | > 5% |
| CPU 사용률 | < 70% | > 90% |
| 메모리 사용률 | < 80% | > 95% |

---

### 6. 함수 (Serverless Functions)

#### 📍 위치
```
프로젝트 → Functions 탭
```

#### 🔍 확인 항목

**함수 목록:**
```
/api/auth/login         ✓ Active
/api/contests/list      ✓ Active
/api/matches/apply      ✓ Active
/api/messages/send      ✓ Active
```

**함수 상태:**
```
✓ Active: 실행 가능
⏸️ Cold: 자동 정지 (처음 호출 시 시작)
✗ Error: 실행 불가
```

**함수 로그 확인:**
```
함수 선택 → Invocations 탭
→ 최근 호출 기록 및 응답 시간 확인
```

#### ⚠️ Cold Start

```
설명: 서버리스 함수 첫 실행 시 초기화 지연
영향: 첫 요청이 2~3초 걸릴 수 있음
해결: Pro 플랜에서 "Concurrency" 설정으로 개선 가능
```

---

### 7. 데이터베이스 연결 (Integrations)

#### 📍 위치
```
프로젝트 → Settings → Integrations
```

#### 🔍 확인 항목

**Supabase 연결 상태:**
```
Status: ✅ Connected

연결된 데이터베이스:
- Database: chungbuk-matching-db
- Region: ap-southeast-1 (Singapore)
- Version: 15.1
```

**환경 변수 자동 주입:**
```
확인: Integration을 통해 SUPABASE_URL,
SUPABASE_ANON_KEY 자동 추가됨
```

---

### 8. 커스텀 도메인 (Custom Domain)

#### 📍 위치
```
프로젝트 → Domains
```

#### 🔍 설정 항목

**도메인 구입 (Vercel):**
```
1. Domains → "Add" 버튼
2. 도메인 검색
3. 구입 및 자동 연결
```

**외부 도메인 연결:**
```
1. Domains → "Add" 버튼
2. 도메인명 입력
3. DNS 레코드 추가 (도메인 제공사에서)

DNS 레코드:
A Record: 76.76.19.143
CNAME: cname.vercel-dns.com
```

#### ⚠️ SSL 인증서

```
자동 발급: Let's Encrypt (무료)
갱신: 자동
확인: 도메인 설정 후 24시간 내 발급
```

---

## 🚀 실제 배포 확인 절차

### Step 1: GitHub에 Push
```bash
git push origin main
```

### Step 2: Vercel 자동 빌드 시작
```
1~2초 후 Vercel이 GitHub 웹훅 감지
→ 자동으로 빌드 시작
```

### Step 3: Vercel 대시보드 확인
```
1. https://vercel.com/dashboard 접속
2. 프로젝트 선택
3. Deployments 탭 확인
4. 최신 배포 상태 "Ready" 확인
```

### Step 4: 배포 URL 확인
```
1. "Visit" 버튼 클릭 또는
2. 자동 생성 URL에 접속
3. 웹사이트 정상 로드 확인
```

### Step 5: 기능 테스트
```
1. 공모전 탭 지역 필터 동작 ✓
2. 메시지 탭 접속 가능 ✓
3. 알림 페이지 로드 ✓
4. 프로필 탭 4개 탭 표시 ✓
5. 콘솔 오류 없음 ✓
```

---

## 🔧 일반적인 문제 및 해결

### 1. 배포 실패 (Build Failed)

**증상:**
```
Status: ❌ Error
Build time: 1m 23s
```

**확인 방법:**
```
1. Logs 탭 → 오류 메시지 확인
2. 마지막 줄에서 정확한 오류 찾기
```

**일반적인 오류:**

**오류 1: Dependencies 설치 실패**
```
error: npm ERR! 404 Not Found

원인: package.json에서 존재하지 않는 패키지
해결책:
1. 로컬에서 npm install 재실행
2. package-lock.json 업데이트
3. GitHub push
```

**오류 2: TypeScript 컴파일 오류**
```
error: Type 'undefined' is not assignable to type 'string'

원인: 타입 정의 오류
해결책:
1. 로컬에서 npm run build 실행
2. 오류 메시지 확인
3. 타입 수정
4. GitHub push
```

**오류 3: 메모리 부족**
```
error: JavaScript heap out of memory

원인: 빌드 중 메모리 부족
해결책:
1. 불필요한 의존성 제거
2. 큰 파일 최적화
3. Vercel 재배포 (캐시 초기화)
```

### 2. 배포 성공하지만 앱 오류 (Status 200 but 앱 오류)

**증상:**
```
Status: ✅ Ready
하지만 브라우저에서 접속하면:
- 흰 화면 (Blank Page)
- 콘솔에 JavaScript 에러
- 특정 페이지에서 404
```

**확인 방법:**
```
1. 브라우저 개발자 도구 (F12) 열기
2. Console 탭에서 오류 메시지 확인
3. Network 탭에서 요청 상태 확인
```

**일반적인 오류:**

**오류 1: 환경 변수 누락**
```
Error: NEXT_PUBLIC_SUPABASE_URL is undefined

원인: 환경 변수 설정 누락
해결책:
1. Vercel 대시보드 → Settings → Environment Variables
2. 빠진 변수 추가
3. 프로젝트 재배포
```

**오류 2: API 연결 실패**
```
Error: Failed to fetch from Supabase
Network error: 403 Forbidden

원인: Supabase API 키 잘못되거나 RLS 정책 문제
해결책:
1. Supabase 대시보드 확인
2. API 키 재발급
3. RLS 정책 확인
4. 환경 변수 업데이트
```

**오류 3: 라우팅 404 에러**
```
Error: 404 Not Found
/messages 페이지에 접속할 수 없음

원인: 파일 경로 오류 또는 빌드 누락
해결책:
1. app/(main)/messages/page.tsx 파일 확인
2. 파일명 대소문자 확인
3. 로컬에서 next dev 실행해서 테스트
4. GitHub push
```

### 3. 성능 저하 (Slow Performance)

**증상:**
```
페이지 로딩이 5초 이상
첫 상호작용까지의 시간(FID) > 1초
```

**확인 방법:**
```
1. Analytics 탭에서 응답 시간 확인
2. Lighthouse 실행 (Chrome DevTools)
3. Network 탭에서 리소스 로딩 시간 확인
```

**해결책:**
```
1. 불필요한 JavaScript 제거
2. 이미지 최적화 (WebP 형식)
3. CSS/JS 번들 크기 감소
4. 코드 스플리팅 추가
5. CDN 캐싱 설정
```

---

## 📊 모니터링 체크리스트

### 일일 확인 항목

```
☐ 최신 배포 상태 "Ready"?
☐ 오류율 < 1%?
☐ 평균 응답 시간 < 200ms?
☐ CPU 사용률 < 70%?
☐ 메모리 사용률 < 80%?
```

### 주간 확인 항목

```
☐ 배포 이력에서 실패한 빌드 있나?
☐ 경고 메시지(Warning) 해결됐나?
☐ 새로운 함수 오류는 없나?
☐ 트래픽 패턴 정상인가?
☐ 고객 피드백(에러) 있나?
```

### 월간 확인 항목

```
☐ 전체 성능 추세 분석
☐ 가장 느린 엔드포인트 최적화
☐ 비용 리뷰 (호출 수, 전송 용량)
☐ 의존성 업데이트 필요한가?
☐ 캐싱 전략 개선 필요한가?
```

---

## 🔐 보안 확인

### 환경 변수 노출 확인

```
✓ 민감한 키는 모두 환경 변수로 설정?
✓ .env 파일은 .gitignore에 포함?
✓ 콘솔 로그에 키 노출 없음?
✓ API 응답에 민감한 데이터 노출 없음?
```

### CORS 설정 확인

```
Supabase CORS 화이트리스트:
https://PROJECT-git-main-gysosm.vercel.app
https://yourdomain.com
```

---

## 📞 지원 및 리소스

### Vercel 대시보드 도움말
```
대시보드 → ? 아이콘 → Documentation
또는
https://vercel.com/docs
```

### 배포 문제 보고

**로그 저장 후 전달:**
```
1. Deployments → 배포 선택 → Logs
2. 전체 로그 복사
3. GitHub Issue 또는 Vercel Support 제출
```

**필수 정보:**
```
- Deployment ID
- Build 시작 시간
- 정확한 오류 메시지
- 최근 변경사항
```

---

## 🎯 요약: 가장 중요한 3가지

### 1️⃣ 배포 직후 확인
```
Vercel 대시보드
→ Deployments 탭
→ Status: ✅ Ready 확인
→ "Visit" 클릭해서 앱 로드 확인
→ F12 콘솔에서 오류 없는지 확인
```

### 2️⃣ 기능 동작 테스트
```
✓ 모든 페이지 접속 가능?
✓ API 호출 성공?
✓ Realtime (메시지, 알림) 동작?
✓ 필터링 기능 정상?
```

### 3️⃣ 성능 & 안정성 모니터링
```
매일: Analytics 탭에서 오류율 확인
주마다: Build logs에서 경고 확인
월마다: 성능 최적화 기회 찾기
```

---

**작성일:** 2026-05-28
**마지막 업데이트:** PR v2.0 배포 가이드
