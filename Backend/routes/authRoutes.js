// routes/authRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import passport from "passport";
import db from "../db/index.js";
import { generateToken, protect } from "../utils/jwtUtils.js";

const router = express.Router();
const saltRounds = 10;

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, address } = req.body;

  try {
    // Check if user already exists
    const existingUser = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashed = await bcrypt.hash(password, saltRounds);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, address)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, hashed, address]
    );

    const user = result.rows[0];
    const token = generateToken(user);
    
    // Remove sensitive data before sending
    const { password_hash, ...userWithoutPassword } = user;
    
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: userWithoutPassword
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Failed to register", error: err.message });
  }
});

// Login
router.post("/login", (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: info?.message || 'Authentication failed'
      });
    }
    
    const token = generateToken(user);
    const { password_hash, ...userWithoutPassword } = user;
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: userWithoutPassword
      }
    });
  })(req, res, next);
});

// Logout (client-side should remove the token)
router.get("/logout", (req, res) => {
  res.status(200).json({ status: 'success', message: 'Successfully logged out' });
});

// Protected route example
router.get("/me", protect, async (req, res) => {
  try {
    const result = await db.query("SELECT id, name, email, address FROM users WHERE id = $1", [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }
    res.status(200).json({
      status: 'success',
      data: {
        user: result.rows[0]
      }
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ status: 'error', message: 'Error fetching user data' });
  }
});

// Update user location
router.post("/update-location", protect, async (req, res) => {
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
