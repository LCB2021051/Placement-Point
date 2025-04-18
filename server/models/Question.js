const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  title: String,
  description: String,
  difficulty: String,
  tags: [String],
  testcases: [
    {
      input: String,
      expectedOutput: String,
    },
  ],
});

module.exports = mongoose.model("Question", QuestionSchema);
