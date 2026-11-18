import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import queueRoutes from "./routes/queueRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use((req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.headers.origin && req.headers.origin !== frontendOrigin) return res.status(403).json({ message: "Origin tidak diizinkan." });
  next();
});
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", message: "QueueEase API dan PostgreSQL terhubung." });
  } catch (error) {
    console.error("Koneksi database gagal. Kode:", error.code || "UNKNOWN");
    res.status(500).json({ status: "error", message: "Database tidak dapat diakses." });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/queue", queueRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Terjadi kesalahan pada server." });
});

app.listen(PORT, () => {
  console.log(`QueueEase API berjalan di http://localhost:${PORT}`);
});
