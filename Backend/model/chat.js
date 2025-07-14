// model/chat.js
import pool from "../db/index.js";

export async function findOrCreateChat(user1_id, user2_id) {
  const existing = await pool.query(
    `SELECT * FROM chats WHERE 
     (user1_id = $1 AND user2_id = $2) OR 
     (user1_id = $2 AND user2_id = $1)`,
    [user1_id, user2_id]
  );

  if (existing.rows.length > 0) return existing.rows[0];

  const res = await pool.query(
    "INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING *",
    [user1_id, user2_id]
  );

  return res.rows[0];
}
