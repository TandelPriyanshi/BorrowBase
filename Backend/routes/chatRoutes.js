// routes/chatRoutes.js
import express from "express";
import { findOrCreateChat } from "../model/chat.js";
import db from "../db/index.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { user1_id, user2_id } = req.body;
    console.log("Incoming chat request:", { user1_id, user2_id });

    if (!user1_id || !user2_id) {
      return res.status(400).json({ error: "Missing user IDs" });
    }

    const chat = await findOrCreateChat(user1_id, user2_id);
    res.json(chat);
  } catch (error) {
    console.error("Chat creation error:", error); 
    res.status(500).json({ error: "Failed to start chat" });
  }
});


router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const chatsRes = await db.query(
      `
      SELECT 
        c.id,
        c.user1_id,
        c.user2_id,
        u1.name AS user1_name,
        u2.name AS user2_name
      FROM chats c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      `,
      [userId]
    );

    res.json(chatsRes.rows);
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/:chatId", async (req, res) => {
  const { chatId } = req.params;

  try {
    const result = await db.query(
      `SELECT * FROM messages WHERE chat_id = $1 ORDER BY sent_at ASC`,
      [chatId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to get messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
