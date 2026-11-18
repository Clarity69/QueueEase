import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pool from '../src/config/db.js';
import authRoutes, { hashPassword } from '../src/routes/authRoutes.js';
import queueRoutes from '../src/routes/queueRoutes.js';

test('tiket tamu, privasi, pembatasan akses petugas, dan sesi admin', async () => {
  const admin = { id: '1', nama: 'Petugas Tes', username: 'loket.akademik', role: 'admin', password_hash: await hashPassword('password-test') };
  const student = { ...admin, id: '2', username: 'mahasiswa', role: 'student' };
  const sessions = new Map();
  const tickets = [{
    id: '1', queue_number: 1, service_number: 1, keperluan: 'Konsultasi Akademik',
    nama: 'Mahasiswa Lain', nim: '22222222', unique_code: '2f37a5a2-f700-4d57-a880-30424385acb1', status: 'waiting',
  }];
  const originalQuery = pool.query;
  const originalConnect = pool.connect;
  pool.query = async (sql, args) => {
    if (sql.includes('FROM app_users WHERE username') && sql.includes("role = 'admin'")) {
      return { rows: args[0] === admin.username ? [admin] : [] };
    }
    if (sql.startsWith('INSERT INTO user_sessions')) { sessions.set(args[0], admin); return { rows: [] }; }
    if (sql.includes('JOIN user_sessions')) {
      const account = sessions.get(args[0]);
      const { password_hash, ...user } = account || {};
      return { rows: account ? [user] : [] };
    }
    if (sql.startsWith('DELETE FROM user_sessions')) { sessions.delete(args[0]); return { rows: [] }; }
    if (sql.includes("SET status = 'done'")) {
      const ticket = tickets.find(ticket => ticket.id === String(args[0]));
      ticket.status = 'done';
      return { rowCount: 1, rows: [ticket] };
    }
    if (sql.includes('COUNT(*)')) return { rows: [{ total: tickets.length }] };
    if (sql.includes('FROM antrean')) return { rows: tickets };
    throw new Error('Unexpected query: ' + sql);
  };
  pool.connect = async () => ({
    release() {},
    async query(sql, args) {
      const query = sql.trim();
      if (['BEGIN', 'COMMIT', 'ROLLBACK', 'SELECT pg_advisory_xact_lock(20261111)'].includes(query)) return {};
      if (query.startsWith('SELECT id') && query.includes('nim = $1')) {
        const rows = tickets.filter(ticket => ticket.status !== 'done' && (ticket.nim === args[0] || ticket.unique_code === args[1]));
        return { rowCount: rows.length, rows };
      }
      if (query.includes('MAX(queue_number)')) return { rows: [{ next_number: tickets.length + 1 }] };
      if (query.includes('MAX(service_number)')) {
        return { rows: [{ next_number: tickets.filter(ticket => ticket.keperluan === args[0]).length + 1 }] };
      }
      if (query.startsWith('INSERT INTO antrean')) {
        const [queue_number, nama, keperluan, nim, service_number] = args;
        const ticket = {
          id: String(queue_number), queue_number, service_number, nama, keperluan, nim,
          unique_code: '772435b6-9480-43d2-aca9-8e491d448975', status: 'waiting',
        };
        tickets.push(ticket);
        return { rows: [ticket] };
      }
      if (query.includes("SET status = 'done'")) {
        for (const ticket of tickets) if (ticket.status === 'called') ticket.status = 'done';
        return {};
      }
      if (query.includes('LIMIT 1 FOR UPDATE')) {
        const next = tickets.find(ticket => ticket.status === 'waiting');
        return { rowCount: next ? 1 : 0, rows: next ? [next] : [] };
      }
      if (query.includes("SET status = 'called'")) {
        const ticket = tickets.find(ticket => ticket.id === args[0]);
        ticket.status = 'called';
        return { rows: [ticket] };
      }
      throw new Error('Unexpected transaction query: ' + sql);
    },
  });
  // Jalankan handler Express langsung agar tes tidak membutuhkan port jaringan.
  let ip = 0;
  const fetch = async (url, options = {}) => {
    const router = url.startsWith('/auth') ? authRoutes : queueRoutes;
    const path = url.replace(/^\/(auth|queue)/, '') || '/';
    const req = { method: options.method || 'GET', path, url: path, ip: String(++ip), headers: { cookie: options.headers?.Cookie }, body: options.body ? JSON.parse(options.body) : {}, params: {} };
    return new Promise((resolve, reject) => {
      let status = 200;
      let cookie = null;
      const headers = new Map();
      const res = {
        status(code) { status = code; return this; },
        set(name, value) { headers.set(name.toLowerCase(), value); return this; },
        cookie(name, value, options) {
          cookie = `${name}=${value}${options.httpOnly ? '; HttpOnly' : ''}; SameSite=${options.sameSite}; Path=${options.path}`;
          return this;
        },
        clearCookie() { return this; },
        json(data) { resolve({ status, json: async () => data, headers: { get: name => name === "set-cookie" ? cookie : headers.get(name.toLowerCase()) } }); },
      };
      const handlers = router.stack.filter(layer => !layer.route).map(layer => layer.handle);
      const route = router.stack.find(layer => layer.route && layer.route.methods[req.method.toLowerCase()] && (layer.route.path === path || (layer.route.path === '/:id/done' && /^\/\d+\/done$/.test(path))));
      if (!route) return resolve({ status: 404 });
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
  const post = (url, body, headers) => fetch(url, { method: 'POST', body: JSON.stringify(body), headers });
  const patch = (url, headers) => fetch(url, { method: 'PATCH', headers });
  const ticketData = { nama: 'Mahasiswa Tes', nim: '00000123', keperluan: 'Surat Aktif Kuliah' };
  try {
    const publicList = await fetch('/queue');
    assert.equal(publicList.status, 200);
    assert.equal(publicList.headers.get('cache-control'), 'no-store');
    assert.deepEqual((await publicList.json())[0], {
      id: '1', ticket: 'K001', queue_number: 1, keperluan: 'Konsultasi Akademik', status: 'waiting',
    });
    for (const path of ['/queue/admin', '/queue/stats']) assert.equal((await fetch(path)).status, 401);
    for (const path of ['/queue/call-next', '/queue/1/done']) assert.equal((await patch(path)).status, 401);

    assert.equal((await post('/queue', { ...ticketData, nim: 'bad' })).status, 400);
    assert.equal((await post('/queue', { ...ticketData, keperluan: 'invalid' })).status, 400);
    const created = await post('/queue', ticketData);
    assert.equal(created.status, 201);
    const ticket = await created.json();
    assert.equal(ticket.ticket, 'S001');
    assert.equal(ticket.nim, '00000123');
    const guestCookie = created.headers.get('set-cookie');
    assert.match(guestCookie, /^queueease_ticket=/);
    assert.match(guestCookie, /HttpOnly/i);
    assert.match(guestCookie, /SameSite=Strict/i);
    const guest = { Cookie: guestCookie.split(';')[0] };
    assert.equal((await post('/queue', ticketData)).status, 409);
    assert.equal((await post('/queue', { ...ticketData, nim: '22233344' }, guest)).status, 409);
    const own = await (await fetch('/queue', { headers: guest })).json();
    assert.equal(own[0].unique_code, undefined);
    assert.equal(own[1].unique_code, ticket.unique_code);
    assert.equal(own[1].is_mine, true);
    for (const headers of [{}, { Cookie: 'queueease_ticket=invalid' }]) {
      const rows = await (await fetch('/queue', { headers })).json();
      assert.equal(rows[1].nim, undefined);
      assert.equal(rows[1].unique_code, undefined);
      assert.equal(rows[1].is_mine, undefined);
    }

    assert.equal((await post('/auth/register', ticketData)).status, 404);
    assert.equal((await post('/auth/login', { username: student.username, password: 'password-test' })).status, 401);
    assert.equal((await post('/auth/login', { username: admin.username, password: 'wrong' })).status, 401);
    const legacyToken = 'legacy-student-token';
    sessions.set(createHash('sha256').update(legacyToken).digest('hex'), student);
    const legacyHeaders = { Cookie: 'queueease_session=' + legacyToken };
    assert.equal((await fetch('/auth/me', { headers: legacyHeaders })).status, 403);
    assert.equal((await fetch('/queue/admin', { headers: legacyHeaders })).status, 403);
    assert.equal((await patch('/queue/call-next', legacyHeaders)).status, 403);

    assert.equal((await post('/auth/login', { nim: admin.username, password: 'password-test' })).status, 401);
    const login = await post('/auth/login', { username: ' LOKET.AKADEMIK ', password: 'password-test' });
    assert.equal(login.status, 200);
    assert.deepEqual(await login.json(), {
      id: admin.id, nama: admin.nama, username: admin.username, role: 'admin',
    });
    const cookieHeader = login.headers.get('set-cookie');
    assert.match(cookieHeader, /HttpOnly/i);
    assert.match(cookieHeader, /SameSite=Strict/i);
    const cookie = cookieHeader.split(';')[0];
    const token = cookie.slice(cookie.indexOf('=') + 1);
    assert.ok(sessions.has(createHash('sha256').update(token).digest('hex')));
    const headers = { Cookie: cookie };
    assert.equal((await fetch('/auth/me', { headers })).status, 200);
    assert.equal((await fetch('/queue/stats', { headers })).status, 200);
    const adminList = await (await fetch('/queue/admin', { headers })).json();
    assert.equal(adminList[1].nim, ticketData.nim);
    assert.equal((await patch('/queue/call-next', headers)).status, 200);
    assert.equal((await patch('/queue/2/done', headers)).status, 200);
    assert.equal((await (await fetch('/queue', { headers: guest })).json())[1].status, 'done');
    assert.equal((await post('/auth/logout', {}, headers)).status, 200);
    assert.equal((await fetch('/auth/me', { headers })).status, 401);
    assert.equal((await fetch('/queue/admin', { headers })).status, 401);
  } finally {
    pool.query = originalQuery;
    pool.connect = originalConnect;
    await pool.end();
  }
});
