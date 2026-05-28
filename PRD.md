# PRD: 충북대학교 공모전 & 스포츠 매칭 플랫폼

> **버전:** v1.0
> **작성일:** 2026-05-27
> **작성자:** -
> **기술 스택:** Next.js · Supabase · Vercel · Anthropic Claude API

---

## 1. 프로젝트 개요

### 1.1 서비스 한 줄 정의
충북대학교 재학생·휴학생이 자신의 능력과 관심사를 등록하면, 공모전 팀원 또는 스포츠 파트너를 매칭받을 수 있는 캠퍼스 전용 플랫폼.

### 1.2 핵심 가치
- **능력 기반 매칭**: 스펙·경험을 공개해 서로가 "함께 할 만한 사람"인지 판단 가능
- **충북대 한정**: @chungbuk.ac.kr 이메일 인증으로 신뢰도 확보
- **실시간 데이터**: 공모전 정보·시설 예약 현황을 자동 크롤링으로 최신화

### 1.3 대상 사용자
- 충북대학교 재학생 및 휴학생 (학부·대학원 무관)

---

## 2. 기술 스택 및 인프라

| 항목 | 선택 | 비고 |
|------|------|------|
| 프론트엔드 | Next.js 14 (App Router) | TypeScript 필수 |
| 백엔드 | Next.js API Routes + Supabase | 서버리스 |
| 데이터베이스 | Supabase (PostgreSQL) | RLS 정책 적용 |
| 인증 | Supabase Auth | 이메일 인증 방식 |
| 배포 | Vercel | Preview / Production 환경 분리 |
| AI | Anthropic Claude API (claude-sonnet-4) | 매칭 추천, 공모전 요약 |
| 크롤링 | Python (BeautifulSoup / Playwright) | Vercel Cron Job 또는 GitHub Actions |
| 스타일 | Tailwind CSS | |

---

## 3. 인증 시스템

### 3.1 회원가입

**조건**
- 이메일: `@chungbuk.ac.kr` 도메인만 허용 (프론트 + 백엔드 이중 검증)
- 비밀번호: 8자 이상, 영문+숫자+특수문자 조합

**흐름**
1. 이메일 입력 → 도메인 검증 실패 시 즉시 에러 메시지 표시
2. 비밀번호 입력 및 확인
3. 닉네임 입력 (중복 불가, 2~10자)
4. 학번 입력 (10자리 숫자, 형식 검증만 - 실재 여부 검증 불가)
5. Supabase Auth로 계정 생성 → 인증 메일 발송
6. 이메일 내 링크 클릭 → 인증 완료 → `users` 테이블에 프로필 레코드 생성
7. 인증 완료 후 메인 페이지로 리다이렉트

**에러 처리**
- 이미 가입된 이메일: "이미 사용 중인 이메일입니다"
- 도메인 불일치: "충북대학교 이메일(@chungbuk.ac.kr)만 가입 가능합니다"
- 인증 메일 미클릭 상태로 로그인 시도: "이메일 인증을 완료해주세요"

### 3.2 로그인

- 이메일 + 비밀번호 로그인
- "로그인 상태 유지" 체크박스 (세션 만료 7일 vs 브라우저 종료 시)
- 비밀번호 찾기: 등록된 충북대 이메일로 재설정 링크 발송

### 3.3 회원탈퇴

- 설정 > 계정 > 회원탈퇴
- 탈퇴 시 작성한 매칭 프로필 비공개 처리, 개인식별 정보 30일 후 삭제
- 탈퇴 후 동일 이메일로 재가입 가능 (30일 유예 없음)

---

## 4. 데이터베이스 스키마

### 4.1 `users` (기본 회원 정보)

```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id),
  email        TEXT UNIQUE NOT NULL,
  nickname     TEXT UNIQUE NOT NULL,
  student_id   TEXT NOT NULL,
  avatar_url   TEXT,
  role         TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 `contest_profiles` (공모전 매칭용 프로필)

```sql
CREATE TABLE contest_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  department      TEXT NOT NULL,           -- 학과
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  age             INT CHECK (age BETWEEN 18 AND 40),
  contest_count   INT DEFAULT 0,           -- 공모전 참여 횟수
  certificates    TEXT[],                  -- 자격증 목록
  fields          TEXT[],                  -- 관심 공모전 분야
  intro           TEXT,                    -- 자기소개 (300자 이내)
  is_visible      BOOLEAN DEFAULT TRUE,    -- 프로필 공개 여부
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 `sports_profiles` (스포츠 매칭용 프로필)

```sql
CREATE TABLE sports_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  age             INT CHECK (age BETWEEN 18 AND 40),
  sports          TEXT[],                  -- 관심 종목 목록
  career_years    INT DEFAULT 0,           -- 운동 경력 (년)
  is_pro          BOOLEAN DEFAULT FALSE,   -- 선출 여부
  intro           TEXT,                    -- 자기소개 (300자 이내)
  is_visible      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 `contests` (공모전 정보 - 크롤링 데이터)

```sql
CREATE TABLE contests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  organizer       TEXT,
  field           TEXT NOT NULL CHECK (field IN (
                    'marketing', 'video', 'design',
                    'literature', 'it', 'arts', 'academic'
                  )),
  start_date      DATE,
  end_date        DATE NOT NULL,
  prize           TEXT,
  target          TEXT,                    -- 지원 대상
  url             TEXT UNIQUE NOT NULL,    -- 원본 링크 (중복 방지 키)
  thumbnail_url   TEXT,
  is_active       BOOLEAN DEFAULT TRUE,    -- 마감 여부
  source          TEXT,                    -- 크롤링 출처 사이트
  last_crawled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 `sports_reservations` (시설 예약 현황 - 크롤링 데이터)

```sql
CREATE TABLE sports_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility        TEXT NOT NULL CHECK (facility IN (
                    'futsal_a', 'futsal_b',
                    'basketball_a', 'basketball_b',
                    'tennis_a', 'tennis_b', 'tennis_c', 'tennis_d', 'tennis_e',
                    'small_field', 'main_field'
                  )),
  reservation_date DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  status          TEXT CHECK (status IN ('available', 'reserved', 'closed')),
  last_crawled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (facility, reservation_date, start_time)
);
```

### 4.6 `matches` (매칭 요청/성사 기록)

```sql
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL CHECK (type IN ('contest', 'sports')),
  requester_id    UUID REFERENCES users(id),
  receiver_id     UUID REFERENCES users(id),
  contest_id      UUID REFERENCES contests(id),        -- 공모전 매칭 시
  reservation_id  UUID REFERENCES sports_reservations(id), -- 스포츠 매칭 시
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message         TEXT,                                -- 신청 메시지 (200자 이내)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.7 `reports` (신고)

```sql
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID REFERENCES users(id),
  reported_id     UUID REFERENCES users(id),
  reason          TEXT NOT NULL,
  detail          TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.8 `notifications` (알림)

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,           -- 'match_request', 'match_accepted', 'match_rejected'
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  related_id      UUID,                    -- 관련 match id
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. 화면 흐름 (User Flow)

```
[랜딩/로그인] → [회원가입] → [이메일 인증] → [메인 홈]
                                                    ├─ [공모전 탭]
                                                    │     ├─ [프로필 입력/수정 모달]
                                                    │     ├─ [분야별 공모전 목록]
                                                    │     └─ [공모전 상세 → 팀원 찾기]
                                                    │           └─ [유저 프로필 카드 → 매칭 신청]
                                                    └─ [스포츠 탭]
                                                          ├─ [프로필 입력/수정 모달]
                                                          ├─ [종목별 예약 현황]
                                                          └─ [예약 슬롯 선택 → 파트너 찾기]
                                                                └─ [유저 프로필 카드 → 매칭 신청]

[매칭 신청] → [알림 발송] → [수락/거절] → [매칭 완료 → 연락처/채팅 공개]
```

---

## 6. 페이지별 기능 명세

### 6.1 메인 홈 (`/`)

- 상단 네비게이션 바: 로고, 공모전 탭, 스포츠 탭, 알림 아이콘(뱃지), 프로필 아이콘
- 공모전 / 스포츠 두 섹션으로 분리된 랜딩 카드
- 각 섹션에 현재 진행 중인 공모전 수, 오늘 예약 가능한 시설 슬롯 수 표시

### 6.2 공모전 페이지 (`/contest`)

**레이아웃**
- 상단: 프로필 등록/수정 아이콘 버튼 (우측 상단)
- 중단: 분야 필터 탭 (전체 / 마케팅·아이디어 / 영상·UCC·사진 / 디자인 / 문학·글 / IT·소프트웨어 / 예체능·음악·미술 / 학술·창업·논술)
- 하단: 공모전 카드 그리드 (무한 스크롤)

**공모전 카드 항목**
- 썸네일, 제목, 주최기관, 분야 태그, 마감일, 시상내역

**공모전 상세 페이지 (`/contest/:id`)**
- 공모전 기본 정보 전체
- "팀원 구하기" 버튼 → 해당 공모전을 기준으로 매칭 가능한 유저 목록 표시
- 유저 목록은 자신의 공모전 프로필의 `fields`와 겹치는 사람 우선 정렬

**공모전 프로필 모달**
- 학과 (텍스트 입력)
- 성별 (선택)
- 나이 (숫자 입력)
- 공모전 참여 횟수 (숫자 입력)
- 자격증 (태그 입력, 최대 10개)
- 관심 분야 (다중 선택)
- 자기소개 (300자 이내)
- 프로필 공개 여부 토글

**유저 프로필 카드**
- 닉네임, 학과, 나이, 성별
- 공모전 참여 횟수, 자격증, 관심 분야
- 자기소개
- "매칭 신청" 버튼 + 신청 메시지 입력 (200자 이내)
- "신고" 버튼

### 6.3 스포츠 페이지 (`/sports`)

**레이아웃**
- 상단: 프로필 등록/수정 아이콘 버튼
- 중단: 종목 탭 (풋살 / 농구 / 테니스 / 소운동장 / 종합운동장)
- 하단: 날짜 선택 캘린더 + 해당 날짜 예약 현황 타임라인

**예약 현황 타임라인**
- 시간대별 슬롯 표시 (예약 완료 / 예약 가능 시각적 구분)
- "예약 가능" 슬롯 클릭 → 해당 시간대에 함께 할 파트너 찾기

**파트너 찾기 화면**
- 선택한 시설·날짜·시간 표시
- 매칭 가능한 유저 카드 목록 (스포츠 프로필 기반)
- 유저 프로필 카드: 닉네임, 나이, 성별, 관심 종목, 운동 경력, 선출 여부, 자기소개

**스포츠 프로필 모달**
- 성별 (선택)
- 나이 (숫자 입력)
- 관심 종목 (다중 선택)
- 운동 경력 (년 단위 숫자)
- 선출 여부 (토글)
- 자기소개 (300자 이내)
- 프로필 공개 여부 토글

### 6.4 매칭 관리 (`/matches`)

- 보낸 신청 목록 (상태: 대기중 / 수락됨 / 거절됨 / 취소됨)
- 받은 신청 목록
- 매칭 수락 시: 상대방 연락처(이메일) 공개
- 매칭 거절 / 취소 가능
- 매칭 완료된 건 삭제 불가 (기록 유지, 신고 대비)

### 6.5 알림 (`/notifications`)

- 실시간 알림 (Supabase Realtime 활용)
- 알림 유형: 매칭 신청 받음 / 매칭 수락됨 / 매칭 거절됨
- 읽음/안읽음 구분, 전체 읽음 처리
- 알림 클릭 시 관련 매칭 상세로 이동

### 6.6 마이페이지 (`/profile`)

- 닉네임 변경
- 아바타 이미지 업로드 (Supabase Storage 사용)
- 공모전 프로필 바로가기
- 스포츠 프로필 바로가기
- 로그아웃
- 회원탈퇴

### 6.7 신고 시스템

- 유저 카드의 신고 버튼 → 사유 선택 (불쾌한 언행 / 허위 정보 / 스팸 / 기타) + 상세 내용 입력
- 신고 접수 후 관리자 검토 (관리자 대시보드에서 처리)
- 누적 신고 3회 이상: 계정 자동 비공개 + 관리자 알림

---

## 7. 크롤링 시스템

### 7.1 공모전 데이터 크롤링

**대상 사이트**
- 공모전닷컴 (www.contestkorea.com)
- 위비티 (www.wevity.com)
- 링커리어 (linkareer.com)

**수집 필드**
- 제목, 주최기관, 분야, 접수 시작일, 마감일, 시상내역, 지원 대상, URL, 썸네일

**분야 매핑 규칙**
```
marketing  ← 마케팅, 아이디어, 광고, 홍보
video      ← 영상, UCC, 사진, 영화
design     ← 디자인, UI/UX, 캐릭터
literature ← 문학, 글쓰기, 시, 소설, 수필
it         ← IT, 소프트웨어, 개발, 해커톤, 앱
arts       ← 예체능, 음악, 미술, 공연
academic   ← 학술, 창업, 논술, 스타트업
```

**실행 주기**
- 매일 오전 2시 자동 실행 (GitHub Actions cron 사용)
- 신규 공모전 INSERT, 기존 공모전 마감일·상태 UPDATE
- 마감일이 지난 공모전: `is_active = FALSE` 처리

**GitHub Actions Workflow 예시**
```yaml
name: Contest Crawl
on:
  schedule:
    - cron: '0 17 * * *'  # UTC 17:00 = KST 02:00
  workflow_dispatch:

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r crawlers/requirements.txt
      - run: python crawlers/contest_crawler.py
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

### 7.2 시설 예약 현황 크롤링

**대상**: 충북대학교 학생생활관/진흥원 시설 예약 시스템

**수집 대상 시설**
- 풋살장, 농구장, 테니스장, 소운동장, 종합운동장

**수집 필드**
- 시설명, 예약 날짜, 시작/종료 시간, 예약 상태

**실행 주기**
- 매 1시간마다 실행 (GitHub Actions cron)
- 기존 레코드와 비교해 상태 변경 시 UPDATE

**주의사항**
- 크롤링 가능 여부는 사전 확인 완료 (로그인 불필요한 공개 페이지 기준)
- 사이트 구조 변경 시 크롤러 수동 업데이트 필요
- 크롤링 실패 시 Supabase의 마지막 수집 데이터 유지, Vercel 로그에 에러 기록

---

## 8. Claude API 활용 계획

| 기능 | 활용 방식 |
|------|----------|
| 공모전 요약 | 크롤링한 공모전 상세 페이지 내용을 2~3줄로 요약 |
| 매칭 추천 이유 | 두 유저 프로필을 비교해 "이 사람과 잘 맞는 이유" 한 줄 생성 |
| 프로필 작성 도우미 | 자기소개 초안 작성 보조 (선택 기능) |

---

## 9. 권한 및 보안

### 9.1 Supabase RLS (Row Level Security) 정책

- `users`: 본인 레코드만 UPDATE 가능, SELECT는 인증된 유저 전체 허용
- `contest_profiles` / `sports_profiles`: 본인만 INSERT·UPDATE·DELETE, is_visible=TRUE인 레코드는 모든 인증 유저 SELECT 가능
- `matches`: requester 또는 receiver만 SELECT·UPDATE 가능
- `contests` / `sports_reservations`: 모든 인증 유저 SELECT 가능, INSERT·UPDATE는 service_role만 (크롤러)
- `reports`: reporter만 INSERT, SELECT·UPDATE는 admin만

### 9.2 API 보안

- 모든 API Route는 Supabase JWT 검증 미들웨어 적용
- 크롤러는 SUPABASE_SERVICE_KEY 사용 (클라이언트에 절대 노출 금지)
- Claude API 키는 서버 사이드에서만 호출

### 9.3 개인정보

- 나이·성별·학과는 프로필 비공개 설정 시 다른 유저에게 비노출
- 이메일은 매칭 수락 후에만 상대에게 공개
- 탈퇴 후 30일 뒤 개인식별 정보 자동 삭제 (Supabase Edge Function cron 처리)

---

## 10. 에러 처리 및 예외 상황

| 상황 | 처리 방식 |
|------|----------|
| 크롤링 실패 | 기존 DB 데이터 유지, GitHub Actions 실패 알림 |
| 예약 현황 사이트 다운 | 마지막 수집 시각 표시 후 "현재 정보를 불러올 수 없습니다" 안내 |
| Claude API 오류 | AI 요약/추천 기능만 비활성화, 나머지 서비스 정상 운영 |
| Supabase 연결 오류 | 500 에러 페이지 + 재시도 버튼 |
| 중복 매칭 신청 | "이미 신청한 상대입니다" 메시지 |
| 자기 자신에게 매칭 신청 | API에서 차단 |

---

## 11. 비기능 요구사항

- **응답속도**: 페이지 초기 로딩 2초 이내 (LCP 기준)
- **모바일 대응**: 반응형 웹 (모바일 퍼스트 설계, 최소 375px)
- **브라우저 지원**: Chrome, Safari, Edge 최신 2버전
- **데이터 보존**: 매칭 기록 1년 보존, 공모전 데이터 마감 후 6개월 보존

---

## 12. 개발 단계별 로드맵

| 단계 | 내용 | 예상 기간 |
|------|------|----------|
| Phase 1 | 인증(회원가입/로그인) + DB 스키마 구축 | 1주 |
| Phase 2 | 공모전 크롤러 + 공모전 목록/상세 페이지 | 1주 |
| Phase 3 | 공모전 프로필 + 매칭 신청/수락 + 알림 | 1주 |
| Phase 4 | 시설 예약 크롤러 + 스포츠 페이지 | 1주 |
| Phase 5 | 스포츠 프로필 + 스포츠 매칭 | 0.5주 |
| Phase 6 | Claude API 연동 (요약·추천) | 0.5주 |
| Phase 7 | 신고 시스템 + 관리자 기능 | 0.5주 |
| Phase 8 | QA, 최적화, Vercel 배포 | 0.5주 |

---

## 13. 환경 변수 목록

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=          # 서버/크롤러 전용, 클라이언트 노출 금지

# Anthropic
ANTHROPIC_API_KEY=             # 서버 사이드 전용

# 기타
NEXT_PUBLIC_APP_URL=           # 배포 URL (이메일 인증 리다이렉트용)
```

---

## 14. 확정 사항 및 미결 사항

### 확정된 정책

| 항목 | 결정 내용 |
|------|----------|
| 공모전 썸네일 | 원본 URL 참조 방식 (직접 저장 X) |
| 학번 실재 여부 검증 | 형식 검증(10자리 숫자)만 수행, 실재 여부 검증 없음 |
| 선출 여부 검증 | 자기 신고 기반, 허위 신고 적발 시 신고 시스템으로 처리 |
| 허위 정보 제재 | 매칭 후 상대방이 허위 정보를 신고하면 관리자 검토 후 계정 정지/퇴출 |

### 허위 정보 제재 프로세스

1. 매칭 성사 후 상대방 프로필이 허위임을 인지
2. 매칭 상세 화면 또는 유저 카드에서 "허위 정보 신고" 제출
3. 관리자 검토 → 사실 확인
4. 1차: 경고 + 프로필 강제 수정 요청
5. 2차: 30일 계정 정지
6. 3차: 영구 퇴출 (동일 이메일 재가입 불가)

### 미결 사항 (추후 확인 필요)

- [ ] 충북대 진흥원 시설 예약 페이지의 크롤링 대상 URL 및 HTML 구조 최종 확인
- [ ] 매칭 성사 후 소통 방식: 이메일 공개만 할지, 플랫폼 내 채팅 기능 추가할지 결정
