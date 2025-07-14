import express from "express";
import multer from "multer";
import db from "../db/index.js";
import path from "path";
import fs from "fs";

const router = express.Router();

const uploadDir = "uploads/resource";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// ----------------------------
// POST /api/resources
// ----------------------------
router.post("/", upload.array("photos"), async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { title, description, category, type } = req.body;

  try {
    // 1. Insert into resources table
    const result = await db.query(
      `INSERT INTO resources (owner_id, title, description, category, type, available, created_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       RETURNING id`,
      [userId, title, description, category, type.toLowerCase()]
    );

    const resourceId = result.rows[0].id;

    // 2. Store photo URLs
    if (req.files && req.files.length > 0) {
      const photoQueries = req.files.map((file) =>
        db.query(
          `INSERT INTO resource_photos (resource_id, photo_url)
           VALUES ($1, $2)`,
          [resourceId, `uploads/resource/${file.filename}`]
        )
      );
      await Promise.all(photoQueries);
    }

    res.status(201).json({ message: "Resource created successfully" });
  } catch (err) {
    console.error("Error creating resource:", err);
    res.status(500).json({ error: "Failed to create resource" });
  }
});

// ----------------------------
// GET /api/resources/user
// ----------------------------
router.get("/user", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const resourcesWithPhotos = await db.query(
      `
      SELECT 
        r.id,
        r.title,
        r.description,
        r.category,
        r.type,
        COALESCE(json_agg(p.photo_url) FILTER (WHERE p.photo_url IS NOT NULL), '[]') AS photos
      FROM resources r
      LEFT JOIN resource_photos p ON r.id = p.resource_id
      WHERE r.owner_id = $1
      GROUP BY r.id
      ORDER BY r.created_at DESC
      `,
      [userId]
    );

    res.json(resourcesWithPhotos.rows);
  } catch (error) {
    console.error("Error fetching user resources:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------------
// GET /api/resources/others
// ----------------------------

router.get("/others", async (req, res) => {
  const userId = req.user?.id;

  try {
    const resourcesRes = await db.query(
      `
      SELECT 
        r.id,
        r.title,
        r.description,
        r.type,
        r.owner_id,                                
        u.name AS owner_name,
        u.latitude AS owner_latitude,
        u.longitude AS owner_longitude,
        u.address AS owner_address,
        COALESCE(
          json_agg(rp.photo_url) FILTER (WHERE rp.photo_url IS NOT NULL),
          '[]'
        ) AS photos
      FROM resources r
      JOIN users u ON r.owner_id = u.id
      LEFT JOIN resource_photos rp ON r.id = rp.resource_id
      WHERE r.owner_id != $1
      GROUP BY r.id, r.owner_id, u.name, u.latitude, u.longitude, u.address
      `,
      [userId]
    );

    if (resourcesRes.rows.length === 0) {
      return res.status(404).json({ message: "No resources found" });
    }

    res.json(resourcesRes.rows);
  } catch (err) {
    console.error("Error fetching others' resources", err);
    res.status(500).json({ error: "Server error" });
  }
});



export default router;
