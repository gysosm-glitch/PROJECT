# 충북대 매칭 플랫폼 - UI 기능 상세 가이드

## 📋 목차
1. [잠재적 오류 및 방지 방안](#1-잠재적-오류-및-방지-방안)
2. [공모전 탭 - 지역 필터링](#2️⃣-공모전-탭---지역-필터링)
3. [공모전 카드 - 지역 배지 & 최대 인원](#3️⃣-공모전-카드---지역-배지--최대-인원)
4. [네비게이션 - 메시지 탭 추가](#4️⃣-네비게이션---메시지-탭-추가)
5. [메시지 탭 - 1:1 & 그룹 채팅](#5️⃣-메시지-탭---1️⃣1--그룹-채팅)
6. [알림 탭 - 개선된 알림 피드](#6️⃣-알림-탭---개선된-알림-피드)
7. [프로필 탭 - 4단계 구성](#7️⃣-프로필-탭---4단계-구성)
8. [데이터 흐름 다이어그램](#-데이터-흐름-다이어그램)

---

## 🚨 1. 잠재적 오류 및 방지 방안

### 1.1 메시지 탭 - 테이블 구조 미스매치

**문제점:**
```typescript
// 현재 코드에서 message_rooms 테이블 쿼리
.from('message_rooms')
.select('*')
```

**위험:** PRD의 데이터베이스 스키마에 정의된 테이블들이 실제 Supabase에 없을 수 있습니다.

**해결책:**

Supabase 대시보드에서 다음 SQL을 실행하세요:

```sql
-- message_rooms 테이블 생성
CREATE TABLE message_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  is_group BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- messages 테이블 생성
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES message_rooms(id),
  sender_id UUID REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- room_members 테이블 생성
CREATE TABLE room_members (
  room_id UUID REFERENCES message_rooms(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- RLS 정책 설정
ALTER TABLE message_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
```

---

### 1.2 공모전 필터 - region 필드 NULL 가능성

**문제점:**
```typescript
// 공모전 카드에서
{contest.region && (
  <span>지역 배지</span>
)}
```

**위험:** 기존 공모전 데이터는 `region`이 NULL일 수 있어서 필터링 시 데이터가 누락됩니다.

**해결책:**

**옵션 1: 크롤러에서 지역 자동 파싱 추가**
```python
# crawlers/sports_crawler.py (공모전 크롤러)에 추가
def extract_region(organizer: str, title: str) -> str:
    """조직자명이나 제목에서 지역 추출"""
    regions = {
        '충청북도': ['충주', '제천', '청주', '음성', '단양'],
        '충청남도': ['대전', '아산', '천안', '공주'],
        '세종특별자치시': ['세종'],
        '대전광역시': ['대전']
    }

    text = (organizer + title).lower()
    for region, keywords in regions.items():
        if any(kw in text for kw in keywords):
            return region

    return None  # 지역을 판단할 수 없으면 None
```

**옵션 2: 기존 데이터 마이그레이션**
```sql
-- 충청권 지역으로 일괄 업데이트 (임시)
UPDATE contests
SET region = '충청북도'
WHERE region IS NULL AND created_at < NOW() - INTERVAL '7 days';
```

---

### 1.3 신청 관리 탭 - applications 테이블 미확인

**문제점:**
```typescript
const { data: appData } = await supabase
  .from('applications')
  .select('*, match_id(*)')  // ← match_id 조인이 실패할 수 있음
  .eq('applicant_id', authUser.id)
```

**위험:** `applications` 테이블이 없거나 구조가 다를 수 있습니다.

**해결책:**

먼저 테이블 존재 확인 후, 없으면 생성:

```sql
-- applications 테이블 생성 (없는 경우)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, applicant_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
```

**보안 쿼리로 수정:**
```typescript
// profile/page.tsx 수정
const { data: appData } = await supabase
  .from('applications')
  .select('*')  // 기본 필드만 먼저
  .eq('applicant_id', authUser.id)
  .order('created_at', { ascending: false })

if (error) {
  console.error('신청 조회 오류:', error)
  setApplications([])  // 에러 시 빈 배열로 처리
} else {
  setApplications(appData || [])
}
```

---

### 1.4 매너 평가 탭 - manner_score 필드 확인

**문제점:**
```typescript
setMannerScore(data?.manner_score || 0)
```

**위험:** users 테이블에 `manner_score` 컬럼이 없을 수 있습니다.

**해결책:**

```sql
-- users 테이블에 manner_score 컬럼 추가
ALTER TABLE users ADD COLUMN manner_score DECIMAL(3,2) DEFAULT 0.0;

-- 기존 컬럼이 있는지 확인
SELECT column_name FROM information_schema.columns
WHERE table_name='users' AND column_name='manner_score';
```

**안전한 코드:**
```typescript
// profile/page.tsx 수정
try {
  const { data } = await supabase
    .from('users')
    .select('*, manner_score')  // 명시적으로 선택
    .eq('id', authUser.id)
    .single()

  setMannerScore(data?.manner_score ?? 0)  // ?? 사용
} catch (error) {
  console.error('유저 정보 조회 실패:', error)
  setMannerScore(0)  // 기본값
}
```

---

### 1.5 메시지 페이지 - other_user_nickname 필드 없음

**문제점:**
```typescript
room.other_user_nickname?.toLowerCase()
```

**위险:** message_rooms 테이블에 이 필드가 없습니다.

**해결책:**

**수정된 쿼리:**
```typescript
// messages/page.tsx 수정
const fetchRooms = async () => {
  setLoading(true)

  const { data, error } = await supabase
    .from('message_rooms')
    .select(`
      *,
      room_members!inner(
        user_id,
        users!inner(nickname)
      )
    `)
    .neq('room_members.user_id', currentUser)  // 다른 사용자만
    .order('created_at', { ascending: false })

  if (error) {
    console.error('메시지 방 조회 오류:', error)
  } else {
    // 데이터 변환
    const transformedRooms = data.map(room => ({
      ...room,
      other_user_nickname: room.room_members[0]?.users?.nickname || '채팅방'
    }))
    setRooms(transformedRooms as MessageRoom[])
  }
  setLoading(false)
}
```

---

## 2️⃣ 공모전 탭 - 지역 필터링

### 📍 위치
- **파일**: `app/(main)/contest/page.tsx`
- **컴포넌트**: `components/contest/ContestFilter.tsx`
- **경로**: `/contest`

### 🎯 기능 흐름

```
사용자 접근 (/contest)
  ↓
[분야 필터] + [지역 필터] 2단계 필터 표시
  ↓
분야 선택 (마케팅, IT, 디자인 등)
+ 지역 선택 (충북, 충남, 세종, 대전)
  ↓
두 필터 조건 모두 적용하여 DB 쿼리
  ↓
supabase.from('contests')
  .eq('field', activeField)
  .eq('region', activeRegion)
  ↓
공모전 카드 목록 업데이트 (무한 스크롤)
```

### 🎨 UI 구성

```
┌─────────────────────────────────────────────┐
│          분야 필터 (가로 스크롤)              │
│  🎯전체 📢마케팅 🎬영상 🎨디자인...        │
│  (선택된 것은 파란색 배경/그림자)           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          지역 필터 (가로 스크롤)              │
│  🌍전체 🏔️충북 🌊충남 🏛️세종 ⚗️대전       │
│  (선택된 것은 주황색 배경/그림자)           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          공모전 카드 그리드 (무한 스크롤)    │
│  [카드1] [카드2] [카드3] [카드4]          │
│  [카드5] [카드6] [카드7] [카드8]          │
└─────────────────────────────────────────────┘
```

### 💡 사용 예시

**예시 1: IT 공모전 + 충청북도**
```
1. 분야 필터에서 "IT·소프트웨어" 클릭
   → activeField = 'it'
   → 모든 IT 분야 공모전으로 자동 필터링

2. 지역 필터에서 "충청북도" 클릭
   → activeRegion = '충청북도'
   → 결과: 충청북도 지역의 IT 공모전만 표시

결과 데이터:
- "2026 AI 공모전" (충청북도/IT/D-5)
- "Python 챌린지" (충청북도/IT/D-3)
```

**예시 2: 전체 + 대전광역시**
```
1. 분야 필터에서 "전체" 클릭
   → activeField = 'all'

2. 지역 필터에서 "대전광역시" 클릭
   → activeRegion = '대전광역시'
   → 결과: 대전의 모든 분야 공모전 표시

결과 데이터:
- "UCC 공모전" (대전/영상/D-7)
- "디자인 어워드" (대전/디자인/D-2)
- "마케팅 아이디어" (대전/마케팅/D-10)
```

### ⚠️ 주의사항

| 항목 | 설명 |
|------|------|
| 필터 조건 | **AND** 조건으로 작동 (둘 다 만족하는 것만) |
| 기존 데이터 | region이 NULL이면 필터링되지 않음 |
| 무한 스크롤 | 필터 상태가 유지됨 (변경 시 초기화) |
| 검색 + 필터 | 제목 검색과 필터가 동시에 작동 |
| 성능 | 1회 12개씩 로딩 (PAGE_SIZE = 12) |

### 🔧 구현 코드

**필터 변경 핸들러:**
```typescript
// app/(main)/contest/page.tsx
<ContestFilter
  activeField={activeField}
  activeRegion={activeRegion}
  onChange={(f, r) => {
    if (f !== undefined) setActiveField(f)      // 분야만 변경
    if (r !== undefined) setActiveRegion(r)    // 지역만 변경
  }}
/>
```

**DB 쿼리:**
```typescript
const fetchContests = useCallback(async (
  pageNum: number,
  field: ContestField | 'all',
  region: ContestRegion | 'all',
  q: string
) => {
  const from = pageNum * PAGE_SIZE
  let query = supabase
    .from('contests')
    .select('*')
    .eq('is_active', true)                    // 활성 공모전만
    .order('end_date', { ascending: true })   // 마감일 순서
    .range(from, from + PAGE_SIZE - 1)

  if (field !== 'all') query = query.eq('field', field)
  if (region !== 'all') query = query.eq('region', region)
  if (q) query = query.ilike('title', `%${q}%`)

  const { data, error } = await query
  return data as Contest[]
}, [supabase])
```

---

## 3️⃣ 공모전 카드 - 지역 배지 & 최대 인원

### 📍 위치
- **파일**: `components/contest/ContestCard.tsx`
- **경로**: `/contest` 페이지의 카드 그리드

### 🎯 기능

```
공모전 카드 레이아웃:

┌─────────────────────────────────────┐
│ 이미지 영역 (h-40)                  │
│ ┌─────────────────────────────────┐ │
│ │ [분야] [지역배지]  |  [D-2] 마감  │ │
│ │                                 │ │
│ │  (공모전 썸네일 이미지)          │ │
│ │  또는 Trophy 아이콘 배경         │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ 콘텐츠 영역 (p-4)                   │
│ ┌─────────────────────────────────┐ │
│ │ 2026 AI 아이디어 공모전        │ │
│ │ (2줄 제한)                      │ │
│ │                                 │ │
│ │ 🏢 한국정보통신기술협회         │ │
│ │                                 │ │
│ │ 💰 상금 1,000만원               │ │
│ │                                 │ │
│ │ 📅 ~5월 [최대 4명] [🔗]        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 🎨 배지 색상 및 스타일

#### 분야 배지 (좌상단)
```
배경: primary-600 (파란색)
텍스트: white
예: [IT·소프트웨어]
```

#### 지역 배지 (분야 배지 옆)
```
배경: rgba(168, 85, 247, 0.2)  (보라색, 20% 투명)
텍스트: #d8b4fe                 (밝은 보라)
테두리: 1px solid rgba(168, 85, 247, 0.3)
예: [🏔️] [🌊] [🏛️] [⚗️]
```

#### 마감 배지 (우상단)
| 상황 | 배지 | 스타일 | 예시 |
|------|------|--------|------|
| 마감됨 | [마감] | badge-red | 회색 배경 |
| 오늘 마감 | [오늘마감] | badge-red + pulse 애니메이션 | 빨강 깜빡임 |
| D-1~3 | [D-2] | 주황색 배경 | 주황 |
| D-4~7 | [D-5] | 연 주황색 배경 | 밝은 주황 |
| D-8+ | [D-10] | primary-색 | 파란색 |

#### 최대 인원 정보 (하단)
```
텍스트: text-accent-400 (주황색)
예: 최대 4명 | 최대 5명
```

### 💡 사용 예시

**카드 전체 예시:**
```
┌─────────────────────────────┐
│ [IT]     [🏔️]    [D-2] 마감 │
│                             │
│  (썸네일 이미지)             │
│                             │
├─────────────────────────────┤
│ 2026 AI 아이디어 공모전    │
│                             │
│ 🏢 한국정보통신기술협회     │
│ 💰 상금 1,000만원           │
│                             │
│ 📅 ~5월   [최대 4명] →     │
└─────────────────────────────┘
```

### 🔧 구현 코드

**지역 배지 렌더링:**
```typescript
// components/contest/ContestCard.tsx
{contest.region && (
  <span
    className="badge text-xs backdrop-blur-sm"
    style={{
      background: 'rgba(168, 85, 247, 0.2)',
      color: '#d8b4fe',
      border: '1px solid rgba(168, 85, 247, 0.3)'
    }}
  >
    {CONTEST_REGION_EMOJIS[contest.region]}
  </span>
)}
```

**최대 인원 표시:**
```typescript
{contest.max_participants && (
  <div className="text-xs text-gray-500">
    <span className="text-accent-400 font-medium">
      최대 {contest.max_participants}명
    </span>
  </div>
)}
```

### ⚠️ 주의사항

| 항목 | 주의 |
|------|------|
| 이미지 로딩 | 썸네일 없으면 Trophy 아이콘으로 대체 |
| 마감일 계산 | UTC 기준으로 계산됨 |
| 클릭 동작 | 카드 전체가 링크 (`/contest/[id]`) |
| Hover 효과 | 카드가 살짝 떠오르고 그림자 강조 |
| 반응형 | 모바일 2열, 태블릿 3열, 데스크톱 4열 |

---

## 4️⃣ 네비게이션 - 메시지 탭 추가

### 📍 위치
- **파일**: `components/layout/Navbar.tsx`
- **경로**: 모든 페이지의 상단

### 🎯 기능

```
Navbar 구성:

┌────────────────────────────────────────────┐
│ 🎯충북대 매칭  공모전│스포츠│메시지  🔔│👤 │
└────────────────────────────────────────────┘
               ↑ 새로 추가
```

### 🎨 UI 구성

**데스크톱 (md 이상):**
```
[로고] [공모전] [스포츠] [메시지] [🔔] [프로필] [로그아웃]
```

**모바일 (md 미만):**
```
[로고] [🔔] [프로필] [로그아웃] [☰ 메뉴]
  ↓ 메뉴 열기
  [공모전]
  [스포츠]
  [메시지]
```

### 💡 사용 예시

**시나리오: 메시지 확인**
```
1. 사용자가 Navbar의 "메시지" 클릭
   → /messages 페이지로 라우팅

2. 메시지 페이지 로드
   → 현재 사용자의 모든 채팅 목록 표시
   → 선택한 채팅방의 메시지 표시

3. 메시지 입력 및 전송
   → Realtime으로 상대방에게 즉시 전달
```

### 🔧 구현 코드

**Navbar 탭 추가:**
```typescript
// components/layout/Navbar.tsx
import { MessageCircle } from 'lucide-react'

const navLinks = [
  { href: '/contest', label: '공모전', icon: Trophy },
  { href: '/sports', label: '스포츠', icon: Dumbbell },
  { href: '/messages', label: '메시지', icon: MessageCircle },  // 추가됨
]
```

### ⚠️ 주의사항

| 항목 | 설명 |
|------|------|
| 활성 상태 | 현재 경로와 일치하면 파란색 배경 |
| 모바일 메뉴 | 메시지 탭도 포함됨 |
| 반응형 | 데스크톱/모바일 레이아웃 자동 전환 |

---

## 5️⃣ 메시지 탭 - 1:1 & 그룹 채팅

### 📍 위치
- **파일**: `app/(main)/messages/page.tsx`
- **경로**: `/messages`
- **테이블**: `message_rooms`, `messages`, `room_members`

### 🎯 전체 레이아웃

```
┌──────────────────────────────────────────────────────┐
│ 📬 메시지                                            │
├──────────────┬──────────────────────────────────────┤
│  대화 목록   │                                      │
│  (좌측)     │   메시지 내용 표시 (우측, 데스크톱) │
│             │                                      │
│ [검색창]    │  [상대방] 메시지 말풍선            │
│             │                                      │
│ [대화1] ✓   │  [나] 메시지 말풍선                │
│ [대화2]     │                                      │
│ [대화3]     │  [상대방] 메시지 말풍선            │
├─────────────┼──────────────────────────────────────┤
│             │ [입력창]            [전송버튼]      │
└─────────────┴──────────────────────────────────────┘
```

### 📱 반응형 레이아웃

**데스크톱 (md 이상):**
- 좌측 25% (md:col-span-1): 대화 목록
- 우측 75% (md:col-span-3): 메시지 표시
- 동시 표시

**모바일 (md 미만):**
- 전체화면: 대화 목록 또는 메시지
- 대화 선택 시 메시지로 전환
- 뒤로가기로 목록 복귀

### 🎯 기능 상세

#### A) 대화 목록 (좌측)

**검색 기능:**
```
┌─────────────────────┐
│ 🔍 검색...          │
└─────────────────────┘
```
- 상대방 닉네임으로 검색
- 실시간 필터링

**대화 목록:**
```
읽지 않은 대화:
┌──────────────────────┐
│ 김철수 (공모전팀)   │ ← 파란색 배경
│ 마지막: 안녕하세요! │   (활성화)
│ 14:32                │
└──────────────────────┘

읽은 대화:
┌──────────────────────┐
│ 박영희 (축구파트너) │ ← 회색 배경
│ 마지막: 감사합니다!  │   (비활성화)
│ 어제                 │
└──────────────────────┘

그룹 채팅:
┌──────────────────────┐
│ 충북대 개발팀 (그룹) │
│ 3명이 참여중         │
│ 어제                 │
└──────────────────────┘
```

**Realtime 구독:**
```typescript
// 새 메시지 INSERT 감지
supabase
  .channel('messages_...')
  .on('INSERT', ...)
  .subscribe()
```

#### B) 메시지 영역 (우측)

**메시지 말풍선 스타일:**

내가 보낸 메시지:
```
                     ┌─────────────────┐
                     │ 안녕하세요!     │
                     └──┘ (파란색)     │
                        bg-primary-600  │
                        text-white      │
                        round-br-none   │
                        오른쪽 정렬     │
```

상대가 보낸 메시지:
```
┌──────────────────┐
│ 안녕하세요!      │
└────────────────┘ (회색)
bg-surface-elevated │
text-gray-300       │
round-bl-none       │
왼쪽 정렬           │
```

**메시지 흐름:**
```
[14:30] 김철수: 안녕하세요!
[14:31] 나: 안녕하세요!
[14:32] 김철수: 프로젝트 협업하시겠어요?
[14:33] 나: 좋습니다!
[14:34] 김철수: 감사합니다!
```

**입력 영역:**
```
┌──────────────────────────────┐
│ [메시지 입력...] [전송 버튼] │
└──────────────────────────────┘
     ↓
입력 후 전송 클릭
     ↓
Realtime INSERT
     ↓
즉시 화면에 표시
```

### 🔄 Realtime 기능

**구독 방식:**
```typescript
// 새 메시지 감지
supabase
  .channel(`messages_${selectedRoomId}`)
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${selectedRoomId}`
    },
    () => {
      fetchMessages()  // 메시지 다시 로드
    }
  )
  .subscribe()
```

**장점:**
- WebSocket 기반 즉시 통지
- 새로고침 없이 자동 업데이트
- 무료 (Supabase 내장)

### 🔧 구현 코드

**메시지 전송:**
```typescript
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!messageInput.trim() || !selectedRoomId || !currentUser) return

  const { error } = await supabase
    .from('messages')
    .insert({
      room_id: selectedRoomId,
      sender_id: currentUser,
      content: messageInput,
    })

  if (error) {
    console.error('메시지 전송 오류:', error)
  } else {
    setMessageInput('')  // 입력창 초기화
    // Realtime으로 자동 표시
  }
}
```

**메시지 조회:**
```typescript
const fetchMessages = async () => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', selectedRoomId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('메시지 조회 오류:', error)
  } else {
    setMessages(data as Message[])
  }
}
```

### ⚠️ 주의사항

| 항목 | 설명 |
|------|------|
| 테이블 생성 필수 | message_rooms, messages, room_members 필수 |
| RLS 정책 | room_members 확인 후에만 메시지 접근 가능 |
| 성능 | 장문 대화는 페이지네이션 필요 |
| 파일 전송 | 현재는 텍스트만 지원 (이미지는 추후) |
| 삭제 기능 | 현재 미구현 (추가 예정) |

---

## 6️⃣ 알림 탭 - 개선된 알림 피드

### 📍 위치
- **파일**: `app/(main)/notifications/page.tsx`
- **경로**: `/notifications`
- **테이블**: `notifications`

### 🎯 전체 레이아웃

```
┌──────────────────────────────────────┐
│ 🔔 알림                              │
│ 총 5개 알림 중 읽지 않은 항목 2개   │
│                     [모두 읽음 버튼] │
├──────────────────────────────────────┤
│                                      │
│ 필터 탭:                              │
│ [전체] [읽지 않음(2)]                │
│                                      │
│ 읽지 않은 알림들:                    │
│ ┌──────────────────────────────────┐ │
│ │ 🏆 매칭 신청                      │ │
│ │ 김철수님이 공모전 팀원으로 신청  │ │
│ │ 5월 28일 14:30                   │ │
│ │               [✓읽음] [🗑️삭제]  │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ ✅ 매칭 수락                      │ │
│ │ 박영희님이 축구 매칭을 수락했어요│ │
│ │ 5월 28일 12:15                   │ │
│ │               [✓읽음] [🗑️삭제]  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 읽은 알림들:                         │
│ ┌──────────────────────────────────┐ │
│ │ ❌ 매칭 거절 (흐린 표시)          │ │
│ │ 이준호님이 매칭을 거절했어요      │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### 📌 알림 유형별 아이콘 & 색상

| 유형 | 아이콘 | 색상 | 설명 |
|------|--------|------|------|
| match_request | 🏆 Trophy | 주황색 | 누군가 매칭 신청 |
| match_accepted | ✅ CheckCircle2 | 초록색 | 매칭 신청 수락 |
| match_rejected | ❌ XCircle | 빨강색 | 매칭 신청 거절 |
| new_message | 💬 MessageCircle | 파란색 | 새 메시지 도착 |

### 🎯 기능 상세

#### A) 헤더

```
┌────────────────────────────────┐
│ 🔔 알림                        │
│ 총 5개 중 읽지 않음 2개       │
│              [모두 읽음] 버튼 │
└────────────────────────────────┘
```

**모두 읽음 버튼:**
- 읽지 않은 알림이 0개면 숨김
- 클릭 시 모든 알림 읽음 처리
- 즉시 UI 업데이트

#### B) 필터 탭

```
┌──────────────────────────────┐
│ [전체] [읽지 않음(2)]        │
└──────────────────────────────┘
```

**전체 탭:**
```typescript
.select('*')
.eq('user_id', authUser.id)
.order('created_at', { ascending: false })
```

**읽지 않음 탭:**
```typescript
.select('*')
.eq('user_id', authUser.id)
.eq('is_read', false)
.order('created_at', { ascending: false })
```

#### C) 알림 카드

**읽지 않은 알림:**
```
┌──────────────────────────────┐
│ 🏆│ 매칭 신청               │ │
│   │ 김철수님이 신청했어요    │ │
│   │ 5월 28일 14:30          │ │
│   │               [✓][🗑️]  │ │
└──────────────────────────────┘
 ↑ 왼쪽 테두리 (accent-500/50)
 배경: accent-600/5 (연한 주황)
 아이콘 배경: accent-600/20 (진한 주황)
```

**읽은 알림:**
```
┌──────────────────────────────┐
│ ❌│ 매칭 거절 (opacity-70)  │ │
│   │ 이준호님이 거절했어요    │ │
│   │ 5월 27일 10:00          │ │
│   │               [✓][🗑️]  │ │
└──────────────────────────────┘
```

#### D) 알림 액션

**읽음 버튼:**
- 읽지 않은 알림에만 표시
- Hover 시 나타남 (모바일: 항상 표시)
- 클릭 시 읽음 상태로 변경

**삭제 버튼:**
- 모든 알림에 표시
- Hover 시 빨강색으로 변함
- 클릭 시 DB에서 삭제

### 🔄 Realtime 기능

**구독:**
```typescript
supabase
  .channel('notifications_channel')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${currentUser}`
    },
    () => {
      fetchNotifications()
    }
  )
  .subscribe()
```

**효과:**
- 다른 사용자가 신청하면 즉시 알림 도착
- 자동 새로고침
- 토스트 알림도 함께 표시 가능

### 🔧 구현 코드

**필터 변경:**
```typescript
const handleFilterChange = (newFilter: 'all' | 'unread') => {
  setFilter(newFilter)
  // useEffect가 자동으로 발동되어 데이터 다시 조회
}
```

**읽음 처리:**
```typescript
const handleMarkAsRead = async (notificationId: string, isRead: boolean) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: !isRead })
    .eq('id', notificationId)

  if (!error) {
    // UI 즉시 업데이트
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, is_read: !isRead } : n
    ))
  }
}
```

### ⚠️ 주의사항

| 항목 | 설명 |
|------|------|
| 알림 생성 | API에서 명시적으로 insert 필요 |
| 마감 시간 | notifications.created_at은 UTC |
| 삭제 불가 복구 | 삭제 후 DB에서 완전 제거 |
| 토스트 알림 | 별도 컴포넌트로 추가 가능 |
| 최대 개수 | 성능 위해 최근 100개만 로드 권장 |

---

## 7️⃣ 프로필 탭 - 4단계 구성

### 📍 위치
- **파일**: `app/(main)/profile/page.tsx`
- **경로**: `/profile`
- **테이블**: `users`, `applications`, `reviews`

### 🎯 전체 레이아웃

```
┌────────────────────────────────────────────┐
│ 내 프로필                                  │
├────────────────────────────────────────────┤
│                                            │
│ ┌──────────────┐                          │
│ │ 🅂김철수     │ 김철수                   │
│ │              │ gysos@chungbuk.ac.kr     │
│ │              │ 학번: 2024000001        │
│ │              │                    ⭐4.8│
│ └──────────────┘ [매너평가점수]           │
│                                            │
├─ [공모전] [스포츠] [신청관리] [평가] ──┤
│                                            │
│ ◄ 선택된 탭의 콘텐츠가 여기 표시됨 ►     │
│                                            │
└────────────────────────────────────────────┘
```

### 👤 프로필 카드

```
┌──────────────────────────────────────┐
│ ┌─────────┐                          │
│ │    🅂   │ 김철수               ⭐ │
│ │ 16x16  │ gysos@chungbuk.ac.kr   4.8 │
│ │        │ 학번: 2024000001       /5.0 │
│ └─────────┘                          │
└──────────────────────────────────────┘
```

**요소:**
- **아바타**: 닉네임 첫 글자 (원형, primary 그라데이션)
- **닉네임**: 큰 폰트 (xl, bold)
- **이메일**: 회색 (gray-400)
- **학번**: 작은 텍스트 (sm, gray-500)
- **매너 점수**: 오른쪽 상단 배지

**매너 점수 배지:**
```
┌──────────────┐
│ ⭐⭐⭐⭐☆  │
│    4.8       │
│  /5.0       │
│ 매너 평가    │
└──────────────┐
배경: primary-900/30
테두리: primary-500/20
```

### 🎯 탭 구조

#### 탭 1️⃣: 공모전 프로필

```
┌─────────────────────────────────────┐
│ 🏆 공모전 매칭 프로필              │
│                      [편집] 버튼   │
│                                     │
│ 공모전 팀원 매칭을 위한             │
│ 프로필 정보입니다.                  │
│                                     │
│ 프로필 정보를 입력하여              │
│ 공모전 팀원 매칭에 참여하세요.    │
│                                     │
│ [공모전 프로필 관리] 버튼          │
│                                     │
├─────────────────────────────────────┤
│ ⚠️ 프로필이 보이지 않나요?       │
│ 프로필을 공개 설정해야 보입니다.  │
└─────────────────────────────────────┘
```

**기능:**
- Modal 열기 (`ContestProfileModal`)
- 학과, 경험, 관심 분야, 자격증 입력/수정
- 프로필 공개/비공개 토글

#### 탭 2️⃣: 스포츠 프로필

```
┌─────────────────────────────────────┐
│ 🏋️ 스포츠 매칭 프로필              │
│                      [편집] 버튼   │
│                                     │
│ 스포츠 파트너 매칭을 위한           │
│ 프로필 정보입니다.                  │
│                                     │
│ 프로필 정보를 입력하여              │
│ 스포츠 파트너 매칭에 참여하세요.  │
│                                     │
│ [스포츠 프로필 관리] 버튼          │
│                                     │
├─────────────────────────────────────┤
│ ⚠️ 프로필이 보이지 않나요?       │
│ 프로필을 공개 설정해야 보입니다.  │
└─────────────────────────────────────┘
```

**기능:**
- Modal 열기 (`SportsProfileModal`)
- 종목, 경력, 수준, 자기소개 입력/수정
- 프로필 공개/비공개 토글

#### 탭 3️⃣: 신청 관리

**신청 없음:**
```
┌─────────────────────────────────┐
│ ⏰ 신청 관리                     │
│                                 │
│ 신청 내역이 없습니다.           │
│                                 │
│ 공모전이나 스포츠 매칭을        │
│ 신청해보세요!                   │
└─────────────────────────────────┘
```

**신청 목록:**
```
┌─────────────────────────────────┐
│ ┌──────────────────────────────┐│
│ │ 매칭 신청                   ││
│ │ 5월 28일                    ││
│ │              [✅ 수락됨]     ││
│ └──────────────────────────────┘│
│                                 │
│ ┌──────────────────────────────┐│
│ │ 매칭 신청                   ││
│ │ 5월 27일                    ││
│ │              [⏳ 대기 중]    ││
│ └──────────────────────────────┘│
│                                 │
│ ┌──────────────────────────────┐│
│ │ 매칭 신청                   ││
│ │ 5월 26일                    ││
│ │              [❌ 거절됨]     ││
│ └──────────────────────────────┘│
└─────────────────────────────────┘
```

**상태 배지:**

| 상태 | 배지 | 배경색 | 텍스트색 |
|------|------|--------|----------|
| 수락 | ✅ 수락됨 | bg-green-900/20 | text-green-400 |
| 대기 | ⏳ 대기 중 | bg-accent-900/20 | text-accent-400 |
| 거절 | ❌ 거절됨 | bg-red-900/20 | text-red-400 |

**코드:**
```typescript
applications.map(app => (
  <div key={app.id} className="glass-card p-4">
    <div className="flex justify-between">
      <div>
        <p className="text-white font-medium">매칭 신청</p>
        <p className="text-gray-400 text-xs">
          {new Date(app.created_at).toLocaleDateString('ko-KR')}
        </p>
      </div>
      {/* 상태 배지 */}
      {app.status === 'accepted' && (
        <span className="text-xs text-green-400 bg-green-900/20 px-2.5 py-1 rounded-full">
          ✅ 수락됨
        </span>
      )}
      {/* ... 다른 상태들 ... */}
    </div>
  </div>
))
```

#### 탭 4️⃣: 매너 평가

```
┌─────────────────────────────────┐
│ ⭐ 매너 평가                    │
│                                 │
│ 경기나 협업이 끝난 후            │
│ 상대방을 평가할 수 있습니다.   │
│ 별점(1~5점)으로 평가하면       │
│ 누적 매너 스코어가 계산됩니다. │
│                                 │
├─────────────────────────────────┤
│                                 │
│ 현재 매너 점수                   │
│ ⭐⭐⭐⭐☆                      │
│ 4.8 / 5.0                      │
│                                 │
├─────────────────────────────────┤
│                                 │
│ 평가 항목:                       │
│ • 약속 시간 준수                │
│ • 친절함                        │
│ • 책임감                        │
│ • 성실성                        │
│ • 소통 능력                     │
│                                 │
└─────────────────────────────────┘
```

**구성:**

1. **설명 텍스트:**
   ```
   경기나 협업이 끝난 후 상대방을 평가할 수 있습니다.
   별점(1~5점)으로 평가하면 누적 매너 스코어가 계산됩니다.
   ```

2. **점수 표시:**
   ```
   ┌──────────────────────┐
   │ 현재 매너 점수       │
   │ ⭐⭐⭐⭐☆          │
   │ 4.8 / 5.0            │
   └──────────────────────┘
   배경: accent-900/10 (연한 주황)
   테두리: accent-500/20 (매우 연한 주황)
   ```

3. **평가 항목 설명:**
   ```
   └─ 약속 시간 준수
   └─ 친절함
   └─ 책임감
   └─ 성실성
   └─ 소통 능력

   배경: surface-elevated
   ```

**별점 표시 로직:**
```typescript
Array.from({ length: 5 }).map((_, i) => (
  <Star
    key={i}
    className={`w-5 h-5 ${
      i < Math.floor(mannerScore)
        ? 'fill-accent-400 text-accent-400'  // 채워진 별
        : 'text-gray-600'                     // 빈 별
    }`}
  />
))
```

### 🎨 탭 버튼 스타일

**활성 탭:**
```
배경: color-600/20 (색상/20)
테두리: color-500/30 (색상/30)
텍스트: color-300 (밝은 색상)
```

**비활성 탭:**
```
배경: surface-elevated
테두리: surface-border
텍스트: gray-400
Hover: text-white
```

**탭 구성:**
```
[🏆 공모전] [🏋️ 스포츠] [⏰ 신청관리] [⭐ 평가]
    ↑                                    ↑
 파란색 활성                      주황색 활성
```

### 🔧 구현 코드

**탭 전환:**
```typescript
const [activeTab, setActiveTab] = useState('contest')

// 버튼
<button
  onClick={() => setActiveTab('applications')}
  className={`
    flex items-center gap-2 px-3 py-3 rounded-lg font-medium
    ${activeTab === 'applications'
      ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
      : 'bg-surface-elevated text-gray-400 hover:text-white'
    }
  `}
>
  <Clock className="w-4 h-4" />
  신청 관리
</button>

// 콘텐츠
{activeTab === 'applications' && (
  <div className="space-y-4 animate-fade-in">
    {/* 신청 목록 */}
  </div>
)}
```

**데이터 로드:**
```typescript
useEffect(() => {
  const checkAuth = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()

    // 유저 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    setUser(userData)
    setMannerScore(userData?.manner_score || 0)

    // 신청 목록 조회
    const { data: appData } = await supabase
      .from('applications')
      .select('*')
      .eq('applicant_id', authUser.id)
      .order('created_at', { ascending: false })

    setApplications(appData || [])
  }

  checkAuth()
}, [supabase, router])
```

### ⚠️ 주의사항

| 항목 | 설명 |
|------|------|
| Modal 렌더링 | position: fixed, z-50으로 레이어 관리 |
| 데이터 새로고침 | Modal 닫기 후 자동 새로고침 필요 |
| 모바일 반응형 | 모달이 전체화면 차지하도록 설정 |
| 성능 최적화 | applications 조회 시 limit 추가 권장 |
| 매너 점수 계산 | reviews 테이블 AVG() 함수 사용 |

---

## 📊 데이터 흐름 다이어그램

### 공모전 필터링 흐름

```
사용자 입력
  │
  ├─ activeField 변경 (분야)
  │   │
  │   └─→ useEffect 발동
  │
  └─ activeRegion 변경 (지역)
      │
      └─→ useEffect 발동

useEffect 내부:
  │
  ├─ setLoading(true)
  ├─ setPage(0)
  ├─ setHasMore(true)
  │
  └─→ fetchContests(0, activeField, activeRegion, search)
      │
      └─→ supabase
          .from('contests')
          .select('*')
          .eq('field', activeField)    # 분야 필터
          .eq('region', activeRegion)  # 지역 필터
          .eq('is_active', true)       # 활성만
          .order('end_date')           # 마감일순
          .range(0, 11)                # 첫 12개
      │
      └─→ data: Contest[]
          │
          └─→ setContests(data)
              setHasMore(data.length === 12)
              setLoading(false)

UI 업데이트:
  │
  └─→ contests.map() → ContestCard
      │
      └─→ 필터된 공모전 카드 그리드 표시

무한 스크롤:
  │
  ├─ Intersection Observer 감지
  │   (페이지 끝 도달)
  │
  └─→ fetchContests(page+1, ...)
      │
      └─→ setContests(prev => [...prev, ...data])
```

### 메시지 Realtime 구독 흐름

```
메시지 페이지 진입 (/messages)

1️⃣ 초기 데이터 로드
  │
  ├─ fetchRooms()
  │   └─→ supabase
  │       .from('message_rooms')
  │       .select('*')
  │       .order('created_at')
  │   └─→ setRooms(data)
  │
  └─ Realtime 구독:
      supabase
        .channel('message_rooms_channel')
        .on('INSERT', ...)
        .subscribe()

사용자가 대화방 선택

2️⃣ 메시지 조회
  │
  ├─ fetchMessages()
  │   └─→ supabase
  │       .from('messages')
  │       .select('*')
  │       .eq('room_id', selectedRoomId)
  │       .order('created_at', { ascending: true })
  │   └─→ setMessages(data)
  │
  └─ Realtime 구독:
      supabase
        .channel(`messages_${selectedRoomId}`)
        .on('INSERT', ...)
        .subscribe()

사용자가 메시지 입력 & 전송

3️⃣ 메시지 INSERT
  │
  ├─ supabase
  │   .from('messages')
  │   .insert({
  │     room_id: selectedRoomId,
  │     sender_id: currentUser,
  │     content: messageInput
  │   })
  │
  └─ Realtime 감지:
      INSERT 이벤트 발생
      │
      └─→ fetchMessages() 자동 호출
          │
          └─→ setMessages() 업데이트
              │
              └─→ 화면에 즉시 표시

상대방 화면:
  │
  ├─ Realtime 구독 중
  │   │
  │   └─ INSERT 이벤트 감지
  │       │
  │       └─→ fetchMessages() 자동 호출
  │           │
  │           └─→ 새 메시지 즉시 표시
```

### 알림 Realtime 구독 흐름

```
알림 페이지 진입 (/notifications)

1️⃣ 초기 로드
  │
  ├─ fetchNotifications()
  │   └─→ supabase
  │       .from('notifications')
  │       .select('*')
  │       .eq('user_id', authUser.id)
  │       .eq('is_read', filter === 'unread')
  │       .order('created_at')
  │   └─→ setNotifications(data)
  │
  └─ Realtime 구독:
      supabase
        .channel('notifications_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            filter: `user_id=eq.${currentUser}`
          }
        )
        .subscribe()

다른 사용자가 매칭 신청

2️⃣ notifications INSERT 발생
  │
  ├─ 데이터베이스 INSERT
  │   INSERT INTO notifications (
  │     user_id,
  │     type: 'match_request',
  │     content,
  │     is_read: false
  │   )
  │
  └─ Realtime 감지:
      INSERT 이벤트 발생
      │
      └─→ fetchNotifications() 자동 호출
          │
          ├─→ setNotifications() 업데이트
          │
          └─→ UI 즉시 새로고침
              (최상단에 새 알림 추가)

사용자가 알림 읽음 처리

3️⃣ 알림 UPDATE
  │
  ├─ supabase
  │   .from('notifications')
  │   .update({ is_read: true })
  │   .eq('id', notificationId)
  │
  └─→ setNotifications() 로컬 업데이트
      │
      └─→ 카드 투명도 감소
```

---

## 📝 요약 체크리스트

### ✅ 구현 완료 항목

- [x] 공모전 탭 - 지역 필터 (충북/충남/세종/대전)
- [x] 공모전 카드 - 지역 배지 + 최대 인원
- [x] Navbar - 메시지 탭 추가
- [x] 메시지 페이지 - 1:1 & 그룹 채팅
- [x] 알림 페이지 - 필터 + 액션
- [x] 프로필 탭 - 4개 탭 구성

### ⚠️ 사전 처리 필요 항목

- [ ] Supabase - message_rooms, messages, room_members 테이블 생성
- [ ] Supabase - applications 테이블 확인/생성
- [ ] Supabase - users 테이블에 manner_score 컬럼 추가
- [ ] RLS 정책 설정 (모든 새 테이블)
- [ ] 크롤러 - 공모전 region 자동 파싱 추가

### 🚀 배포 후 테스트

- [ ] 공모전 필터 동작 확인
- [ ] 메시지 Realtime 동작 확인
- [ ] 알림 Realtime 동작 확인
- [ ] 프로필 탭 데이터 조회 확인
- [ ] 모바일 반응형 레이아웃 확인

---

**작성일:** 2026-05-28
**최종 업데이트:** 커밋 `1ea1371`
