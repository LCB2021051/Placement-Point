import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    eligibility: {
      minGPA: "",
      department: "",
      batch: "",
    },
  });

  const [jdFile, setJdFile] = useState(null);
  const [sheetLinks, setSheetLinks] = useState([""]);
  const [statusRoadmap, setStatusRoadmap] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["minGPA", "department", "batch"].includes(name)) {
      setForm({
        ...form,
        eligibility: { ...form.eligibility, [name]: value },
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    setJdFile(e.target.files[0]);
  };

  const handleLinkChange = (index, value) => {
    const updated = [...sheetLinks];
    updated[index] = value;
    setSheetLinks(updated);
  };

  const addLinkField = () => {
    setSheetLinks([...sheetLinks, ""]);
  };

  const removeLinkField = (index) => {
    const updated = sheetLinks.filter((_, i) => i !== index);
    setSheetLinks(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await user.getIdToken(true);
    const formData = new FormData();

    formData.append("title", form.title);
    formData.append("company", form.company);
    formData.append("description", form.description);
    formData.append("minGPA", form.eligibility.minGPA);
    formData.append("department", form.eligibility.department);
    formData.append("batch", form.eligibility.batch);
    formData.append("sheetLinks", JSON.stringify(sheetLinks));
    formData.append("statusRoadmap", statusRoadmap); // ✅ Add roadmap

    if (jdFile) formData.append("jd", jdFile);

    const res = await fetch("http://localhost:5000/api/job/post", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      alert("Job posted successfully!");
      navigate("/search-jobs");
    } else alert(data.message);
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-white shadow-xl rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        📄 Post a New Job
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Job Details */}
        <input
          name="title"
          placeholder="Job Title"
          className="w-full border rounded px-4 py-2"
          onChange={handleChange}
          required
        />
        <input
          name="company"
          placeholder="Company"
          className="w-full border rounded px-4 py-2"
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          className="w-full border rounded px-4 py-2"
          onChange={handleChange}
          rows={4}
          required
        />
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="w-full"
        />

        <hr className="my-6" />
        <h3 className="text-lg font-semibold">🎓 Eligibility</h3>
        <input
          name="minGPA"
          placeholder="Minimum GPA"
          className="w-full border rounded px-4 py-2"
          onChange={handleChange}
          required
        />
        <input
          name="department"
          placeholder="Departments"
          className="w-full border rounded px-4 py-2"
          onChange={handleChange}
          required
        />
        <input
          name="batch"
          placeholder="Batches"
          className="w-full border rounded px-4 py-2"
          onChange={handleChange}
          required
        />

        <hr className="my-6" />
        <h3 className="text-lg font-semibold">📎 Google Sheet Links</h3>

        {sheetLinks.map((link, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              type="url"
              placeholder={`Sheet Link #${idx + 1}`}
              value={link}
              onChange={(e) => handleLinkChange(idx, e.target.value)}
              className="flex-grow px-4 py-2 border rounded"
              required
            />
            {sheetLinks.length > 1 && (
              <button
                type="button"
                onClick={() => removeLinkField(idx)}
                className=" text-white px-3 rounded "
              >
                ❌
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addLinkField}
          className="text-blue-600 underline mb-4"
        >
          Add Another Link
        </button>

        <hr className="my-6" />
        <h3 className="text-lg font-semibold">📍 Hiring Process Roadmap</h3>
        <input
          type="text"
          placeholder="e.g. Applied, OA, Technical Interview, HR, Offer"
          value={statusRoadmap}
          onChange={(e) => setStatusRoadmap(e.target.value)}
          className="w-full border rounded px-4 py-2"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-700 text-white font-semibold py-2 rounded hover:bg-blue-800 transition"
        >
          ✅ Post Job
        </button>
      </form>
    </div>
  );
}
