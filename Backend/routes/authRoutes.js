// routes/authRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import passport from "../auth.js";
import db from "../db/index.js";

const router = express.Router();
const saltRounds = 10;

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, address } = req.body;

  try {
    const hashed = await bcrypt.hash(password, saltRounds);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, address)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, hashed, address]
    );

    // Auto-login after registration
    req.login(result.rows[0], (err) => {
      if (err) return res.status(500).send("Login after register failed");
      return res.status(200).json({ message: "Registered and logged in", user: result.rows[0] });
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).send("Failed to register");
  }
});

// Login
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.status(200).json({ message: "Logged in", user: req.user });
});

// Logout
router.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.send("Logged out");
  });
});


// Update user location
router.post("/update-location", async (req, res) => {
  const { latitude, longitude, address } = req.body;

  console.log("Received location update:", req.body);
  console.log("User from session:", req.user?.id);

  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    typeof address !== "string"
  ) {
    return res.status(400).json({ error: "Invalid location data" });
  }

  try {
    const result = await db.query(
      `UPDATE users SET latitude = $1, longitude = $2, address = $3 WHERE id = $4`,
      [latitude, longitude, address, req.user.id]
    );

    console.log("Location updated in DB for user:", req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating location in DB:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
