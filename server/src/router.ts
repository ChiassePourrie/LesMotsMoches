// Router

import { Router } from "express";
import type { LeaderboardEntry } from "../../types/leaderboard";
import type { Vote } from "../../types/votes";
import { pg } from "./config/db.config";

async function updateDailyWord() {
  // run pg function update_word_of_the_day
  await pg.query("SELECT insert_word_of_the_day()");
}

async function getDailyWord() {
  const today = new Date().toISOString().split("T")[0];
  const result = await pg.query(
    "SELECT * FROM word_of_the_day WHERE selected_date = $1",
    [today]
  );
  if (result.rowCount === 0) return null;
  return result.rows[0].word;
}

const router = Router();

router.get("/api/daily", async (req, res) => {
  const word = await getDailyWord();
  res.json({ word });
});

router.get("/api/leaderboard", async (req, res) => {
  const { rows } = await pg.query<LeaderboardEntry>(
    "SELECT * FROM leaderboard ORDER BY total_votes DESC LIMIT 5"
  );
  res.json(rows);
});

router.post("/api/save", async (req, res) => {
  const { id, category, vote } = req.body as Partial<Vote>;
  const word = await getDailyWord();
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
  if (!(process.env.CRON_HEADER && process.env.CRON_VALUE)) {
    res.status(500).json({ error: "Cron not configured" });
    return;
  }
  if (req.headers[process.env.CRON_HEADER] !== process.env.CRON_VALUE) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await updateDailyWord();
  res.json({ message: "Daily word updated" });
});

export default router;
