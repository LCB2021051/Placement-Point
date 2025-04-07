const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  description: String,
  eligibility: {
    minGPA: Number,
    department: [String],
    batch: [Number],
  },
  jd: String,
  sheetLinks: [String],
  statusRoadmap: [String],
  currentStatus: String,
  open: Boolean,
  applications: [String],
  postedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Job", jobSchema);
