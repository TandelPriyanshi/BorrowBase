import express from "express";
import db from "../db/index.js";
import uploadProfilePic from "./uploadProfilePic.js";

const router = express.Router();

// GET user profile
router.get("/", async (req, res) => {
  const userId = req.user?.id;
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const userRes = await db.query(
      "SELECT id, name, latitude, longitude, profile_pic_url FROM users WHERE id = $1",
      [userId]
    );
    const user = userRes.rows[0];

    const countsRes = await db.query(
      `
      SELECT 
        COUNT(*) FILTER (WHERE type = 'borrow') AS "borrowCount",
        COUNT(*) FILTER (WHERE type = 'lend') AS "lendCount",
        COUNT(*) FILTER (WHERE type = 'exchange') AS "exchangeCount"
      FROM resources
      WHERE owner_id = $1
      `,
      [userId]
    );

    const lendItemsRes = await db.query(
      "SELECT id, title, description FROM resources WHERE owner_id = $1 AND type = 'lend'",
      [userId]
    );

    res.json({
      id: user.id, // ✅ Add ID
      name: user.name,
      latitude: user.latitude,       // ✅ Add latitude
      longitude: user.longitude,     // ✅ Add longitude
      profile_pic_url: user.profile_pic_url,
      counts: {
        borrowCount: Number(countsRes.rows[0].borrowCount),
        lendCount: Number(countsRes.rows[0].lendCount),
        exchangeCount: Number(countsRes.rows[0].exchangeCount),
      },
      lendItems: lendItemsRes.rows,
    });
  } catch (err) {
    console.error("Profile fetch failed", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST upload profile pic
router.post("/upload-profile-pic", uploadProfilePic.single("photo"), async (req, res) => {
  try {
    const userId = req.user?.id;
    const filePath = req.file?.path;

    if (!filePath) return res.status(400).json({ error: "No file uploaded" });

    await db.query("UPDATE users SET profile_pic_url = $1 WHERE id = $2", [filePath, userId]);

    res.json({ success: true, path: filePath });
  } catch (err) {
    console.error("Upload failed", err);
    res.status(500).json({ error: "Server error during upload" });
  }
});

export default router;
