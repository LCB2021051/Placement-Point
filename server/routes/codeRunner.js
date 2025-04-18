const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {
  const { code, language, input } = req.body;

  try {
    const response = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: getLangId(language),
        stdin: input,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
        },
      }
    );

    res.json({
      output: response.data.stdout || response.data.stderr || "No output",
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ output: "Execution failed. Please try again." });
  }
});

const getLangId = (lang) => {
  switch (lang) {
    case "cpp":
      return 54;
    case "python":
      return 71;
    case "javascript":
      return 63;
    default:
      return 54;
  }
};

module.exports = router;
