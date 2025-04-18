const mongoose = require("mongoose");

const SolutionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  verdict: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Solution", SolutionSchema);
