import { text } from "node:stream/consumers";
import pool from "./config/db.js";
import { hashPassword } from "./routes/authRoutes.js";

try {
  const [rawName = "", rawUsername = ""] = process.argv.slice(2);
  const nama = rawName.trim();
  const username = rawUsername.trim().toLowerCase();
  if (!nama || nama.length > 100 || !/^[a-z0-9._-]{3,32}$/.test(username) || process.stdin.isTTY) {
    throw new Error("Gunakan npm run admin:create -- \"Nama Petugas\" USERNAME dengan kata sandi melalui stdin.");
  }

  const password = (await text(process.stdin)).replace(/\r?\n$/, "");
  if (password.length < 8 || password.length > 128) {
    throw new Error("Kata sandi harus berisi 8–128 karakter.");
  }

  const result = await pool.query(
    `INSERT INTO app_users (nama, username, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (username) DO NOTHING
     RETURNING id`,
    [nama, username, await hashPassword(password)]
  );
  if (!result.rowCount) throw new Error("Username sudah dipakai oleh akun yang ada.");
  console.log("Akun petugas berhasil dibuat.");
} catch (error) {
  console.error(error.code ? `Gagal membuat akun petugas. Kode: ${error.code}` : error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
