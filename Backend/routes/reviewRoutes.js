// routes/reviewRoutes.js
import express from "express";
import db from "../db/index.js";

const router = express.Router();

// ✅ Submit a review
router.post("/", async (req, res) => {
  const reviewerId = req.user?.id;
  const { user_id, message, stars } = req.body;

  if (!reviewerId || !user_id || !message || !stars) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (user_id === reviewerId) {
    return res.status(400).json({ error: "Cannot review yourself" });
  }

  try {
    // Insert review
    await db.query(
      `INSERT INTO reviews (user_id, reviewer_id, message, stars, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [user_id, reviewerId, message, stars]
    );

    // Recalculate average rating
    const avgResult = await db.query(
      `SELECT AVG(stars) AS avg_rating FROM reviews WHERE user_id = $1`,
      [user_id]
    );

    const avgRating = parseFloat(avgResult.rows[0].avg_rating).toFixed(2);

    // Update user table
    await db.query(
      `UPDATE users SET rating = $1 WHERE id = $2`,
      [avgRating, user_id]
    );

    res.status(201).json({ message: "Review submitted", avg_rating: avgRating });
  } catch (err) {
    console.error("Submit review failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get all reviews for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const reviews = await db.query(
      `
      SELECT r.*, u.name AS reviewer_name, u.profile_pic_url
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      `,
      [userId]
    );

    res.json(reviews.rows);
  } catch (err) {
    console.error("Fetch reviews failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;