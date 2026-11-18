import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pool from '../src/config/db.js';
import authRoutes, { hashPassword } from '../src/routes/authRoutes.js';
import queueRoutes from '../src/routes/queueRoutes.js';

test('login, sesi, pembatasan petugas, privasi tiket, dan logout', async () => {
  const user = { id: '1', nama: 'Mahasiswa Tes', nim: '12345678', role: 'student', password_hash: await hashPassword('password-test') };
  const sessions = new Set();
  const original = pool.query;
  pool.query = async (sql, args) => {
    if (sql.startsWith('SELECT * FROM app_users')) return { rows: args[0] === user.nim ? [user] : [] };
    if (sql.startsWith('INSERT INTO user_sessions')) { sessions.add(args[0]); return { rows: [] }; }
    if (sql.includes('JOIN user_sessions')) return { rows: sessions.has(args[0]) ? [{ id: user.id, nama: user.nama, nim: user.nim, role: user.role }] : [] };
    if (sql.startsWith('DELETE FROM user_sessions')) { sessions.delete(args[0]); return { rows: [] }; }
    if (sql.includes('FROM antrean')) return { rows: [
      { id: '1', queue_number: 1, service_number: 1, keperluan: 'Konsultasi Akademik', nama: user.nama, nim: user.nim, unique_code: 'own-code', user_id: '1', status: 'waiting' },
      { id: '2', queue_number: 2, service_number: 1, keperluan: 'Surat Aktif Kuliah', nama: 'Rahasia', nim: '87654321', unique_code: 'secret-code', user_id: '2', status: 'waiting' },
    ] };
    throw new Error('Unexpected query');
  };
  // Jalankan handler Express langsung agar tes tidak membutuhkan port jaringan.
  const base = '';
  let ip = 0;
  const fetch = async (url, options = {}) => {
    const router = url.startsWith('/auth') ? authRoutes : queueRoutes;
    const path = url.replace(/^\/(auth|queue)/, '') || '/';
    const req = { method: options.method || 'GET', path, url: path, ip: String(++ip), headers: { cookie: options.headers?.Cookie }, body: options.body ? JSON.parse(options.body) : {}, params: {} };
    return new Promise((resolve, reject) => {
      let status = 200;
      let cookie = null;
      const res = {
        status(code) { status = code; return this; },
        cookie(name, value) { cookie = `${name}=${value}; HttpOnly; SameSite=Strict`; return this; },
        clearCookie() { return this; },
        json(data) { resolve({ status, json: async () => data, headers: { get: () => cookie } }); },
      };
      const handlers = router.stack.filter(layer => !layer.route).map(layer => layer.handle);
      const route = router.stack.find(layer => layer.route && layer.route.methods[req.method.toLowerCase()] && (layer.route.path === path || (layer.route.path === '/:id/done' && /^\/\d+\/done$/.test(path))));
      if (!route) return reject(new Error('Route missing: ' + path));
      if (path.endsWith('/done')) req.params.id = path.split('/')[1];
      handlers.push(...route.route.stack.map(layer => layer.handle));
      const next = error => {
        if (error) return reject(error);
        const handler = handlers.shift();
        if (handler) Promise.resolve(handler(req, res, next)).catch(reject);
      };
      next();
    });
  };
  try {
    assert.equal((await fetch(`${base}/queue`)).status, 401);
    const invalid = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nim: user.nim, password: 'wrong' }) });
    assert.equal(invalid.status, 401);
    const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nim: user.nim, password: 'password-test' }) });
    assert.equal(login.status, 200);
    assert.equal((await login.json()).password_hash, undefined);
    const cookieHeader = login.headers.get('set-cookie');
    assert.match(cookieHeader, /HttpOnly/i); assert.match(cookieHeader, /SameSite=Strict/i);
    const cookie = cookieHeader.split(';')[0];
    const token = cookie.slice(cookie.indexOf('=') + 1);
    assert.ok(sessions.has(createHash('sha256').update(token).digest('hex')));
    const headers = { Cookie: cookie };
    assert.equal((await fetch(`${base}/auth/me`, { headers })).status, 200);
    assert.equal((await fetch(`${base}/queue/call-next`, { method: 'PATCH', headers })).status, 403);
    assert.equal((await fetch(`${base}/queue/1/done`, { method: 'PATCH', headers })).status, 403);
    const tickets = await (await fetch(`${base}/queue`, { headers })).json();
    assert.equal(tickets[0].ticket, 'K001'); assert.equal(tickets[0].unique_code, 'own-code');
    assert.equal(tickets[1].ticket, 'S001'); assert.equal(tickets[1].nama, undefined); assert.equal(tickets[1].nim, undefined); assert.equal(tickets[1].unique_code, undefined);
    assert.equal((await fetch(`${base}/auth/logout`, { method: 'POST', headers })).status, 200);
    assert.equal((await fetch(`${base}/auth/me`, { headers })).status, 401);
    assert.equal((await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: 'Tes', nim: 'bad', password: 'short' }) })).status, 400);
  } finally {
    pool.query = original; await pool.end();
  }
});
