-- Jalankan satu kali di SQL Editor Supabase untuk instalasi yang sudah ada.
-- queue_number tetap menjadi urutan kedatangan untuk pemanggilan satu loket.
BEGIN;
LOCK TABLE public.antrean IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.antrean ADD COLUMN IF NOT EXISTS service_number INTEGER;
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY service_date, keperluan ORDER BY queue_number, id
  )::integer AS number
  FROM public.antrean
)
UPDATE public.antrean a SET service_number = n.number
FROM numbered n WHERE a.id = n.id AND a.service_number IS NULL;
ALTER TABLE public.antrean ALTER COLUMN service_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_antrean_service_number
  ON public.antrean (service_date, keperluan, service_number);
COMMIT;
