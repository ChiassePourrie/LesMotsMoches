// Router

import { Router } from "express";
import type { LeaderboardEntry } from "../../types/leaderboard";
import type { Vote } from "../../types/votes";
import { pg } from "./config/db.config";

let dailyWord: string | null = null;

async function getDailyWord() {
  const { name: word } = await fetch("https://trouve-mot.fr/api/daily").then(
    (res) => res.json()
  );
  dailyWord = word;
  return word;
}

const router = Router();

router.get("/api/daily", async (req, res) => {
  const word = await getDailyWord();
  res.json({ word });
});

router.get("/api/leaderboard", async (req, res) => {
  const { rows } = await pg.query<LeaderboardEntry>(
    "SELECT * FROM leaderboard LIMIT 5"
  );
  res.json(rows);
});

router.post("/api/save", async (req, res) => {
  const { id, category, vote } = req.body as Partial<Vote>;
  const word = dailyWord;
  if (
    typeof vote !== "number" ||
    !Number.isInteger(vote) ||
    vote < -2 ||
    vote > 2 ||
    vote === 0
  ) {
    res.status(400).json({ error: "Eh oh hein" });
    return;
  }
  if (!id) {
    const result = await pg.query(
      "INSERT INTO votes (word, category, vote) VALUES ($1, $2, $3) RETURNING id",
      [word, category, vote]
    );
    res.json({ id: result.rows[0].id });
  } else {
    await pg.query(
      `INSERT INTO votes (id, word, category, vote) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id, word, category) DO UPDATE SET vote = $4`,
      [id, word, category, vote]
    );
    res.json({ id });
  }
});

router.post("/cron", async (req, res) => {
  console.log("\x1b[44m%s\x1b[0m", "server/src/router.ts:63 req", req);
  // 200
  res.status(200).send("OK");
});

export default router;
