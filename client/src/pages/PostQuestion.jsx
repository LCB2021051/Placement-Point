import { useState } from "react";
import axios from "axios";

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
      await axios.post("http://localhost:5000/api/questions", {
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
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Post a New Question</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border rounded h-32"
          required
        />

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="w-full px-4 py-2 border rounded"
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
          className="w-full px-4 py-2 border rounded"
        />

        <div className="space-y-2">
          <h3 className="font-semibold">Test Cases</h3>
          {testcases.map((tc, index) => (
            <div key={index} className="grid grid-cols-5 gap-2 items-center">
              <input
                type="text"
                placeholder="Input"
                value={tc.input}
                onChange={(e) =>
                  handleTestcaseChange(index, "input", e.target.value)
                }
                className="col-span-2 px-2 py-1 border rounded"
              />
              <input
                type="text"
                placeholder="Expected Output"
                value={tc.expectedOutput}
                onChange={(e) =>
                  handleTestcaseChange(index, "expectedOutput", e.target.value)
                }
                className="col-span-2 px-2 py-1 border rounded"
              />
              <button
                type="button"
                onClick={() => handleRemoveTestcase(index)}
                className="text-red-600 hover:underline text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddTestcase}
            className="text-blue-600 hover:underline"
          >
            + Add Test Case
          </button>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Question
        </button>
      </form>
    </div>
  );
}
