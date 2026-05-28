-- ================================================
-- 충북대 매칭 플랫폼 - Supabase 전체 스키마
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- 1. users
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  nickname     TEXT UNIQUE NOT NULL,
  student_id   TEXT NOT NULL,
  avatar_url   TEXT,
  role         TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. contest_profiles
CREATE TABLE IF NOT EXISTS public.contest_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  department      TEXT NOT NULL,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  age             INT CHECK (age BETWEEN 18 AND 40),
  contest_count   INT DEFAULT 0,
  certificates    TEXT[] DEFAULT '{}',
  fields          TEXT[] DEFAULT '{}',
  intro           TEXT,
  is_visible      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. sports_profiles
CREATE TABLE IF NOT EXISTS public.sports_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  age             INT CHECK (age BETWEEN 18 AND 40),
  sports          TEXT[] DEFAULT '{}',
  career_years    INT DEFAULT 0,
  is_pro          BOOLEAN DEFAULT FALSE,
  intro           TEXT,
  is_visible      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. contests (크롤링 데이터)
CREATE TABLE IF NOT EXISTS public.contests (
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
  target          TEXT,
  url             TEXT UNIQUE NOT NULL,
  thumbnail_url   TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  source          TEXT,
  last_crawled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. sports_reservations (크롤링 데이터)
CREATE TABLE IF NOT EXISTS public.sports_reservations (
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

-- 6. matches
CREATE TABLE IF NOT EXISTS public.matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL CHECK (type IN ('contest', 'sports')),
  requester_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  receiver_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  contest_id      UUID REFERENCES public.contests(id) ON DELETE SET NULL,
  reservation_id  UUID REFERENCES public.sports_reservations(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 7. reports
CREATE TABLE IF NOT EXISTS public.reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reported_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reason          TEXT NOT NULL,
  detail          TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 8. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('match_request', 'match_accepted', 'match_rejected')),
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  related_id      UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Indexes
-- ================================================
CREATE INDEX IF NOT EXISTS idx_contests_field ON public.contests(field);
CREATE INDEX IF NOT EXISTS idx_contests_is_active ON public.contests(is_active);
CREATE INDEX IF NOT EXISTS idx_contests_end_date ON public.contests(end_date);
CREATE INDEX IF NOT EXISTS idx_sports_reservations_facility_date ON public.sports_reservations(facility, reservation_date);
CREATE INDEX IF NOT EXISTS idx_matches_requester ON public.matches(requester_id);
CREATE INDEX IF NOT EXISTS idx_matches_receiver ON public.matches(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- ================================================
-- updated_at auto-update trigger
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_contest_profiles_updated_at BEFORE UPDATE ON public.contest_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sports_profiles_updated_at BEFORE UPDATE ON public.sports_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- Auto-disable profile on 3+ reports
-- ================================================
CREATE OR REPLACE FUNCTION check_report_threshold()
RETURNS TRIGGER AS $$
DECLARE
  report_count INT;
BEGIN
  SELECT COUNT(*) INTO report_count
  FROM public.reports
  WHERE reported_id = NEW.reported_id AND status = 'pending';

  IF report_count >= 3 THEN
    UPDATE public.contest_profiles SET is_visible = FALSE
      WHERE user_id = NEW.reported_id;
    UPDATE public.sports_profiles SET is_visible = FALSE
      WHERE user_id = NEW.reported_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_hide_on_reports AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION check_report_threshold();

-- ================================================
-- Row Level Security (RLS)
-- ================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- users RLS
CREATE POLICY "users_select_authenticated" ON public.users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- contest_profiles RLS
CREATE POLICY "contest_profiles_select_visible" ON public.contest_profiles
  FOR SELECT TO authenticated USING (is_visible = true OR user_id = auth.uid());

CREATE POLICY "contest_profiles_insert_own" ON public.contest_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "contest_profiles_update_own" ON public.contest_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "contest_profiles_delete_own" ON public.contest_profiles
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- sports_profiles RLS
CREATE POLICY "sports_profiles_select_visible" ON public.sports_profiles
  FOR SELECT TO authenticated USING (is_visible = true OR user_id = auth.uid());

CREATE POLICY "sports_profiles_insert_own" ON public.sports_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "sports_profiles_update_own" ON public.sports_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "sports_profiles_delete_own" ON public.sports_profiles
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- contests RLS (read-only for users, write only via service_role)
CREATE POLICY "contests_select_authenticated" ON public.contests
  FOR SELECT TO authenticated USING (true);

-- sports_reservations RLS
CREATE POLICY "sports_reservations_select_authenticated" ON public.sports_reservations
  FOR SELECT TO authenticated USING (true);

-- matches RLS
CREATE POLICY "matches_select_own" ON public.matches
  FOR SELECT TO authenticated USING (requester_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "matches_insert_own" ON public.matches
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());

CREATE POLICY "matches_update_own" ON public.matches
  FOR UPDATE TO authenticated USING (requester_id = auth.uid() OR receiver_id = auth.uid());

-- reports RLS
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

-- notifications RLS
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ================================================
-- Storage bucket for avatars
-- ================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_upload_own" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
