import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

function formatMarkdown(text) {
  // First pass: handle bold and italic (before list processing to avoid conflicts with *)
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

  // Process line by line for block-level elements
  const lines = html.split("\n");
  const result = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^\s*[-•*]\s+(.+)$/);
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    const hrMatch = line.match(/^---+$/);

    if (listMatch) {
      if (!inList) {
        result.push('<ul class="list-disc ml-6 mb-2">');
        inList = true;
      }
      result.push(`<li class="mb-1">${listMatch[1]}</li>`);
    } else {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      if (headingMatch) {
        const level = headingMatch[1].length;
        const sizes = { 1: "text-2xl", 2: "text-xl", 3: "text-lg" };
        result.push(`<h${level} class="${sizes[level]} font-bold mt-4 mb-2">${headingMatch[2]}</h${level}>`);
      } else if (hrMatch) {
        result.push('<hr class="my-4 border-gray-300"/>');
      } else if (line.trim() === "") {
        result.push("<br/>");
      } else {
        result.push(`<p class="mb-1">${line}</p>`);
      }
    }
  }
  if (inList) result.push("</ul>");

  return result.join("");
}

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
  const questions = originalQuestions.slice(1); // skip heading

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerTime, setAnswerTime] = useState(120);
  const [phase, setPhase] = useState("starting");
  const [answers, setAnswers] = useState(() => questions.map(() => ""));

  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const hasSpokenRef = useRef(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Feature detection
  const hasSpeechRecognition = !!(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );
  const hasGetUserMedia = !!(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );
  const hasSpeechSynthesis = !!window.speechSynthesis;
  const [useTextInput, setUseTextInput] = useState(!hasSpeechRecognition);
  const [cameraError, setCameraError] = useState(!hasGetUserMedia);

  const recognitionRef = useRef(null);

  const startRecording = async () => {
    // Start camera/mic if available
    if (hasGetUserMedia) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }

        try {
          const recorder = new MediaRecorder(mediaStream);
          mediaRecorderRef.current = recorder;
          recorder.start();
        } catch {
          // MediaRecorder not supported — camera preview still works
        }
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing camera/mic:", err);
        setCameraError(true);
        if (err.name === "NotAllowedError") {
          setErrorMsg(
            "Camera/microphone permission denied. You can still type your answers below."
          );
        } else if (err.name === "NotFoundError") {
          setErrorMsg(
            "No camera/microphone found. You can still type your answers below."
          );
        } else {
          setErrorMsg(
            "Could not access camera/microphone. You can still type your answers below."
          );
        }
        setUseTextInput(true);
        return;
      }
    } else {
      setCameraError(true);
      setUseTextInput(true);
    }

    // Start speech recognition if available
    if (hasSpeechRecognition) {
      try {
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

          setAnswers((prev) => {
            const updated = [...prev];
            updated[currentIndex] = transcript;
            return updated;
          });
        };

        recognition.onerror = (e) => {
          console.error("Speech recognition error:", e);
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            setUseTextInput(true);
            setErrorMsg(
              "Speech recognition unavailable. Please type your answer instead."
            );
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        setUseTextInput(true);
      }
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
    if (!hasSpeechSynthesis) {
      // No TTS support — skip reading, go straight to answer phase
      setPhase("answer");
      setAnswerTime(120);
      startRecording();
      return;
    }

    const chunks = chunkString(text);
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang === "en-US") || voices[0];

    let index = 0;
    const speakChunk = () => {
      if (index >= chunks.length) {
        setPhase("answer");
        setAnswerTime(120);
        startRecording();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      if (voice) utterance.voice = voice;
      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => {
        index++;
        speakChunk();
      };
      utterance.onerror = () => {
        // TTS failed — skip to answer phase
        setPhase("answer");
        setAnswerTime(120);
        startRecording();
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };
    speakChunk();
  };

  useEffect(() => {
    return () => {
      if (hasSpeechSynthesis) window.speechSynthesis.cancel();
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

    if (!hasSpeechSynthesis) {
      handleVoices();
      return;
    }

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
        `${API_BASE_URL}/api/interview/generate-feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAnswers }),
        }
      );
      const data = await res.json();
      setFeedback(data.feedback || "No feedback received.");
      setPhase("done");

      if (hasSpeechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(data.feedback);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("❌ Feedback error:", err);
      setFeedback("❌ Failed to generate feedback.");
      setPhase("done");
    }
  };

  if (!questions.length) {
    return (
      <div className="min-h-screen flex justify-center items-center p-4">
        <p className="text-red-600 text-center text-base">
          No questions found.
        </p>
      </div>
    );
  }

  if (phase === "starting") {
    return (
      <div className="min-h-screen flex justify-center items-center px-4 text-base sm:text-xl font-medium text-gray-700">
        Starting your mock interview...
      </div>
    );
  }

  if (phase === "analyzing") {
    return (
      <div className="min-h-screen flex justify-center items-center px-4 text-base sm:text-xl text-gray-700">
        Analyzing your responses...
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen p-3 sm:p-6 bg-gray-100 flex flex-col items-center">
        <div
          id="feedback-section"
          className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full max-w-2xl"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-green-600">
            AI Feedback
          </h2>
          <div
            className="text-gray-800 text-sm leading-relaxed overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(feedback) }}
          />
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-semibold"
            >
              Back to Home
            </button>
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white rounded-lg text-sm font-semibold"
            >
              Print Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-6 bg-gray-100 flex flex-col items-center">
      <div className="bg-white p-4 sm:p-6 shadow-md rounded-lg w-full max-w-2xl">
        <h2 className="text-base sm:text-xl font-bold mb-3">
          AI Mock Interview
        </h2>
        <p className="font-semibold text-sm sm:text-base mb-1">
          Question {currentIndex + 1} of {questions.length}
        </p>
        <p className="text-sm sm:text-lg mb-4 leading-relaxed">
          {questions[currentIndex]}
        </p>

        {errorMsg && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs sm:text-sm px-3 py-2 rounded mb-3">
            {errorMsg}
          </div>
        )}

        {phase === "answer" && (
          <>
            <div className="text-green-600 font-bold text-sm sm:text-base mb-2">
              Answer Time: {answerTime}s
            </div>

            {!cameraError && (
              <video
                ref={videoRef}
                className="w-full max-h-[40vh] object-cover rounded-lg border mb-3"
                autoPlay
                muted
                playsInline
              />
            )}

            {useTextInput && (
              <textarea
                className="w-full border rounded-lg p-3 mb-3 text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Type your answer here..."
                value={answers[currentIndex]}
                onChange={(e) =>
                  setAnswers((prev) => {
                    const updated = [...prev];
                    updated[currentIndex] = e.target.value;
                    return updated;
                  })
                }
              />
            )}

            <button
              onClick={nextQuestion}
              className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg text-sm sm:text-base"
            >
              {currentIndex + 1 < questions.length
                ? "Save & Next"
                : "Save & Finish"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MockInterview;
