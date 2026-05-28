-- ================================================
-- 최종 누락 컬럼 추가 (region)
-- Supabase SQL Editor에서 실행하세요
-- ================================================

ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS region TEXT;
