const express = require("express");
const Question = require("../models/Question.js");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const questions = await Question.find({});
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching questions" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, difficulty, tags, testcases } = req.body;

    const question = new Question({
      title,
      description,
      difficulty,
      tags,
      testcases, // ✅ include this field
    });

    await question.save();
    res
      .status(201)
      .json({ message: "Question created successfully", question });
  } catch (error) {
    res.status(500).json({ message: "Failed to create question", error });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Error fetching question" });
  }
});

module.exports = router;
