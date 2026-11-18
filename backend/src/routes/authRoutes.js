import { Router } from "express";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import pool from "../config/db.js";
import { requireAuth, requireAdmin, sessionHash } from "../middleware/auth.js";
const scrypt = promisify(scryptCallback);
const router = Router();
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await scrypt(password, salt, 64)).toString("hex")}`;
}
const cookieOptions = { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 86400000 };
const attempts = new Map();
router.use((req, res, next) => {
  if (req.method !== "POST" || req.path !== "/login") return next();
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const key = req.ip;
  const entry = attempts.get(key) || { count: 0, until: now + 900000 };
  entry.count++;
  attempts.set(key, entry);
  if (entry.count > 30) return res.status(429).json({ message: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." });
  next();
});
async function startSession(user, res) {
  const token = randomBytes(32).toString("hex");
  await pool.query("INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 day')", [createHash("sha256").update(token).digest("hex"), user.id]);
  res.cookie("queueease_session", token, cookieOptions);
  res.set("Cache-Control", "no-store");
  res.json({ id: user.id, nama: user.nama, username: user.username, role: user.role });
}
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (typeof password !== "string" || password.length > 128) return res.status(400).json({ message: "Kata sandi tidak valid." });
    const { rows } = await pool.query("SELECT id, nama, username, role, password_hash FROM app_users WHERE username = $1 AND role = 'admin'", [typeof username === "string" ? username.trim().toLowerCase() : ""]);
    const user = rows[0];
    const [salt, hash] = (user?.password_hash || `${"0".repeat(32)}:${"0".repeat(128)}`).split(":");
    const actual = await scrypt(password, salt, 64);
    if (!timingSafeEqual(actual, Buffer.from(hash, "hex")) || user?.role !== "admin") return res.status(401).json({ message: "Username atau kata sandi salah." });
    await startSession(user, res);
  } catch (error) { next(error); }
});
router.get("/me", requireAuth, requireAdmin, (req, res) => res.json(req.user));
router.post("/logout", async (req, res, next) => {
  try {
    const hash = sessionHash(req);
    if (hash) await pool.query("DELETE FROM user_sessions WHERE token_hash = $1", [hash]);
    res.clearCookie("queueease_session", { httpOnly: true, sameSite: "strict", secure: cookieOptions.secure, path: "/" }).json({ message: "Berhasil keluar." });
  } catch (error) { next(error); }
});
export default router;
