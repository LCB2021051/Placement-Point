// routes/job.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { bucket } = require("../config/firebaseAdmin");
const verifyToken = require("../middleware/verifyToken");
const Job = require("../models/Job");
const User = require("../models/User");
const readSheet = require("../google/googleAdmin");

// Use memory storage for uploading PDF
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");
    return isPdf
      ? cb(null, true)
      : cb(new Error("Only PDF files are allowed"), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST: Admin posts job w/ JD PDF + multiple sheetLinks
router.post("/post", verifyToken, upload.single("jd"), async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can post jobs" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "JD PDF file is required" });
    }

    const {
      title,
      company,
      description,
      minGPA,
      department,
      batch,
      sheetLinks: rawLinks,
      statusRoadmap: rawRoadmap,
    } = req.body;

    // ✅ Parse sheetLinks
    let sheetLinks = [];
    if (rawLinks) {
      try {
        sheetLinks = JSON.parse(rawLinks);
      } catch (err) {
        console.error("❌ Failed to parse sheetLinks JSON:", err.message);
        return res.status(400).json({ message: "Invalid sheetLinks JSON" });
      }
    }

    // ✅ Parse roadmap
    const statusRoadmap = rawRoadmap
      ? rawRoadmap
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // ✅ Assign currentStatus to first roadmap step
    const currentStatus = statusRoadmap[0] || "";

    // Firebase upload
    const file = req.file;
    const blob = bucket.file(
      `job_descriptions/${Date.now()}-${file.originalname}`
    );
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    blobStream.on("error", (err) => {
      console.error("❌ JD upload error:", err.message);
      return res
        .status(500)
        .json({ message: "Upload failed", error: err.message });
    });

    blobStream.on("finish", async () => {
      try {
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

        const job = new Job({
          title,
          company,
          description,
          jd: publicUrl,
          sheetLinks,
          statusRoadmap,
          currentStatus, // ✅ Save current milestone
          eligibility: {
            minGPA: parseFloat(minGPA),
            department: department.split(",").map((d) => d.trim()),
            batch: batch.split(",").map((b) => parseInt(b.trim(), 10)),
          },
        });

        await job.save();
        return res.json({ message: "Job posted successfully!" });
      } catch (err) {
        return res.status(500).json({
          message: "Upload succeeded but save failed",
          error: err.message,
        });
      }
    });

    blobStream.end(file.buffer);
  } catch (err) {
    console.error("🔥 Server error in /post job route:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

// GET /all
router.get("/all", verifyToken, async (req, res) => {
  try {
    const jobs = await Job.find().sort({ postedAt: -1 });
    return res.json(jobs);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET: Fetch single job by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    return res.json(job);
  } catch (err) {
    console.error("❌ Error fetching job by ID:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

// PUT: Update job by ID (admin only)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can update jobs" });
    }

    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const {
      title,
      company,
      description,
      minGPA,
      department,
      batch,
      sheetLinks,
      statusRoadmap,
      currentStatus,
      open,
    } = req.body;

    if (title) job.title = title;
    if (company) job.company = company;
    if (description) job.description = description;
    if (sheetLinks) job.sheetLinks = sheetLinks;
    if (statusRoadmap) job.statusRoadmap = statusRoadmap;
    if (currentStatus) job.currentStatus = currentStatus;
    if (typeof open === "boolean") job.open = open;

    if (minGPA || department || batch) {
      job.eligibility = {
        minGPA: minGPA || job.eligibility.minGPA,
        department: department || job.eligibility.department,
        batch: batch || job.eligibility.batch,
      };
    }

    await job.save();
    return res.json({ message: "Job updated successfully", job });
  } catch (err) {
    console.error("❌ Error updating job:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

// POST /apply/:id
router.post("/apply/:id", verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    const user = await User.findOne({ uid: req.user.uid });
    if (!job || !user) {
      console.warn("⚠️ Job or user not found");
      return res.status(404).json({ message: "Job or user not found" });
    }

    const { minGPA, department, batch } = job.eligibility;
    if (
      user.gpa < minGPA ||
      !department.includes(user.department) ||
      !batch.includes(parseInt(user.batch, 10))
    ) {
      return res.status(403).json({ message: "Not eligible to apply" });
    }

    if (job.applications.includes(req.user.uid)) {
      return res.status(400).json({ message: "Already applied" });
    }

    job.applications.push(req.user.uid);
    await job.save();

    return res.json({ message: "Application submitted successfully" });
  } catch (err) {
    console.error("🔥 Server error in /apply route:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

// POST: Check application status from Google Sheet
router.post("/status", async (req, res) => {
  try {
    const { email, sheetUrl } = req.body;

    if (!email || !sheetUrl) {
      return res.status(400).json({ message: "Email and Sheet URL required" });
    }

    // Extract Sheet ID from full URL
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return res.status(400).json({ message: "Invalid Google Sheet URL" });
    }

    const sheetId = match[1];

    // Read the first column (A) which should contain emails or UIDs
    const rows = await readSheet(sheetId, "A:Z"); // You can adjust the range

    const headers = rows[0];
    const emailColIndex = headers.findIndex((header) =>
      header.toLowerCase().includes("email")
    );
    const statusColIndex = headers.findIndex((header) =>
      header.toLowerCase().includes("status")
    );

    if (emailColIndex === -1 || statusColIndex === -1) {
      return res
        .status(400)
        .json({ message: "Sheet missing email/status column" });
    }

    const foundRow = rows.find((row, idx) => {
      if (idx === 0) return false;
      return (
        row[emailColIndex]?.toLowerCase().trim() === email.toLowerCase().trim()
      );
    });

    if (foundRow) {
      const status = foundRow[statusColIndex] || "Submitted";
      return res.json({ applied: true, status });
    } else {
      return res.json({ applied: false, status: null });
    }
  } catch (err) {
    console.error("❌ Error checking sheet:", err.message);
    res.status(500).json({ message: "Internal error", error: err.message });
  }
});

module.exports = router;
