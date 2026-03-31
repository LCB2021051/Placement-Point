import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

function formatMarkdown(text) {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

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
        result.push(
          `<h${level} class="${sizes[level]} font-bold mt-4 mb-2">${headingMatch[2]}</h${level}>`
        );
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

const MockInterview = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const originalQuestions = location.state?.questions || [];
  const questions = originalQuestions.slice(1);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerTime, setAnswerTime] = useState(120);
  const [phase, setPhase] = useState("ready");
  const [answers, setAnswers] = useState(() => questions.map(() => ""));
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const ttsTimeoutRef = useRef(null);
  const ttsResumeIntervalRef = useRef(null);
  const currentIndexRef = useRef(0);
  const phaseRef = useRef("ready");
  const hasSpokenRef = useRef(false);
  const shouldRecognizeRef = useRef(false);
  // Accumulated final transcript across recognition restarts
  const finalTranscriptRef = useRef("");
  const advancedRef = useRef(false);

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

  // Keep refs in sync
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ──────────────────────────────────────────────
  //  MEDIA: request camera/mic with fallback
  // ──────────────────────────────────────────────
  const requestMedia = async () => {
    if (!hasGetUserMedia) {
      setCameraError(true);
      setUseTextInput(true);
      return;
    }

    const tryGetMedia = async (constraints, label) => {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn(`${label} failed:`, err.message);
        return null;
      }
    };

    // Try video + audio
    let stream = await tryGetMedia({ video: true, audio: true }, "video+audio");

    if (!stream) {
      // Try audio only
      stream = await tryGetMedia({ audio: true }, "audio-only");
      if (stream) {
        setCameraError(true);
        setErrorMsg("Camera unavailable — you can speak or type your answers.");
      }
    }

    if (!stream) {
      // Try video only
      stream = await tryGetMedia({ video: true }, "video-only");
      if (stream) {
        setUseTextInput(true);
        setErrorMsg("Microphone unavailable — please type your answers.");
      }
    }

    if (!stream) {
      setCameraError(true);
      setUseTextInput(true);
      setErrorMsg("Camera and microphone unavailable — please type your answers.");
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  // Ensure video plays when answer phase starts
  useEffect(() => {
    if (phase === "answer" && videoRef.current && videoRef.current.srcObject) {
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  // ──────────────────────────────────────────────
  //  SPEECH RECOGNITION with auto-restart + transcript accumulation
  // ──────────────────────────────────────────────
  const startSpeechRecognition = useCallback(() => {
    if (!hasSpeechRecognition) return;
    shouldRecognizeRef.current = true;
    finalTranscriptRef.current = "";

    const launch = () => {
      if (!shouldRecognizeRef.current) return;
      try {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SR();
        rec.lang = "en-US";
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (e) => {
          let finalPart = "";
          let interimPart = "";
          for (let i = 0; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
              finalPart += t;
            } else {
              interimPart += t;
            }
          }
          // Save confirmed text so restarts don't lose it
          if (finalPart) {
            finalTranscriptRef.current += finalPart;
          }
          const full = finalTranscriptRef.current + interimPart;
          setAnswers((prev) => {
            const updated = [...prev];
            updated[currentIndexRef.current] = full;
            return updated;
          });
        };

        rec.onerror = (e) => {
          console.warn("Recognition error:", e.error);
          if (
            e.error === "not-allowed" ||
            e.error === "service-not-allowed" ||
            e.error === "audio-capture"
          ) {
            shouldRecognizeRef.current = false;
            setUseTextInput(true);
            setErrorMsg("Speech recognition blocked — please type your answer.");
          }
        };

        // Mobile Chrome kills recognition after silence — auto restart
        rec.onend = () => {
          if (shouldRecognizeRef.current && phaseRef.current === "answer") {
            setTimeout(launch, 300);
          }
        };

        rec.start();
        recognitionRef.current = rec;
      } catch {
        setUseTextInput(true);
      }
    };

    launch();
  }, [hasSpeechRecognition]);

  const stopSpeechRecognition = useCallback(() => {
    shouldRecognizeRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  // ──────────────────────────────────────────────
  //  RECORDING (MediaRecorder)
  // ──────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      try {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.start();
      } catch {}
      setIsRecording(true);
    }
    startSpeechRecognition();
  }, [startSpeechRecognition]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== "inactive")
          mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
    stopSpeechRecognition();
    setIsRecording(false);
  }, [stopSpeechRecognition]);

  // ���─────────────────────────────────────────────
  //  TTS — single utterance with resume() keepalive
  //  Mobile Chrome pauses speechSynthesis after ~15s;
  //  calling resume() every 5s prevents this.
  // ──────────────────────────────────────────────
  const goToAnswerPhase = useCallback(() => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);
    if (ttsResumeIntervalRef.current) clearInterval(ttsResumeIntervalRef.current);
    ttsTimeoutRef.current = null;
    ttsResumeIntervalRef.current = null;
    if (hasSpeechSynthesis) window.speechSynthesis.cancel();
    setPhase("answer");
    setAnswerTime(120);
    startRecording();
  }, [hasSpeechSynthesis, startRecording]);

  const speakQuestion = useCallback(
    (text) => {
      advancedRef.current = false;

      // Safety timeout: at rate 0.9, speech is ~450ms per word; use 600ms for margin
      const wordCount = text.split(/\s+/).length;
      const timeoutMs = Math.max(30000, wordCount * 600 + 15000);
      ttsTimeoutRef.current = setTimeout(() => goToAnswerPhase(), timeoutMs);

      if (!hasSpeechSynthesis) { goToAnswerPhase(); return; }

      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) { goToAnswerPhase(); return; }

      const voice =
        voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      // Split long text into chunks to avoid Chrome's TTS cutoff bug.
      // Chrome silently stops speaking long utterances (~200-300 chars).
      const splitIntoChunks = (str) => {
        const chunks = [];
        // Split on sentence-ending punctuation, keeping the delimiter
        const parts = str.split(/(?<=[.!?])\s+/);
        let current = "";
        for (const part of parts) {
          if ((current + " " + part).length > 180 && current) {
            chunks.push(current.trim());
            current = part;
          } else {
            current = current ? current + " " + part : part;
          }
        }
        if (current.trim()) chunks.push(current.trim());
        // If still too long (no punctuation at all), split by commas or words
        const result = [];
        for (const chunk of chunks) {
          if (chunk.length <= 200) {
            result.push(chunk);
          } else {
            // Try splitting on commas/semicolons
            const subParts = chunk.split(/(?<=[,;:])\s+/);
            let sub = "";
            for (const sp of subParts) {
              if ((sub + " " + sp).length > 180 && sub) {
                result.push(sub.trim());
                sub = sp;
              } else {
                sub = sub ? sub + " " + sp : sp;
              }
            }
            if (sub.trim()) result.push(sub.trim());
          }
        }
        return result.length ? result : [str];
      };

      const chunks = splitIntoChunks(text);

      const speakChunk = (index) => {
        if (advancedRef.current || index >= chunks.length) {
          goToAnswerPhase();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        if (voice) utterance.voice = voice;
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onend = () => speakChunk(index + 1);
        utterance.onerror = () => goToAnswerPhase();

        window.speechSynthesis.speak(utterance);
      };

      // Mobile Chrome bug: speechSynthesis silently stops after ~15s.
      // Workaround: call resume() every 5s WITHOUT pause() first.
      // pause() kills speech permanently on iOS; resume() alone is safe —
      // it's a no-op if not paused, but resets Chrome's internal timer.
      ttsResumeIntervalRef.current = setInterval(() => {
        window.speechSynthesis.resume();
      }, 5000);

      setTimeout(() => speakChunk(0), 100);
    },
    [hasSpeechSynthesis, goToAnswerPhase]
  );

  // ──────────────────────────────────────────────
  //  Cleanup
  // ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (hasSpeechSynthesis) window.speechSynthesis.cancel();
      if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);
      if (ttsResumeIntervalRef.current) clearInterval(ttsResumeIntervalRef.current);
      shouldRecognizeRef.current = false;
      try { recognitionRef.current?.onend && (recognitionRef.current.onend = null); } catch {}
      try { recognitionRef.current?.stop(); } catch {}
      try { if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop(); } catch {}
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [hasSpeechSynthesis]);

  // ──────────────────────────────────────────────
  //  Read phase → speak question
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (phase === "read" && !hasSpokenRef.current && questions[currentIndex]) {
      hasSpokenRef.current = true;

      if (!hasSpeechSynthesis) { speakQuestion(questions[currentIndex]); return; }

      const voices = speechSynthesis.getVoices();
      if (voices.length) {
        speakQuestion(questions[currentIndex]);
      } else {
        const t = setTimeout(() => goToAnswerPhase(), 3000);
        speechSynthesis.onvoiceschanged = () => {
          clearTimeout(t);
          speakQuestion(questions[currentIndex]);
        };
      }
    }
  }, [phase, currentIndex, questions, hasSpeechSynthesis, speakQuestion, goToAnswerPhase]);

  // Answer countdown
  useEffect(() => {
    if (phase === "answer" && answerTime > 0) {
      const t = setTimeout(() => setAnswerTime((p) => p - 1), 1000);
      return () => clearTimeout(t);
    } else if (phase === "answer" && answerTime === 0) {
      nextQuestion();
    }
  }, [phase, answerTime]);

  // ──────────────────────────────────────────────
  //  Actions
  // ──────────────────────────────────────────────
  const handleStart = async () => {
    setPhase("starting");

    // Preload TTS voices — on mobile they only load after first getVoices() call
    if (hasSpeechSynthesis) {
      window.speechSynthesis.getVoices();
      // Warm up the synthesizer with a silent utterance (mobile needs user-gesture context)
      const warmup = new SpeechSynthesisUtterance("");
      warmup.volume = 0;
      window.speechSynthesis.speak(warmup);
    }

    await requestMedia();
    setTimeout(() => setPhase("read"), 1500);
  };

  const nextQuestion = () => {
    stopRecording();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((p) => p + 1);
      setPhase("read");
      setAnswerTime(0);
      hasSpokenRef.current = false;
      setErrorMsg("");
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setPhase("analyzing");
      generateFeedback();
    }
  };

  const generateFeedback = async () => {
    const userAnswers = questions.map((q, i) => ({ question: q, answer: answers[i] }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/interview/generate-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAnswers }),
      });
      const data = await res.json();
      setFeedback(data.feedback || "No feedback received.");
      setPhase("done");
    } catch (err) {
      console.error("Feedback error:", err);
      setFeedback("Failed to generate feedback.");
      setPhase("done");
    }
  };

  // ──────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────

  if (!questions.length) {
    return (
      <div className="min-h-screen flex justify-center items-center p-4">
        <p className="text-red-600 text-center">No questions found.</p>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div className="min-h-screen flex justify-center items-center px-4 bg-gray-100">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Mock Interview</h2>
          <p className="text-gray-600 text-sm sm:text-base mb-2">
            {questions.length} questions ready
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mb-6">
            Tap Start to allow camera and microphone. You can always type your
            answers as a backup.
          </p>
          <button
            onClick={handleStart}
            className="w-full py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-lg text-base"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  if (phase === "starting") {
    return (
      <div className="min-h-screen flex justify-center items-center px-4 text-base sm:text-xl font-medium text-gray-700">
        Setting up...
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
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full max-w-2xl">
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
        <h2 className="text-base sm:text-xl font-bold mb-3">AI Mock Interview</h2>
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

        {phase === "read" && (
          <div className="text-blue-600 font-medium text-sm animate-pulse mb-3">
            Reading question aloud...
          </div>
        )}

        {/* Video always in DOM so ref is stable */}
        <video
          ref={videoRef}
          className={`w-full max-h-[40vh] object-cover rounded-lg border mb-3 bg-black ${
            (phase === "answer" || phase === "read") && !cameraError
              ? ""
              : "hidden"
          }`}
          autoPlay
          muted
          playsInline
        />

        {phase === "answer" && (
          <>
            <div className="text-green-600 font-bold text-sm sm:text-base mb-2">
              Answer Time: {answerTime}s
            </div>

            <textarea
              className="w-full border rounded-lg p-3 mb-3 text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder={
                useTextInput
                  ? "Type your answer here..."
                  : "Speaking... you can also type here"
              }
              value={answers[currentIndex]}
              onChange={(e) =>
                setAnswers((prev) => {
                  const updated = [...prev];
                  updated[currentIndex] = e.target.value;
                  return updated;
                })
              }
            />

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
