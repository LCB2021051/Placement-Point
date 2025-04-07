// /gemini/gemini.js
const { initialize, generateText } = require("@google/generative-ai");

// Initialize with your API key
initialize({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * generateQuestions(promptText)
 * Uses Text Bison to create interview questions or feedback.
 */
async function generateQuestions(promptText) {
  // You can pass 'chat-bison-001' or 'text-bison-001'. We'll use text-bison-001
  const response = await generateText({
    model: "models/text-bison-001",
    prompt: {
      text: promptText,
    },
  });

  // The content is typically in candidates[0].output
  return response?.candidates?.[0]?.output || "";
}

module.exports = generateQuestions;
