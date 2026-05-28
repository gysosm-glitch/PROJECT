# PRD: 충북대학교 공모전 & 스포츠 매칭 플랫폼

> **버전:** v2.0
> **작성일:** 2026-05-28
> **기술 스택:** Next.js · Supabase · Vercel · Anthropic Claude API

---

## 1. 프로젝트 개요

### 1.1 서비스 한 줄 정의
충북대학교 재학생·휴학생이 자신의 능력과 관심사를 등록하면, 공모전 팀원 또는 스포츠 파트너를 매칭받고 소통할 수 있는 캠퍼스 전용 플랫폼.

### 1.2 핵심 가치
- **능력 기반 매칭**: 스펙·경험을 공개해 서로가 "함께 할 만한 사람"인지 판단 가능
- **충북대 한정**: @chungbuk.ac.kr 이메일 인증(또는 학번 인증)으로 신뢰도 확보
- **실시간 데이터**: 공모전 정보 및 교내 시설 예약 현황 자동 크롤링으로 최신화
- **신뢰 기반 생태계 (v2.0)**: 매너 평가 시스템으로 건전한 경기/협업 문화 형성
- **실시간 커뮤니케이션 (v2.0)**: 1:1 및 공모전 그룹 채팅 연동

### 1.3 대상 사용자
- 충북대학교 재학생 및 휴학생 (학부·대학원 무관)

---

## 2. 기술 스택 및 인프라

| 항목 | 선택 | 비고 |
|------|------|------|
| 프론트엔드 | Next.js 14 (App Router) | TypeScript 필수 |
| 백엔드 | Next.js API Routes + Supabase | 서버리스 |
| 데이터베이스 | Supabase (PostgreSQL) | RLS 정책 적용, Realtime 내장 |
| 인증 | Supabase Auth | 이메일 인증 방식 |
| 배포 | Vercel | Preview / Production 환경 분리 |
| 실시간 | Supabase Realtime | WebSocket 기반 알림/채팅 구독 |
| 자동화 | Vercel Cron Jobs / GitHub Actions | 매일 데이터 동기화 및 만료 처리 |
| AI | Anthropic Claude API (claude-sonnet-4) | 매칭 추천, 공모전 요약 |
| 크롤링 | Python (BeautifulSoup / Playwright) | 시설 예약, 공모전 스크래핑 |
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
4. 학번 입력 (10자리 숫자, 형식 검증만)
5. Supabase Auth로 계정 생성 → 인증 메일 발송
6. 이메일 내 링크 클릭 → 인증 완료 → `users` 테이블에 프로필 레코드 생성
7. 인증 완료 후 메인 페이지로 리다이렉트

### 3.2 로그인 및 회원탈퇴

- 이메일 + 비밀번호 로그인
- 세션 유지 기능 지원
- 회원탈퇴 시 개인식별 정보 30일 후 삭제 (프로필 비공개 처리)

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
  manner_score DECIMAL(3,2) DEFAULT 0.0,  -- v2.0 매너 점수
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 `contest_profiles` (공모전 매칭용 프로필)
```sql
CREATE TABLE contest_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  department      TEXT NOT NULL,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  age             INT CHECK (age BETWEEN 18 AND 40),
  contest_count   INT DEFAULT 0,
  certificates    TEXT[],
  fields          TEXT[],
  intro           TEXT,
  is_visible      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 `sports_profiles` (스포츠 매칭용 프로필)
```sql
CREATE TABLE sports_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  age             INT CHECK (age BETWEEN 18 AND 40),
  sports          TEXT[],
  career_years    INT DEFAULT 0,
  is_pro          BOOLEAN DEFAULT FALSE,
  intro           TEXT,
  is_visible      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 `contests` (공모전 정보 - 크롤링 및 수동 데이터)
```sql
CREATE TABLE contests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  organizer       TEXT,
  field           TEXT NOT NULL,
  region          TEXT CHECK (region IN ('충청북도', '충청남도', '세종특별자치시', '대전광역시')), -- v2.0 지역 제한
  start_date      DATE NOT NULL,           -- v2.0 시작일 필수
  end_date        DATE NOT NULL,           -- v2.0 마감일 필수
  max_participants INT DEFAULT 4,          -- v2.0 최대 인원
  prize           TEXT,
  target          TEXT,
  url             TEXT UNIQUE NOT NULL,
  thumbnail_url   TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  source          TEXT,
  last_crawled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 `sports_reservations` (시설 예약 현황 - 크롤링 데이터)
```sql
CREATE TABLE sports_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility        TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  status          TEXT CHECK (status IN ('available', 'reserved', 'closed')),
  last_crawled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (facility, reservation_date, start_time)
);
```

### 4.6 `matches` 및 `applications` (매칭 요청 관리)
```sql
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL CHECK (type IN ('contest', 'sports')),
  author_id       UUID REFERENCES users(id),
  contest_id      UUID REFERENCES contests(id),
  reservation_id  UUID REFERENCES sports_reservations(id),
  title           TEXT,
  description     TEXT,
  status          TEXT DEFAULT '모집중' CHECK (status IN ('모집중', '마감', '매치확정', '취소됨')),
  match_datetime  TIMESTAMPTZ, -- 경기/모임 날짜
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID REFERENCES matches(id) ON DELETE CASCADE,
  applicant_id    UUID REFERENCES users(id),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, applicant_id)
);
```

### 4.7 메시지 및 알림 (v2.0)
```sql
CREATE TABLE message_rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID REFERENCES matches(id),
  is_group        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_members (
  room_id         UUID REFERENCES message_rooms(id),
  user_id         UUID REFERENCES users(id),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID REFERENCES message_rooms(id),
  sender_id       UUID REFERENCES users(id),
  content         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL, -- match_apply, match_accept, match_reject, new_message
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  related_id      UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID REFERENCES matches(id),
  reviewer_id     UUID REFERENCES users(id),
  reviewee_id     UUID REFERENCES users(id),
  rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, reviewer_id, reviewee_id)
);
```

---

## 5. 화면 흐름 및 기능 명세

### 5.1 주요 탭 (v2.0 확장)
- **홈 (Home)**: 랜딩, 요약 정보 제공
- **공모전 (Contest)**: 지역별(충청권) 공모전 목록, 팀원 모집 (자동 만료)
- **스포츠 (Sports)**: 시설 예약 현황, 매치 모집 글 목록 및 파트너 매칭
- **메시지 (Messages)**: 1:1 매치 채팅 및 공모전 그룹 채팅 탭 지원
- **알림 (Notifications)**: 실시간 알림 피드
- **내 정보 (Profile)**: 프로필, 지원한/받은 신청 관리, 캘린더, 매너 평가

### 5.2 공모전 매칭 상세
- **목록**: 충청북도, 충청남도, 세종특별자치시, 대전광역시 4개 지역 필터링
- **팀원 모집**: 마감일 + 최대 인원(남은 자리 실시간 표시) 기반. 정원이 차면 자동 마감 처리.
- **채팅**: 공모전 팀원 신청 수락 시 해당 팀의 **그룹 채팅방**에 자동 입장. 팀장(작성자)은 추가 멤버 초대 가능.

### 5.3 스포츠 매칭 상세
- **예약 연동**: 시설 예약 크롤링 데이터에서 '예약 가능' 슬롯을 선택하여 파트너 모집 가능.
- **매치 모집**: 팀명, 종목(축구/풋살/농구/e스포츠 등), 장소, 경기일시, 원하는 수준 기재.
- **채팅**: 1:1 매치 신청이 수락되면 1:1 채팅방 자동 생성.

### 5.4 신청 관리 및 매너 평가 (v2.0)
- **프로필 대시보드**: '받은 신청', '지원한 신청' 탭을 통해 진행 상황 파악 및 대기중 신청 취소/수락/거절.
- **매너 평가**: 매치(경기/프로젝트) 종료 후 상호 간 별점 평가 (1~5점). 누적 점수는 프로필에 노출.

---

## 6. 크롤링 및 자동화 시스템

### 6.1 공모전 데이터 크롤링 (v2.0 개선)
- **대상 지역**: 대전, 세종, 충청남도, 충청북도 주관/개최 공모전 한정.
- **필수 수집 항목**: 제목, 주최기관, 지역, 접수 시작일(출시기한), 마감일, 최대 인원, URL 등. (마감기한/출시기한 필수 수집)
- **실행 주기**: 매일 새벽 자동화 파이프라인 (Vercel Cron 또는 GitHub Actions) 실행.
- **자동 만료**: `end_date` 가 현재 시간보다 과거인 경우 리스트에서 자동 제외 또는 DB에서 삭제 (`is_active = FALSE`).

### 6.2 시설 예약 현황 크롤링 (기존 유지)
- **대상**: 충북대학교 학생생활관/진흥원 시설 예약 시스템
- **수집 대상**: 풋살장, 농구장, 테니스장, 소운동장, 종합운동장 등.
- **실행 주기**: 매 1시간 주기 크롤링. 상태 변경(available ↔ reserved) 동기화.

---

## 7. 권한 및 보안

### 7.1 Supabase RLS 및 인증 정책
- 인증된 사용자만 프로필 조회 및 매치 신청 가능.
- 본인의 게시글 및 신청 건에 대해서만 상태 업데이트 가능.
- 채팅방 메시지는 해당 `room_members` 에 속한 유저만 `SELECT/INSERT` 가능.

---

## 8. UI/UX 디자인 가이드라인

대학생들의 활기차고 트렌디한 감성에 맞춘 **"Campus Vibe & Modern Dynamic"** 디자인 시스템을 구축합니다. 단조로운 게시판 형태를 벗어나 직관적이고 매력적인 UI를 제공합니다.

### 8.1 디자인 컨셉
- **Glassmorphism (글래스모피즘)**: 반투명한 배경과 은은한 블러 효과를 통해 세련되고 현대적인 느낌 연출.
- **Micro-animations (마이크로 인터랙션)**: 버튼 호버, 카드 스와이프, 하트/즐겨찾기 탭 시 부드럽고 통통 튀는 애니메이션 적용 (framer-motion 활용).
- **Modern Typography**: 가독성과 세련됨을 동시에 잡는 폰트(Pretendard 또는 Inter) 사용.
- **Dark Mode 지원**: 심야 시간대 이용이 많은 대학생을 배려한 매끄러운 다크 모드 전환.

### 8.2 컬러 팔레트 (Vibrant & Trustworthy)
| 용도 | 색상 특징 | 설명 |
|------|-----------|------|
| **Primary** | `#1E3A5F` (충북대 네이비) + 그라데이션 | 신뢰감을 주면서도 지루하지 않은 트렌디한 네이비/블루 그라데이션 |
| **Accent** | `#FF6B35` (비비드 오렌지) | 공모전 마감 임박, 핵심 버튼(매칭 신청 등)에 사용하여 시선 유도 |
| **Success/Danger** | `#22C55E` / `#EF4444` | 매치 수락(초록), 매치 거절/마감(빨강) 등 직관적 상태 표시 |
| **Background** | `#F8FAFC` (라이트) / `#0F172A` (다크) | 눈이 편안한 여백 중심의 레이아웃 배색 |

### 8.3 공모전 & 스포츠 시각화 배지
- **종목 배지**: ⚽ (축구/그린), 🏀 (농구/오렌지), 🎮 (e스포츠/퍼플) 등 이모지와 색상을 결합한 직관적인 태그.
- **수준/인원 배지**: 실력(초급/중급/고수)에 따른 네온 컬러 코딩. 남은 자리가 적을수록 붉은 계열로 변하는 다이내믹 잔여 인원 배지(v2.0 신규).
- **지역 배지**: 충북(🏔️), 충남(🌊), 대전(⚗️), 세종(🏛️) 등 지역별 특색 있는 이모지와 파스텔톤 배경 조합.

### 8.4 핵심 UI 컴포넌트
- **매치/공모전 카드 (Interactive Card)**: 마우스 오버 시 카드가 살짝 떠오르며(Hover Lift) 그림자가 강조되는 3D 효과.
- **실시간 토스트 알림 (Toast Notifications)**: 알림 수신 시 우측 하단에서 미끄러지듯 나타나는 팝업(스낵바).
- **채팅 UI (Chat Bubble)**: 카카오톡 등 친숙한 메신저 스타일을 차용하되, 모서리가 둥근 세련된 말풍선과 부드러운 스크롤 제공.

---

## 9. 개발 단계별 로드맵

| 단계 | 내용 | 예상 기간 |
|------|------|----------|
| Phase 1 | 인증(이메일 회원가입/로그인) + DB 스키마 구축 | 1주 |
| Phase 2 | **(수정) 지역별 공모전 크롤러 (충청권/날짜/인원)** + 공모전 탭 | 1주 |
| Phase 3 | 스포츠 시설 예약 크롤러 + 스포츠 탭 기초 | 1주 |
| Phase 4 | 매치 모집글 작성 + 신청/수락 프로세스 + 알림 (Realtime) | 1주 |
| Phase 5 | **(신규) 메시지(1:1 & 그룹 채팅) + 내 정보(신청 관리)** | 1.5주 |
| Phase 6 | **(신규) 매너 평가 시스템** + Claude API 요약 연동 | 0.5주 |
| Phase 7 | QA, Vercel/Supabase 최적화 및 배포 | 1주 |

---

## 10. 환경 변수 목록

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
```
