import pool from "./config/db.js";

const hints = {
  EAI_AGAIN: "DNS gagal sementara. Periksa koneksi internet dan DNS, lalu coba lagi.",
  ENOTFOUND: "Host database tidak ditemukan. Salin ulang URI dari Supabase > Connect.",
  ENETUNREACH: "Jaringan database tidak terjangkau. Coba Session pooler dari Supabase > Connect.",
  ECONNREFUSED: "Koneksi ditolak. Periksa host, port, dan status project Supabase.",
  ETIMEDOUT: "Koneksi timeout. Periksa jaringan, firewall, dan status project Supabase.",
  "28P01": "Autentikasi gagal. Periksa password database dan username pada URI.",
  "3D000": "Nama database tidak ditemukan. Salin ulang URI dari Supabase > Connect.",
};

try {
  await pool.query("SELECT 1");
  console.log("OK: API dapat terhubung ke PostgreSQL.");
} catch (error) {
  const code = error.code || "UNKNOWN";
  console.error(`Koneksi database gagal (${code}).`);
  let message = String(error.message || "");
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    message = message.replaceAll(connectionString, "[DATABASE_URL]");
    try {
      const uri = new URL(connectionString);
      for (const value of [uri.password, uri.username]) {
        if (!value) continue;
        message = message.replaceAll(value, "[REDACTED]");
        try {
          message = message.replaceAll(decodeURIComponent(value), "[REDACTED]");
        } catch {}
      }
    } catch {}
  }
  message = message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[DATABASE_URL]");
  if (message) console.error("Detail:", message);
  console.error(hints[code] || "Periksa URI, password database, SSL, jaringan, dan status project Supabase.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
