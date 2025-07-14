// routes/borrowRoutes.js
import express from "express";
import db from "../db/index.js";

const router = express.Router();

// Send a borrow request
router.post("/", async (req, res) => {
  const borrowerId = req.user?.id;
  if (!borrowerId) return res.status(401).json({ error: "Unauthorized" });

  const { resource_id, message } = req.body;

  try {
    const resource = await db.query("SELECT * FROM resources WHERE id = $1", [resource_id]);
    if (resource.rows.length === 0) return res.status(404).json({ error: "Resource not found" });

    const ownerId = resource.rows[0].owner_id;

    // Prevent requesting own resource
    if (ownerId === borrowerId) {
      return res.status(400).json({ error: "You cannot request your own item" });
    }

    await db.query(
      `INSERT INTO borrow_requests (resource_id, borrower_id, owner_id, message, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW())`,
      [resource_id, borrowerId, ownerId, message]
    );

    res.status(201).json({ message: "Request sent" });
  } catch (err) {
    console.error("Borrow request error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// View my requests (sent and received)
router.get("/", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await db.query(
      `
      SELECT br.*, r.title AS resource_title, u.name AS borrower_name
      FROM borrow_requests br
      JOIN resources r ON br.resource_id = r.id
      JOIN users u ON br.borrower_id = u.id
      WHERE br.borrower_id = $1 OR br.owner_id = $1
      ORDER BY br.created_at DESC
      `,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get borrow requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Accept or reject a request
router.post("/:id", async (req, res) => {
  const ownerId = req.user?.id;
  const requestId = req.params.id;
  const { status } = req.body;

  console.log("User attempting update:", ownerId);
  console.log("Request ID:", requestId);
  console.log("📦 Body:", status);

  if (!ownerId) return res.status(401).json({ error: "Unauthorized" });
  if (!["accepted", "declined"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    // Check if this owner is allowed to update this request
    const result = await db.query(
      "SELECT * FROM borrow_requests WHERE id = $1 AND owner_id = $2",
      [requestId, ownerId]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.query(
      "UPDATE borrow_requests SET status = $1 WHERE id = $2",
      [status, requestId]
    );

    res.json({ message: `Request ${status}` });
  } catch (err) {
    console.error("Update request error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Accepted borrowed items
router.get("/accepted", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const acceptedRes = await db.query(
      `
      SELECT 
        r.id, r.title, r.description, r.type,
        COALESCE(json_agg(p.photo_url) FILTER (WHERE p.photo_url IS NOT NULL), '[]') AS photos
      FROM borrow_requests br
      JOIN resources r ON br.resource_id = r.id
      LEFT JOIN resource_photos p ON r.id = p.resource_id
      WHERE br.borrower_id = $1 AND br.status = 'accepted'
      GROUP BY r.id
      `,
      [userId]
    );

    res.json(acceptedRes.rows);
  } catch (err) {
    console.error("Error fetching accepted borrowed items", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Get current user info
router.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  res.json({ id: req.user.id, name: req.user.name });
});

export default router;
