-- Jalankan di SQL Editor database demo setelah schema.sql.
-- Tiket contoh baru dibuat sekali per tanggal operasional database.
BEGIN;
SELECT pg_advisory_xact_lock(20261111);

WITH samples (position, keperluan) AS (
  VALUES
    (1, 'Konsultasi Akademik'),
    (2, 'Surat Aktif Kuliah'),
    (3, 'Legalisir Dokumen'),
    (4, 'Pengajuan Cuti'),
    (5, 'Lainnya'),
    (6, 'Konsultasi Akademik'),
    (7, 'Surat Aktif Kuliah'),
    (8, 'Legalisir Dokumen'),
    (9, 'Pengajuan Cuti'),
    (10, 'Lainnya')
),
identified AS (
  SELECT position, keperluan, LPAD(position::text, 2, '0') AS suffix
  FROM samples
),
missing AS (
  SELECT position, keperluan, 'Mahasiswa Demo ' || suffix AS nama,
         '990000000000000000' || suffix AS nim
  FROM identified
  WHERE NOT EXISTS (
    SELECT 1 FROM public.antrean AS existing
    WHERE existing.service_date = CURRENT_DATE
      AND existing.nim = '990000000000000000' || suffix
  )
),
today AS (
  SELECT COALESCE(MAX(queue_number), 0) AS last_number,
         COUNT(*) FILTER (WHERE status IN ('waiting', 'called')) = 0 AS idle
  FROM public.antrean
  WHERE service_date = CURRENT_DATE
),
service_totals AS (
  SELECT keperluan, MAX(service_number) AS last_number
  FROM public.antrean
  WHERE service_date = CURRENT_DATE
  GROUP BY keperluan
)
INSERT INTO public.antrean (queue_number, service_number, nama, nim, keperluan, status)
SELECT today.last_number + (ROW_NUMBER() OVER (ORDER BY missing.position))::int,
       COALESCE(service_totals.last_number, 0)
         + (ROW_NUMBER() OVER (PARTITION BY missing.keperluan ORDER BY missing.position))::int,
       missing.nama, missing.nim, missing.keperluan,
       CASE WHEN today.idle AND missing.position = 1 THEN 'called' ELSE 'waiting' END
FROM missing
CROSS JOIN today
LEFT JOIN service_totals ON service_totals.keperluan = missing.keperluan
ORDER BY missing.position;

COMMIT;
