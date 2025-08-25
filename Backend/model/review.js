import pool from "../db/index.js";

export async function createReview(rating, review_text, tags, reviewer_id, reviewee_id) {
  const res = await pool.query(
    `INSERT INTO reviews (rating, review_text, tags, reviewer_id, reviewee_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [rating, review_text, tags, reviewer_id, reviewee_id]
  );
  return res.rows[0];
}

export async function getReviewsForUser(user_id) {
  const res = await pool.query(
    'SELECT * FROM reviews WHERE reviewee_id = $1 ORDER BY created_at DESC',
    [user_id]
  );
  return res.rows;
}

export async function getAverageRatingForUser(user_id) {
    const res = await pool.query(
      'SELECT AVG(rating) as average_rating, COUNT(rating) as review_count FROM reviews WHERE reviewee_id = $1',
      [user_id]
    );
    return res.rows[0];
  }
