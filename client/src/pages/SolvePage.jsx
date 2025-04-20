import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Editor from "../components/Editor";

const SolvePage = () => {
  const { questionId, roomId } = useParams();
  const [question, setQuestion] = useState(null);
  const [uid, setUid] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  /* watch Firebase auth */
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (user) =>
      setUid(user ? user.uid : null)
    );
    return unsub;
  }, []);

  /* fetch the question once */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/questions/${questionId}`
        );
        setQuestion(data);
      } catch (e) {
        console.error("Error fetching question:", e);
      }
    })();
  }, [questionId]);

  /* helpers for room links */
  const handleCreateRoom = () =>
    navigate(`/practice/${uuidv4()}/${questionId}`);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Invite link copied to clipboard!");
  };

  const isCollaborative = location.pathname.includes("/practice/");
  if (!question) return <div className="p-6">Loading…</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ---------- left column ---------- */}
      <div className="w-[40%] p-6 overflow-y-auto border-r bg-white relative">
        <div className="absolute top-4 right-4">
          {isCollaborative ? (
            <button
              onClick={handleCopyLink}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm"
            >
              Copy Invite Link
            </button>
          ) : (
            <button
              onClick={handleCreateRoom}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
            >
              Create Collaborative Room
            </button>
          )}
        </div>

        <h1 className="text-2xl font-bold mt-12">{question.title}</h1>
        <p className="text-gray-600 mt-2">Difficulty: {question.difficulty}</p>

        <div className="flex flex-wrap gap-2 mt-2">
          {question.tags.map((tag, i) => (
            <span key={i} className="px-2 py-1 text-xs bg-gray-200 rounded">
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-4 whitespace-pre-wrap">{question.description}</p>

        <h2 className="mt-6 font-semibold">Sample Testcases:</h2>
        <ul className="list-disc ml-6 text-sm text-gray-700">
          {question.testcases.map((tc, i) => (
            <li key={i} className="mb-2">
              <strong>Input:</strong> {tc.input} <br />
              <strong>Expected:</strong> {tc.expectedOutput}
            </li>
          ))}
        </ul>
      </div>

      {/* ---------- right column ---------- */}
      <div className="w-[60%] h-full">
        <Editor
          testcases={question.testcases}
          questionId={question._id}
          userId={uid}
          roomId={roomId}
        />
      </div>
    </div>
  );
};

export default SolvePage;
