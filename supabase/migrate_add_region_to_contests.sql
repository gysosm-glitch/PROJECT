-- ================================================
-- 마이그레이션: contests 테이블에 region 컬럼 추가
--
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- Step 1: region 컬럼 추가
ALTER TABLE public.contests
ADD COLUMN region TEXT DEFAULT '충청북도' CHECK (region IN (
  '충청북도',
  '충청남도',
  '세종특별자치시',
  '대전광역시'
));

-- Step 2: 인덱스 추가 (region 필터링 성능 향상)
CREATE INDEX IF NOT EXISTS contests_region_idx ON public.contests(region);
CREATE INDEX IF NOT EXISTS contests_is_active_region_idx ON public.contests(is_active, region);

-- 확인: 컬럼 추가 여부 확인
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'contests' AND column_name = 'region';
