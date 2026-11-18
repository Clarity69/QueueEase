import { createHash } from "node:crypto";
import pool from "../config/db.js";
export function sessionHash(req) {
  const token = (req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith("queueease_session="))?.slice(18);
  return token ? createHash("sha256").update(token).digest("hex") : null;
}
export async function requireAuth(req, res, next) {
  try {
    const hash = sessionHash(req);
    if (!hash) return res.status(401).json({ message: "Silakan masuk terlebih dahulu." });
    const { rows } = await pool.query("SELECT u.id, u.nama, u.nim, u.role FROM app_users u JOIN user_sessions s ON s.user_id = u.id WHERE s.token_hash = $1 AND s.expires_at > NOW()", [hash]);
    if (!rows[0]) return res.status(401).json({ message: "Sesi berakhir. Silakan masuk kembali." });
    req.user = rows[0]; next();
  } catch (error) { next(error); }
}
export function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Akses hanya untuk petugas." });
  next();
}
