import { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";

export default function PostQuestion() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [tags, setTags] = useState("");
  const [testcases, setTestcases] = useState([
    { input: "", expectedOutput: "" },
  ]);

  const handleAddTestcase = () => {
    setTestcases([...testcases, { input: "", expectedOutput: "" }]);
  };

  const handleTestcaseChange = (index, field, value) => {
    const updated = [...testcases];
    updated[index][field] = value;
    setTestcases(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API_BASE_URL}/api/questions`, {
        title,
        description,
        difficulty,
        tags: tags.split(",").map((t) => t.trim()),
        testcases,
      });

      alert("Question posted successfully!");
      setTitle("");
      setDescription("");
      setDifficulty("Easy");
      setTags("");
      setTestcases([{ input: "", expectedOutput: "" }]);
    } catch (err) {
      console.error(err);
      alert("Error posting question");
    }
  };
  const handleRemoveTestcase = (index) => {
    setTestcases(testcases.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white p-4 sm:p-6 rounded-lg shadow">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">
          Post a New Question
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            required
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm h-32"
            required
          />

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
          />

          <div className="space-y-3">
            <h3 className="font-semibold text-sm sm:text-base">Test Cases</h3>
            {testcases.map((tc, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
              >
                <input
                  type="text"
                  placeholder="Input"
                  value={tc.input}
                  onChange={(e) =>
                    handleTestcaseChange(index, "input", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Expected Output"
                  value={tc.expectedOutput}
                  onChange={(e) =>
                    handleTestcaseChange(
                      index,
                      "expectedOutput",
                      e.target.value
                    )
                  }
                  className="flex-1 px-3 py-2 border rounded text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTestcase(index)}
                  className="text-red-600 hover:underline text-sm shrink-0 py-1"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddTestcase}
              className="text-blue-600 hover:underline text-sm"
            >
              + Add Test Case
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-blue-700 active:bg-blue-800 transition"
          >
            Submit Question
          </button>
        </form>
      </div>
    </div>
  );
}
