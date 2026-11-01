import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { createApiApp } from "./src/serverApp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = createApiApp();

  // In development, hook up Vite middleware
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production standalone mode, serve built frontend
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LUMEN SERVER] Running on http://localhost:${PORT}`);
  });
}

// Only auto-start when running standalone (not in Vercel serverless context)
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("[LUMEN SERVER] Fatal startup failure:", err);
    process.exit(1);
  });
}

export { createApiApp };
