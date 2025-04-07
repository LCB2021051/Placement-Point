const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const User = require("../models/User");

// GET /api/user/profile - Return profile from MongoDB
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });

    if (!user) {
      return res.status(404).json({ message: "User profile not found" });
    }

    res.json({
      uid: user.uid,
      email: user.email,
      role: user.role,
      gpa: user.gpa,
      department: user.department,
      batch: user.batch,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/save", verifyToken, async (req, res) => {
  try {
    const { gpa, department, batch, role } = req.body;

    const existing = await User.findOne({ uid: req.user.uid });
    if (existing)
      return res.status(400).json({ message: "Profile already exists" });

    const user = new User({
      uid: req.user.uid,
      email: req.user.email,
      gpa,
      department,
      batch,
      role,
    });

    await user.save();
    res.json({ message: "Profile saved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/check", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
