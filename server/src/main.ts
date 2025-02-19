import dotenv from "dotenv";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { pg, pgConnect } from "./config/db.config";
import type { LeaderboardEntry } from "../../types/leaderboard";

// Load environment variables
const dev = process.env.NODE_ENV !== "production";
dotenv.config({
  path: [
    path.resolve(__dirname, `${dev ? "../" : ""}../.env.local`),
    path.resolve(__dirname, `${dev ? "../" : ""}../.env`),
  ],
});

// Init all configs
pgConnect();

async function init() {
  // Express.js initialization
  const app = express();
  const server = createHttpServer(app);
  app.use(express.json());

  // Router

  async function getDailyWord() {
    const { name: word } = await fetch("https://trouve-mot.fr/api/daily").then(
      (res) => res.json()
    );
    return word;
  }

  app.get("/api/daily", async (req, res) => {
    const word = await getDailyWord();
    res.json({ word });
  });

  app.get("/api/leaderboard", async (req, res) => {
    const { rows } = await pg.query<LeaderboardEntry>(
      "SELECT * FROM leaderboard LIMIT 5"
    );
    res.json(rows);
  });

  const vite = await createViteServer();

  if (dev) {
    // Vite.js initialization
    app.use(vite.middlewares);
  } else {
    // Serve static files from the client directory
    app.use(express.static(path.resolve(__dirname, "./client")));
  }

  // Middleware to handle all other routes with Vite
  app.use(async (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
    } else {
      if (dev) {
        vite.middlewares(req, res, next);
      } else {
        res.sendFile(path.resolve(__dirname, "./client/index.html"));
      }
    }
  });

  // Express.js routing
  app.use("/public", express.static(path.join(__dirname, "public")));

  server.listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
}

init();
