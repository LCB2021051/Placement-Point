import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api";

const PracticePage = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const res = await axios.get(`${API_BASE_URL}/api/questions`);
      setQuestions(res.data);
    };
    fetchQuestions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          Practice Questions
        </h1>
        <div className="space-y-3">
          {questions.map((q) => (
            <Link to={`/solve/${q._id}`} key={q._id}>
              <div className="bg-white p-4 border rounded-lg shadow-sm hover:shadow transition">
                <h2 className="text-sm sm:text-lg font-semibold">
                  {q.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {q.difficulty}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {q.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-gray-200 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PracticePage;
