// Backend/model/message.js
import pool from "../db/index.js";

export async function createMessage(chat_id, sender_id, text) {
  const res = await pool.query(
    "INSERT INTO messages (chat_id, sender_id, text) VALUES ($1, $2, $3) RETURNING *",
    [chat_id, sender_id, text]
  );
  return res.rows[0];
}

export async function getMessages(chat_id) {
  const res = await pool.query(
    "SELECT * FROM messages WHERE chat_id = $1 ORDER BY sent_at ASC",
    [chat_id]
  );
  return res.rows;
}
