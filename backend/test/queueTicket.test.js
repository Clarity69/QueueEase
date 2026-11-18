import test from 'node:test';
import assert from 'node:assert/strict';
import { formatQueueNumber } from '../src/utils/queueTicket.js';
test('kode layanan memiliki awalan berbeda walaupun nomor layanan sama', () => {
  for (const [keperluan, expected] of [
    ['Konsultasi Akademik', 'K001'], ['Surat Aktif Kuliah', 'S001'],
    ['Legalisir Dokumen', 'L001'], ['Pengajuan Cuti', 'C001'], ['Lainnya', 'U001'],
  ]) assert.equal(formatQueueNumber({ keperluan, service_number: 1, queue_number: 99 }), expected);
});
test('nomor layanan mendukung urutan selanjutnya dan lebih dari 999', () => {
  assert.equal(formatQueueNumber({ keperluan: 'Konsultasi Akademik', service_number: 2 }), 'K002');
  assert.equal(formatQueueNumber({ keperluan: 'Surat Aktif Kuliah', service_number: 1000 }), 'S1000');
});
