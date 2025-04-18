import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Editor from "../components/Editor"; // adjust path based on folder structure

const SolvePage = () => {
  const { questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const userId = "66215fe63d47cdbfd1742be5";

  console.log(question);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/questions/${questionId}`
        );
        setQuestion(res.data);
      } catch (error) {
        console.error("Error fetching question:", error);
      }
    };
    fetchQuestion();
  }, [questionId]);

  if (!question) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Question */}
      <div className="w-[40%] p-6 overflow-y-auto border-r bg-white">
        <h1 className="text-2xl font-bold">{question.title}</h1>
        <p className="text-gray-600 mt-2">Difficulty: {question.difficulty}</p>
        <div className="flex gap-2 mt-2">
          {question.tags.map((tag, i) => (
            <span key={i} className="px-2 py-1 text-xs bg-gray-200 rounded">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-4 whitespace-pre-wrap">{question.description}</p>
        <h2 className="mt-6 font-semibold">Sample Testcases:</h2>
        <ul className="list-disc ml-6 text-sm text-gray-700">
          {question.testcases.map((tc, idx) => (
            <li key={idx}>
              <strong>Input:</strong> {tc.input} <br />
              <strong>Expected:</strong> {tc.expectedOutput}
            </li>
          ))}
        </ul>
      </div>

      {/* Right: Editor Component */}
      <div className="w-[60%] h-full">
        <Editor
          testcases={question.testcases}
          questionId={question._id}
          userId={userId}
        />
      </div>
    </div>
  );
};

export default SolvePage;
