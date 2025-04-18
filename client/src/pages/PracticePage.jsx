import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const PracticePage = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const res = await axios.get("http://localhost:5000/api/questions");
      setQuestions(res.data);
    };
    fetchQuestions();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Practice Questions</h1>
      <div className="space-y-4">
        {questions.map((q) => (
          <Link to={`/solve/${q._id}`} key={q._id}>
            <div className="p-4 border rounded shadow hover:bg-gray-50">
              <h2 className="text-lg font-semibold">{q.title}</h2>
              <p className="text-sm text-gray-600">{q.difficulty}</p>
              <div className="flex gap-2 mt-2">
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
  );
};

export default PracticePage;
