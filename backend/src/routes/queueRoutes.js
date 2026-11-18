import { Router } from "express";
import { requireAuth, requireAdmin, readCookie } from "../middleware/auth.js";
import { formatQueueNumber, servicePrefixes } from "../utils/queueTicket.js";
import pool from "../config/db.js";

const router = Router();


const today = `CURRENT_DATE`;

function serialize(row) {
  return {
    ...row,
    ticket: formatQueueNumber(row),
  };
}

const ticketCookie = "queueease_ticket";

function guestTicket(req) {
  const token = readCookie(req, ticketCookie);
  return /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(token || "") ? token.toLowerCase() : null;
}

async function listQueue(req, res) {
  try {
    const result = await pool.query(`
      SELECT id, queue_number, service_number, nama, nim, unique_code, keperluan, status, created_at, service_date
      FROM antrean
      WHERE service_date = ${today}
      ORDER BY queue_number ASC
    `);
    const token = guestTicket(req);
    res.set("Cache-Control", "no-store");
    res.json(result.rows.map(row => {
      if (req.user?.role === "admin") return serialize(row);
      if (row.unique_code === token && token) return { ...serialize(row), is_mine: true };
      return { id: row.id, ticket: formatQueueNumber(row), queue_number: row.queue_number, keperluan: row.keperluan, status: row.status };
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data antrean." });
  }
}

router.get("/", listQueue);
router.get("/admin", requireAuth, requireAdmin, listQueue);

// GET /api/queue/stats – statistik antrean hari ini
router.get("/stats", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'waiting')::int AS waiting,
        COUNT(*) FILTER (WHERE status = 'called')::int AS called,
        COUNT(*) FILTER (WHERE status = 'done')::int AS done
      FROM antrean
      WHERE service_date = ${today}
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil statistik." });
  }
});

// POST /api/queue – mahasiswa mengambil nomor antrean
router.post("/", async (req, res) => {
  const { nama: rawName, nim: rawNim, keperluan: rawService } = req.body || {};
  const nama = typeof rawName === "string" ? rawName.trim() : "";
  const nim = typeof rawNim === "string" ? rawNim.trim() : "";
  const keperluan = typeof rawService === "string" ? rawService.trim() : "";

  if (!nama || nama.length > 100 || !/^[0-9]{5,20}$/.test(nim)) {
    return res.status(400).json({ message: "Isi nama maksimal 100 karakter dan NIM 5–20 digit." });
  }

  if (!Object.hasOwn(servicePrefixes, keperluan)) {
    return res.status(400).json({ message: "Pilih keperluan yang tersedia." });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    // Advisory lock mencegah dua permintaan bersamaan memperoleh nomor yang sama.
    await client.query("SELECT pg_advisory_xact_lock(20261111)");
    const active = await client.query(
      `SELECT id FROM antrean
       WHERE service_date = CURRENT_DATE AND status IN ('waiting', 'called')
         AND (nim = $1 OR unique_code = $2::uuid)`,
      [nim, guestTicket(req)]
    );
    if (active.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Anda masih memiliki antrean aktif hari ini." });
    }
    const next = await client.query(`
      SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_number
      FROM antrean WHERE service_date = CURRENT_DATE
    `);
    const serviceNext = await client.query(
      `SELECT COALESCE(MAX(service_number), 0) + 1 AS next_number
       FROM antrean WHERE service_date = CURRENT_DATE AND keperluan = $1`,
      [keperluan]
    );
    const inserted = await client.query(
      `INSERT INTO antrean (queue_number, nama, keperluan, nim, service_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [next.rows[0].next_number, nama, keperluan, nim, serviceNext.rows[0].next_number]
    );
    await client.query("COMMIT");
    const ticket = inserted.rows[0];
    res.cookie(ticketCookie, ticket.unique_code, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/api/queue",
      maxAge: 86400000,
    });
    res.set("Cache-Control", "no-store");
    res.status(201).json({ ...serialize(ticket), is_mine: true });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Gagal membuat nomor antrean." });
  } finally {
    client?.release();
  }
});

// PATCH /api/queue/call-next – panggil antrean menunggu paling awal
router.patch("/call-next", requireAuth, requireAdmin, async (_req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(20261111)");
    // Untuk simulasi satu loket: panggilan sebelumnya otomatis dianggap selesai.
    await client.query(
      `UPDATE antrean SET status = 'done'
       WHERE service_date = CURRENT_DATE AND status = 'called'`
    );
    const next = await client.query(
      `SELECT id FROM antrean
       WHERE service_date = CURRENT_DATE AND status = 'waiting'
       ORDER BY queue_number ASC
       LIMIT 1 FOR UPDATE`
    );

    if (next.rowCount === 0) {
      await client.query("COMMIT");
      return res.status(404).json({ message: "Tidak ada antrean yang menunggu." });
    }

    const updated = await client.query(
      `UPDATE antrean SET status = 'called'
       WHERE id = $1
       RETURNING *`,
      [next.rows[0].id]
    );
    await client.query("COMMIT");
    res.json(serialize(updated.rows[0]));
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Gagal memanggil antrean." });
  } finally {
    client?.release();
  }
});

// PATCH /api/queue/:id/done – tandai antrean selesai
router.patch("/:id/done", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "ID antrean tidak valid." });
  }

  try {
    const result = await pool.query(
      `UPDATE antrean SET status = 'done'
       WHERE id = $1 AND service_date = CURRENT_DATE
       RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Antrean tidak ditemukan." });
    }
    res.json(serialize(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menyelesaikan antrean." });
  }
});

export default router;
