-- ================================================
-- 마이그레이션: sports_reservations facility 컬럼
-- 코트별 분리 (futsal_a/b, basketball_a/b, tennis_a~e)
-- 
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- Step 1: 기존 CHECK 제약 삭제 (제약 이름 확인 후 삭제)
ALTER TABLE public.sports_reservations
  DROP CONSTRAINT IF EXISTS sports_reservations_facility_check;

-- Step 2: 기존 데이터 삭제 (futsal/basketball/tennis로 저장된 구형 데이터)
-- 크롤러가 다음 실행 시 새 형식(futsal_a 등)으로 자동 채워줌
DELETE FROM public.sports_reservations
WHERE facility IN ('futsal', 'basketball', 'tennis');

-- Step 3: 새 CHECK 제약 추가 (코트별 분리)
ALTER TABLE public.sports_reservations
  ADD CONSTRAINT sports_reservations_facility_check
  CHECK (facility IN (
    'futsal_a', 'futsal_b',
    'basketball_a', 'basketball_b',
    'tennis_a', 'tennis_b', 'tennis_c', 'tennis_d', 'tennis_e',
    'small_field', 'main_field'
  ));

-- 확인
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.sports_reservations'::regclass
  AND contype = 'c';
