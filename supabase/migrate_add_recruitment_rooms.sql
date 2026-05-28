-- ================================================
-- 팀원 모집방(Recruitment Rooms) 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- 1. recruitment_rooms 테이블
-- 팀원 모집 방을 나타내는 메인 테이블
CREATE TABLE IF NOT EXISTS public.recruitment_rooms (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('contest', 'sports')),
  contest_id        UUID REFERENCES public.contests(id) ON DELETE CASCADE,
  sports_facility   TEXT CHECK (sports_facility IN (
                      'futsal_a', 'futsal_b',
                      'basketball_a', 'basketball_b',
                      'tennis_a', 'tennis_b', 'tennis_c', 'tennis_d', 'tennis_e',
                      'small_field', 'main_field'
                    )),
  sports_date       DATE,
  sports_start_time TIME,
  sports_end_time   TIME,
  title             TEXT NOT NULL,
  description       TEXT,
  required_members  INT NOT NULL CHECK (required_members >= 2 AND required_members <= 20),
  current_members   INT DEFAULT 1,
  status            TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  is_recruiting     BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2. room_applications 테이블
-- 팀원 모집방 입장 신청 기록
CREATE TABLE IF NOT EXISTS public.room_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id           UUID NOT NULL REFERENCES public.recruitment_rooms(id) ON DELETE CASCADE,
  applicant_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message           TEXT,
  applied_at        TIMESTAMPTZ DEFAULT NOW(),
  decided_at        TIMESTAMPTZ,
  UNIQUE(room_id, applicant_id)
);

-- ================================================
-- Indexes
-- ================================================
CREATE INDEX IF NOT EXISTS idx_recruitment_rooms_host ON public.recruitment_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_rooms_type ON public.recruitment_rooms(type);
CREATE INDEX IF NOT EXISTS idx_recruitment_rooms_contest ON public.recruitment_rooms(contest_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_rooms_status ON public.recruitment_rooms(status);
CREATE INDEX IF NOT EXISTS idx_recruitment_rooms_is_recruiting ON public.recruitment_rooms(is_recruiting);
CREATE INDEX IF NOT EXISTS idx_room_applications_room ON public.room_applications(room_id);
CREATE INDEX IF NOT EXISTS idx_room_applications_applicant ON public.room_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_room_applications_status ON public.room_applications(status);

-- ================================================
-- Updated trigger for recruitment_rooms
-- ================================================
CREATE TRIGGER trg_recruitment_rooms_updated_at BEFORE UPDATE ON public.recruitment_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- Notification types 업데이트
-- ================================================
-- notifications 테이블의 type CHECK 제약을 다시 정의해야 함
-- (기존 제약 삭제 후 새로 생성)
-- 아래 명령어를 수동으로 실행하거나 별도로 처리:

-- ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
-- ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
--   CHECK (type IN ('match_request', 'match_accepted', 'match_rejected', 'room_created', 'room_application', 'room_accepted', 'room_rejected'));

-- ================================================
-- Row Level Security (RLS) 정책
-- ================================================
ALTER TABLE public.recruitment_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_applications ENABLE ROW LEVEL SECURITY;

-- recruitment_rooms RLS
CREATE POLICY "recruitment_rooms_select_active" ON public.recruitment_rooms
  FOR SELECT TO authenticated USING (status = 'active' OR host_id = auth.uid());

CREATE POLICY "recruitment_rooms_insert_own" ON public.recruitment_rooms
  FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());

CREATE POLICY "recruitment_rooms_update_own" ON public.recruitment_rooms
  FOR UPDATE TO authenticated USING (host_id = auth.uid());

CREATE POLICY "recruitment_rooms_delete_own" ON public.recruitment_rooms
  FOR DELETE TO authenticated USING (host_id = auth.uid());

-- room_applications RLS
CREATE POLICY "room_applications_select_own_or_host" ON public.room_applications
  FOR SELECT TO authenticated USING (
    applicant_id = auth.uid() OR
    room_id IN (SELECT id FROM public.recruitment_rooms WHERE host_id = auth.uid())
  );

CREATE POLICY "room_applications_insert_own" ON public.room_applications
  FOR INSERT TO authenticated WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "room_applications_update_host_only" ON public.room_applications
  FOR UPDATE TO authenticated USING (
    room_id IN (SELECT id FROM public.recruitment_rooms WHERE host_id = auth.uid())
  );
