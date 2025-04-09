import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function chunkString(str, size = 120) {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

const MockInterview = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const originalQuestions = location.state?.questions || [];
  const questions = originalQuestions.slice(1); // 👈 skip heading

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerTime, setAnswerTime] = useState(30);
  const [phase, setPhase] = useState("starting");
  const [answers, setAnswers] = useState(() => questions.map(() => ""));

  const [feedback, setFeedback] = useState("");

  const hasSpokenRef = useRef(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // 📸 Start webcam + mic
  const recognitionRef = useRef(null);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play();

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map((result) => result[0].transcript)
          .join("");

        // 🧠 Update current answer as user speaks
        setAnswers((prev) => {
          const updated = [...prev];
          updated[currentIndex] = transcript;
          return updated;
        });
      };

      recognition.onerror = (e) => {
        console.error("Speech recognition error:", e);
      };

      recognition.start();
      recognitionRef.current = recognition;

      const recorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("🎥 Error accessing camera/mic", err);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  };

  const speakQuestionInChunks = (text) => {
    const chunks = chunkString(text);
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.name.includes("Google") && v.lang === "en-US") ||
      voices[0];

    let index = 0;
    const speakChunk = () => {
      if (index >= chunks.length) {
        setPhase("answer");
        setAnswerTime(30);
        startRecording();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.voice = voice;
      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => {
        index++;
        speakChunk();
      };
      utterance.onerror = () => {
        console.error("❌ Speech error");
        setPhase("answer");
        setAnswerTime(30);
        startRecording();
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };
    speakChunk();
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopRecording();
    };
  }, []);

  useEffect(() => {
    if (phase === "starting") {
      const timer = setTimeout(() => {
        setPhase("read");
      }, 2000); // 2 second delay
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "answer" && answerTime > 0) {
      const timer = setTimeout(() => setAnswerTime((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === "answer" && answerTime === 0) {
      nextQuestion();
    }
  }, [phase, answerTime]);

  useEffect(() => {
    const handleVoices = () => {
      if (
        phase === "read" &&
        !hasSpokenRef.current &&
        questions[currentIndex]
      ) {
        hasSpokenRef.current = true;
        speakQuestionInChunks(questions[currentIndex]);
      }
    };

    // If voices are already available
    if (speechSynthesis.getVoices().length) {
      handleVoices();
    } else {
      // Wait for voices to load
      speechSynthesis.onvoiceschanged = handleVoices;
    }
  }, [phase, currentIndex, questions]);

  const nextQuestion = () => {
    stopRecording();
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

      const utterance = new SpeechSynthesisUtterance(data.feedback);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("❌ Feedback error:", err);
      setFeedback("❌ Failed to generate feedback.");
      setPhase("done");
    }
  };

  if (!questions.length) {
    return (
      <div className="p-6 text-center text-red-600">No questions found.</div>
    );
  }

  if (phase === "starting") {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl font-medium text-gray-700">
        🚀 Starting your mock interview...
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
            <video
              ref={videoRef}
              className="w-full rounded border"
              autoPlay
              muted
              playsInline
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MockInterview;
