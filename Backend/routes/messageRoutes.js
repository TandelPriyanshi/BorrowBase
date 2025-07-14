// Backend/routes/messageRoutes.js
import express from "express";
import { createMessage, getMessages } from "../model/message.js";
import db from "../db/index.js";

const router = express.Router();

// Get all messages for a specific chat
router.get("/:chatId", async (req, res) => {
  try {
    const messages = await getMessages(req.params.chatId);
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Send a new message
router.post("/", async (req, res) => {
  try {
    console.log("Incoming message POST request:", req.body);

    const { chat_id, sender_id, content } = req.body;

    const chatResult = await db.query("SELECT * FROM chats WHERE id = $1", [chat_id]);
    const chat = chatResult.rows[0];
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const receiver_id = chat.user1_id === sender_id ? chat.user2_id : chat.user1_id;
    const result = await db.query(
      `INSERT INTO messages (chat_id, sender_id, receiver_id, message, sent_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [chat_id, sender_id, receiver_id, content]
    );

    console.log("Message saved to DB:", result.rows[0]);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("Failed to save message:", err);
    res.status(500).json({ error: "Server error saving message" });
  }
});

export default router;
