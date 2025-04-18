const express = require("express");
const router = express.Router();
const Solution = require("../models/Solutions");

router.post("/", async (req, res) => {
  try {
    const { userId, questionId, code, language, verdict } = req.body;

    const solution = new Solution({
      userId,
      questionId,
      code,
      language,
      verdict,
    });

    await solution.save();
    res.status(201).json({ message: "Solution saved successfully", solution });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save solution", error });
  }
});

router.get("/:questionId/:userId", async (req, res) => {
  try {
    const solution = await Solution.findOne({
      questionId: req.params.questionId,
      userId: req.params.userId,
    });
    if (!solution)
      return res.status(404).json({ message: "No solution found" });
    res.json(solution);
  } catch (err) {
    res.status(500).json({ message: "Error fetching solution", err });
  }
});

module.exports = router;
