// client/src/components/Editor.jsx
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { auth } from "../firebase";
import io from "socket.io-client";

export default function Editor({ testcases, questionId, roomId }) {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("// write your code here");
  const [output, setOutput] = useState("");

  const codeRef = useRef(code);
  const socketRef = useRef(null);
  const debounceId = useRef(null);
  const remoteEdit = useRef(false);

  /* --- helper --- */
  const getLangExtension = () =>
    language === "python"
      ? python()
      : language === "javascript"
      ? javascript()
      : cpp();

  /* --- load saved code once --- */
  useEffect(() => {
    (async () => {
      const userId = auth.currentUser?.uid;
      if (!userId || !questionId) return;
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/solutions/${questionId}/${userId}`
        );
        if (data?.code) {
          setCode(data.code);
          codeRef.current = data.code;
          setLanguage(data.language || "cpp");
        }
      } catch {
        /* no saved draft */
      }
    })();
  }, [questionId]);

  /* --- socket.io join & sync --- */
  useEffect(() => {
    if (!roomId) return;
    socketRef.current = io("http://localhost:5000", {
      transports: ["websocket"],
      forceNew: true,
    });
    const s = socketRef.current;
    s.emit("join-room", roomId);

    s.on("request-latest-code", () =>
      s.emit("provide-code", { roomId, code: codeRef.current })
    );

    const applyRemote = (incoming) => {
      if (typeof incoming === "string" && incoming !== codeRef.current) {
        remoteEdit.current = true;
        setCode(incoming);
        codeRef.current = incoming;
      }
    };
    s.on("send-code", applyRemote);
    s.on("code-sync", applyRemote);

    return () => {
      s.off("request-latest-code");
      s.off("send-code");
      s.off("code-sync");
      s.disconnect();
    };
  }, [roomId]);

  /* --- broadcast local edits (debounced) --- */
  const handleCodeChange = (value) => {
    setCode(value);
    codeRef.current = value;
    if (remoteEdit.current) {
      remoteEdit.current = false;
      return;
    }

    if (roomId && socketRef.current?.connected) {
      clearTimeout(debounceId.current);
      debounceId.current = setTimeout(() => {
        socketRef.current.emit("code-change", { roomId, code: value });
      }, 200);
    }
  };

  /* ---------- reusable save ---------- */
  const saveSolution = async (verdict = "Draft") => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("No user → not saving");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/solutions", {
        userId,
        questionId,
        code: codeRef.current,
        language,
        verdict,
      });
      console.log("[save] ✅ solution stored");
    } catch (e) {
      if (e.response)
        console.error("[save] ❌", e.response.status, e.response.data);
      else console.error("[save] ❌ network error", e.message);
    }
  };

  /* ---------- run code ---------- */
  const handleRunCode = async () => {
    setOutput("Running testcases…");
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setOutput("⚠️ User not logged in.");
      return;
    }

    let allPassed = true;
    const results = [];

    for (const tc of testcases) {
      try {
        const { data } = await axios.post("http://localhost:5000/api/run", {
          code: codeRef.current,
          input: tc.input,
          language,
        });
        const actual = (data.output ?? "").trim();
        const expected = tc.expectedOutput.trim();
        const passed = actual === expected;
        if (!passed) allPassed = false;
        results.push({ ...tc, actual, passed });
      } catch {
        results.push({ ...tc, actual: "Error", passed: false });
        allPassed = false;
      }
    }

    setOutput(
      results
        .map(
          (r, i) =>
            `#${i + 1} ${r.passed ? "✅ Pass" : "❌ Fail"}\n` +
            `Input   : ${r.input}\nExpected: ${r.expectedOutput}\nGot     : ${r.actual}\n`
        )
        .join("\n")
    );

    /* save verdict as Passed / Failed */
    await saveSolution(allPassed ? "Passed" : "Failed");
  };

  /* ---------- UI ---------- */
  return (
    <div className="flex flex-col p-6 gap-4 h-full bg-gray-50">
      {/* toolbar */}
      <div className="flex gap-2 items-center justify-between">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="cpp">C++</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => saveSolution("Draft")}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Save Code
          </button>
          <button
            onClick={handleRunCode}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Run Code
          </button>
        </div>
      </div>

      {/* editor */}
      <CodeMirror
        value={code}
        height="55vh"
        extensions={[getLangExtension()]}
        onChange={(value) => handleCodeChange(value)}
        theme="light"
      />

      {/* terminal */}
      <div className="bg-black text-green-400 p-4 h-40 overflow-auto font-mono rounded">
        <h3 className="text-white font-bold mb-2">Terminal</h3>
        <pre>{output}</pre>
      </div>
    </div>
  );
}
