# 🚀 빠른 배포 확인 가이드 (5분 안에 확인하기)

## 📍 배포 확인 순서 (단계별)

### 1단계: GitHub Push 확인 (1분)

**할 일:**
```bash
# 로컬에서 최신 커밋 확인
git log -1 --oneline

# 예상 출력:
# 6ff3642 docs: Vercel 배포 및 모니터링 가이드 작성
```

**GitHub 확인:**
```
1. https://github.com/gysosm-glitch/PROJECT
2. Code 탭에서 최신 커밋 보이는지 확인
3. commit hash가 6ff3642로 시작하는지 확인
```

---

### 2단계: Vercel 배포 상태 (2분)

**접속:**
```
https://vercel.com/dashboard
→ 프로젝트 "PROJECT" 클릭
```

**확인 항목:**
```
┌─────────────────────────────────────┐
│ 최신 배포 확인                      │
├─────────────────────────────────────┤
│                                     │
│ Status: ✅ Ready                    │ ← 이게 보이면 성공!
│ Duration: 2m 34s                    │
│ Created: Just now                   │
│ Commit: docs: Vercel 배포 가이드    │
│                                     │
│ [Production] [Preview]              │
│                                     │
│ ✅ All checks passed               │
│                                     │
└─────────────────────────────────────┘
```

**만약 실패하면:**
```
Status: ❌ Error 또는 🔄 Building
→ 아래로 스크롤
→ "Logs" 탭 클릭
→ 빨간 오류 메시지 확인
```

---

### 3단계: 앱 접속 확인 (1분)

**URL 클릭:**
```
Vercel Dashboard
→ Deployments 탭
→ 최신 배포의 "Visit" 버튼 클릭
```

**또는 직접 접속:**
```
https://PROJECT-git-main-gysosm.vercel.app
```

**확인:**
```
✓ 페이지가 로드되나?
✓ 충북대 매칭 로고가 보이나?
✓ 공모전 | 스포츠 | 메시지 탭이 보이나?
✓ 알림(🔔) 아이콘이 보이나?
```

**만약 안 되면:**
```
1. 브라우저 새로고침 (Ctrl+F5)
2. 캐시 삭제 (Settings → Clear browsing data)
3. 5초 기다렸다가 다시 시도
4. 여전히 안 되면 배포 로그 확인
```

---

### 4단계: 기능 테스트 (1분)

**브라우저 콘솔 확인:**
```
1. 페이지 로드
2. F12 키 눌러서 개발자 도구 열기
3. Console 탭 확인
4. 빨간 에러 메시지 없는지 확인
```

**각 탭 클릭:**
```
☐ 공모전 탭 → 공모전 목록 보임?
☐ 스포츠 탭 → 스포츠 시설 보임?
☐ 메시지 탭 → 메시지 페이지 로드?
☐ 알림 아이콘(🔔) → 알림 페이지 로드?
☐ 프로필(👤) → 프로필 페이지 로드?
```

---

## ✅ 배포 성공 체크리스트

```
배포 상태 확인:
☐ GitHub에 push 되었나?
☐ Vercel Status가 "Ready"인가?
☐ 배포 Duration이 2~5분 정도인가?

앱 접속 확인:
☐ URL 접속 가능한가?
☐ 페이지가 정상적으로 로드되나?
☐ 콘솔에 오류 없나?

기능 확인:
☐ 모든 탭 클릭 가능?
☐ 로그인 페이지 접근 가능?
☐ 프로필 페이지 로드 가능?

최종 확인:
☐ 모두 OK이면 배포 성공! 🎉
```

---

## 🚨 문제 해결 (가장 흔한 3가지)

### 문제 1: Status가 "Building" 상태가 계속 유지

**원인:** 배포가 아직 진행 중

**해결:**
```
1. 5분 정도 기다리기
2. 페이지 새로고침
3. 여전히 Building이면:
   → "Logs" 탭 클릭
   → 진행 상황 확인
```

**예상 시간:**
```
- 빌드: 1~2분
- 배포: 30초~1분
- 총: 2~5분
```

---

### 문제 2: Status가 "Error"

**원인:** 빌드 실패 (코드 문제)

**해결:**
```
1. Logs 탭 클릭
2. 빨간 "ERR!" 찾기
3. 오류 메시지 읽기

예시:
❌ "Module not found: Can't resolve '@/components/contest/ContestFilter'"

해결책:
→ 파일이 정말 존재하는지 확인
→ 파일명 오타 확인
→ 로컬에서 npm run build 실행해서 테스트
→ 수정 후 github push
```

---

### 문제 3: Status가 "Ready"지만 앱이 로드 안 됨

**원인:** 런타임 오류 (앱 자체 문제)

**해결:**
```
1. URL 접속
2. F12 → Console 탭
3. 빨간 에러 메시지 확인

예시 오류:
❌ "NEXT_PUBLIC_SUPABASE_URL is undefined"

해결책:
→ Vercel Settings → Environment Variables 확인
→ 빠진 변수 추가
→ Redeploy 버튼 클릭
```

---

## 🎯 정상 상태 예시

### 배포 완료

```
Dashboard 화면:
┌────────────────────────────────────┐
│ Latest Deployments                 │
│                                    │
│ 🟢 Ready (2 min)                   │
│ docs: Vercel 배포 가이드 작성      │
│ main branch                        │
│ 2 seconds ago                      │
│                                    │
│ [Visit] [Redeploy] [Logs]         │
└────────────────────────────────────┘
```

### 앱 정상 로드

```
브라우저:
┌────────────────────────────────────┐
│ 🎯 충북대 매칭                     │
├────────────────────────────────────┤
│ 공모전 | 스포츠 | 메시지  🔔 👤  │
├────────────────────────────────────┤
│                                    │
│ 함께할 팀원 & 파트너를             │
│ 스마트하게 찾으세요                │
│                                    │
│ [공모전 팀원 찾기]                │
│ [스포츠 파트너 찾기]               │
│                                    │
│ Console: 아무 에러 메시지 없음     │
│                                    │
└────────────────────────────────────┘
```

---

## 📊 배포 후 확인할 수 있는 정보

| 항목 | 위치 | 보는 이유 |
|------|------|----------|
| **Status** | Deployments | 배포 성공 여부 |
| **Duration** | Deployments | 빌드 성능 (2~5분 정상) |
| **Logs** | Deployments → Logs | 오류 메시지 확인 |
| **URL** | Deployments → Visit | 실제 앱 접속 |
| **Domains** | Domains | 커스텀 도메인 설정 |
| **Env Variables** | Settings → Env | 환경 변수 확인 |

---

## 🔄 배포 후 반복할 작업

### 매번 배포할 때마다

```
1. GitHub push
   git push origin main

2. 5초 기다리기
   (Vercel 웹훅 감지)

3. Vercel 대시보드 새로고침
   https://vercel.com/dashboard

4. Status 확인
   Ready? → Yes → 완료!
   Error? → Logs 확인 → 수정

5. 앱 URL 접속
   정상 로드? → Yes → 배포 성공!
```

### 일일 점검 (1분)

```
Vercel 대시보드
→ 최신 배포 상태 확인
→ "Ready" + 녹색 체크마크 확인
→ Error 없는지 확인
```

---

## 📞 도움이 필요하면

### 확인해야 할 것들

```
1. GitHub 커밋은 제대로 push 됐나?
   → git log -1 --oneline 확인

2. Vercel 대시보드는 로그인 되어 있나?
   → https://vercel.com/dashboard 접속 시도

3. 프로젝트가 연결되어 있나?
   → Settings → GitHub → 연결 확인

4. 빌드 로그에서 정확한 오류는?
   → Logs 탭에서 빨간 ERR! 찾기
```

### 더 자세한 정보

```
📖 UI 기능 상세 가이드
→ UI_FEATURES_GUIDE.md 참고

📖 Vercel 전체 가이드
→ VERCEL_GUIDE.md 참고

📖 프로젝트 PRD
→ prd.md 참고
```

---

## ⏱️ 시간 기준

```
배포 후 상태 변화:

0초 → GitHub push
↓
2~5초 → Vercel 웹훅 감지 (Status: Queued)
↓
1~2분 → 빌드 진행 (Status: Building)
↓
30초~1분 → 배포 (Status: Ready ✅)
↓
즉시 → URL 접속 가능
```

---

## 🎉 완벽한 배포 상태

```
✅ GitHub 커밋: 성공적으로 push
✅ Vercel Status: Ready (초록색)
✅ Build Duration: 2~5분
✅ App URL: 정상 로드
✅ Console: 오류 없음
✅ 모든 페이지: 접속 가능
✅ 모든 탭: 클릭 가능

→ 배포 완벽하게 완료! 🚀
```

---

**작성일:** 2026-05-28
**용도:** 빠른 배포 확인 (5분)
**다음 단계:** UI_FEATURES_GUIDE.md, VERCEL_GUIDE.md 참고
