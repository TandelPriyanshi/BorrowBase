// routes/notificationRoutes.js
import express from "express";
import db from "../db/index.js";

const router = express.Router();

// ✅ Get all notifications for current user
router.get("/", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Mark a notification as read
router.post("/read/:id", async (req, res) => {
  const userId = req.user?.id;
  const notificationId = req.params.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Update notification error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Create notification (can be used by other routes internally)
router.post("/", async (req, res) => {
  const { user_id, type, message } = req.body;

  if (!user_id || !type || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, message, is_read, created_at)
       VALUES ($1, $2, $3, false, NOW())`,
      [user_id, type, message]
    );
    res.status(201).json({ message: "Notification created" });
  } catch (err) {
    console.error("Create notification error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
