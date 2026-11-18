export const servicePrefixes = Object.freeze({
  'Konsultasi Akademik': 'K',
  'Surat Aktif Kuliah': 'S',
  'Legalisir Dokumen': 'L',
  'Pengajuan Cuti': 'C',
  'Lainnya': 'U',
});

export function formatQueueNumber(row) {
  const prefix = servicePrefixes[row.keperluan] || 'U';
  return `${prefix}${String(row.service_number).padStart(3, '0')}`;
}
