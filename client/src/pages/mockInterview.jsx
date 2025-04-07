import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function chunkString(str, size = 120) {
  // Splits a string into smaller pieces to avoid Web Speech cutting out
  const chunks = [];
  let i = 0;
  while (i < str.length) {
    chunks.push(str.slice(i, i + size));
    i += size;
  }
  return chunks;
}

const MockInterview = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const questions = location.state?.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerTime, setAnswerTime] = useState(30);
  const [phase, setPhase] = useState("read");
  const [answers, setAnswers] = useState(() => questions.map(() => ""));
  const [feedback, setFeedback] = useState("");

  const hasSpokenRef = useRef(false);

  // 1) Splits question into chunks & speak them sequentially
  const speakQuestionInChunks = (fullText) => {
    const chunks = chunkString(fullText, 120);

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes("Google") && v.lang === "en-US"
    );

    let currentChunkIndex = 0;

    const speakChunk = () => {
      if (currentChunkIndex >= chunks.length) {
        // All chunks spoken => transition to answer
        setPhase("answer");
        setAnswerTime(30);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[currentChunkIndex]);
      utterance.voice = preferredVoice || voices[0];
      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onend = () => {
        currentChunkIndex++;
        speakChunk(); // speak next chunk
      };

      utterance.onerror = (e) => {
        console.error("Speech error on chunk:", e);
        // If error, just skip to answer phase
        setPhase("answer");
        setAnswerTime(30);
      };

      // Cancel any ongoing speech for safety
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    speakChunk(); // start speaking the first chunk
  };

  useEffect(() => {
    return () => {
      // Cleanup speech when navigating away
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 2) Called once per question, if phase = read
  useEffect(() => {
    if (phase === "read" && !hasSpokenRef.current && questions[currentIndex]) {
      hasSpokenRef.current = true;
      speakQuestionInChunks(questions[currentIndex]);
    }
  }, [phase, currentIndex, questions]);

  // 3) Timer for the "answer" phase
  useEffect(() => {
    if (phase === "answer" && answerTime > 0) {
      const timer = setTimeout(() => setAnswerTime((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === "answer" && answerTime === 0) {
      nextQuestion();
    }
  }, [phase, answerTime]);

  // 4) Move to next question or generate feedback
  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setPhase("read");
      setAnswerTime(0);
      hasSpokenRef.current = false;
    } else {
      setPhase("analyzing");
      generateFeedback();
    }
  };

  // 5) Track typed answers
  const handleAnswerChange = (e) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = e.target.value;
    setAnswers(newAnswers);
  };

  // 6) Generate AI feedback
  const generateFeedback = async () => {
    const userAnswers = questions.map((q, i) => ({
      question: q,
      answer: answers[i],
    }));

    try {
      const res = await fetch(
        "http://localhost:5000/api/interview/generate-feedback",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAnswers }),
        }
      );
      const data = await res.json();
      setFeedback(data.feedback || "No feedback received.");
      setPhase("done");

      // Optional: read the feedback aloud
      const utterance = new SpeechSynthesisUtterance(data.feedback);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("❌ Feedback error:", err);
      setFeedback("❌ Failed to generate feedback.");
      setPhase("done");
    }
  };

  // 7) UI states
  if (!questions.length) {
    return (
      <div className="p-6 text-center text-red-600">
        No questions found. Please go back and restart the interview.
      </div>
    );
  }

  if (phase === "analyzing") {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl">
        ⏳ Analyzing your responses...
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center">
        <div className="bg-white p-6 rounded shadow-md max-w-2xl w-full">
          <h2 className="text-2xl font-bold mb-4 text-green-600">
            🎯 AI Feedback
          </h2>
          <p className="whitespace-pre-wrap text-gray-800 text-sm">
            {feedback}
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center">
      <div className="bg-white p-6 shadow-md rounded w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">AI Mock Interview</h2>
        <p className="font-semibold mb-2">
          Question {currentIndex + 1} of {questions.length}
        </p>
        <p className="text-lg mb-4">{questions[currentIndex]}</p>

        {phase === "answer" && (
          <>
            <div className="text-green-600 font-bold mb-2">
              Answer Time: {answerTime}s
            </div>
            <textarea
              value={answers[currentIndex]}
              onChange={handleAnswerChange}
              rows={4}
              className="w-full border rounded p-2"
              placeholder="Type your short answer here..."
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MockInterview;
