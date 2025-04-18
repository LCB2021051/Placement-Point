import { useEffect, useState } from "react";
import axios from "axios";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { auth } from "../firebase";

const Editor = ({ testcases, questionId }) => {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("// write your code here");
  const [output, setOutput] = useState("");

  const getLangExtension = () => {
    switch (language) {
      case "cpp":
        return cpp();
      case "python":
        return python();
      case "javascript":
        return javascript();
      default:
        return cpp();
    }
  };

  // ✅ Fetch previous solution on mount
  useEffect(() => {
    const fetchSavedSolution = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId || !questionId) return;

      try {
        const res = await axios.get(
          `http://localhost:5000/api/solutions/${questionId}/${userId}`
        );
        if (res.data && res.data.code) {
          setCode(res.data.code);
          setLanguage(res.data.language || "cpp");
        }
      } catch (err) {
        console.log("No existing solution found");
      }
    };

    fetchSavedSolution();
  }, [questionId]);

  const handleRunCode = async () => {
    setOutput("Running testcases...");
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setOutput("⚠️ User not logged in.");
      return;
    }

    let allPassed = true;
    const results = [];

    for (const tc of testcases) {
      try {
        const res = await axios.post("http://localhost:5000/api/run", {
          code,
          input: tc.input,
          language,
        });

        const actual = res.data.output?.trim();
        const expected = tc.expectedOutput.trim();
        const passed = actual === expected;

        if (!passed) allPassed = false;

        results.push({ input: tc.input, expected, actual, passed });
      } catch (err) {
        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: "Error",
          passed: false,
        });
        allPassed = false;
      }
    }

    let finalOutput = results
      .map(
        (r, idx) =>
          `# Testcase ${idx + 1}: ${r.passed ? "✅ Pass" : "❌ Fail"}\nInput: ${
            r.input
          }\nExpected: ${r.expected}\nGot: ${r.actual}\n`
      )
      .join("\n");

    setOutput(finalOutput);

    // Save solution
    try {
      await axios.post("http://localhost:5000/api/solutions", {
        userId,
        questionId,
        code,
        language,
        verdict: allPassed ? "Passed" : "Failed",
      });
    } catch (e) {
      console.error("❌ Failed to save solution:", e);
    }
  };

  return (
    <div className="flex flex-col p-6 gap-4 h-full bg-gray-50">
      <div className="flex justify-between items-center">
        <select
          className="border p-2 rounded bg-white"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="cpp">C++</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
        <button
          onClick={handleRunCode}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Run Code
        </button>
      </div>

      <CodeMirror
        value={code}
        height="55vh"
        extensions={[getLangExtension()]}
        onChange={(value) => setCode(value)}
        theme="light"
      />

      <div className="bg-black text-green-400 border rounded p-4 h-40 overflow-auto font-mono">
        <h3 className="font-bold text-white mb-2">Terminal</h3>
        <pre className="whitespace-pre-wrap">{output}</pre>
      </div>
    </div>
  );
};

export default Editor;
