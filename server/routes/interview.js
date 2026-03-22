const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fetch = require("node-fetch");

const router = express.Router();
const upload = multer();

// 🔥 Call Gemini API (Gemini 2.5 Flash)
async function callGemini(prompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Gemini error: ${res.status} ${JSON.stringify(data)}`);
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// 🎯 Generate Questions
router.post(
  "/generate-questions",
  upload.fields([
    { name: "resumePdf", maxCount: 1 },
    { name: "jdPdf", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { role, experience, topics } = req.body;

      // 🧾 Parse resume
      let resumeText = "";
      if (req.files.resumePdf?.[0]) {
        const pdf = await pdfParse(req.files.resumePdf[0].buffer);
        resumeText = pdf.text;
      }

      // 🧾 Parse JD (optional)
      let jdText = "";
      if (req.files.jdPdf?.[0]) {
        const pdf = await pdfParse(req.files.jdPdf[0].buffer);
        jdText = pdf.text;
      }

      // 🧠 Prompt
      const prompt = `
You are an AI interviewer. Generate 5 interview questions for the role: ${role}.
Candidate has ${experience} experience.
Focus on topics: ${topics}.

Resume:
${resumeText}

${jdText ? `Job Description:\n${jdText}` : ""}

Return only the list of questions, numbered if you like.
`.trim();

      // ✨ Call Gemini
      const responseText = await callGemini(prompt);

      const questions = responseText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((q) => q.replace(/^\d+\.\s*/, "")); // remove "1. "

      res.json({ questions });
    } catch (err) {
      console.error("❌ Error:", err.message);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  }
);

// 📘 Generate feedback from answers
router.post("/generate-feedback", async (req, res) => {
  try {
    const { userAnswers } = req.body;

    if (!userAnswers || !Array.isArray(userAnswers)) {
      return res.status(400).json({ error: "Invalid userAnswers format" });
    }

    const formattedQA = userAnswers
      .map(
        (item, index) => `${index + 1}. Q: ${item.question}\nA: ${item.answer}`
      )
      .join("\n\n");

    const prompt = `
  You're a senior technical interviewer. Evaluate the following answers and provide constructive feedback to help the candidate improve.
  
  ${formattedQA}
  
  Provide detailed, specific feedback about strengths and suggestions for improvement.
  `.trim();

    const feedbackText = await callGemini(prompt);

    res.json({ feedback: feedbackText });
  } catch (err) {
    console.error("❌ Feedback error:", err.message);
    res.status(500).json({ error: "Failed to generate feedback" });
  }
});

module.exports = router;
