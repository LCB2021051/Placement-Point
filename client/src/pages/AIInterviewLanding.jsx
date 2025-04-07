import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AIInterviewLanding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [formData, setFormData] = useState({
    role: "",
    experience: "",
    topics: "",
  });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await user.getIdToken(true);
      const res = await fetch("http://localhost:5000/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProfile(data);
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStartInterview = async () => {
    const token = await user.getIdToken(true);
    const formUpload = new FormData();

    formUpload.append("role", formData.role);
    formUpload.append("experience", formData.experience);
    formUpload.append("topics", formData.topics);
    if (resume) formUpload.append("resumePdf", resume);
    if (jdFile) formUpload.append("jdPdf", jdFile);

    const res = await fetch(
      "http://localhost:5000/api/interview/generate-questions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formUpload,
      }
    );

    const data = await res.json();
    navigate("/mock-interview", { state: { questions: data.questions } });
  };

  return (
    <div className="flex gap-6 p-6">
      {/* LEFT: Input Form */}
      <div className="w-1/4 bg-white shadow p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Interview Setup</h2>

        <label className="text-sm block mb-1">Upload Resume (PDF)</label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setResume(e.target.files[0])}
          className="mb-4 w-full"
        />

        <label className="text-sm block mb-1">
          Upload Job Description (PDF)
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setJdFile(e.target.files[0])}
          className="mb-4 w-full"
        />

        <input
          type="text"
          name="role"
          placeholder="Job Role (e.g. SDE Intern)"
          value={formData.role}
          onChange={handleChange}
          className="mb-4 w-full border px-2 py-1 rounded"
        />
        <input
          type="text"
          name="experience"
          placeholder="Experience (e.g. 0-1 years)"
          value={formData.experience}
          onChange={handleChange}
          className="mb-4 w-full border px-2 py-1 rounded"
        />
        <input
          type="text"
          name="topics"
          placeholder="Topics (comma separated)"
          value={formData.topics}
          onChange={handleChange}
          className="mb-4 w-full border px-2 py-1 rounded"
        />

        <button
          onClick={handleStartInterview}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Start Mock Interview 🎥
        </button>
      </div>

      {/* MIDDLE: What to Expect */}
      <div className="w-2/4 bg-white shadow p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">What to Expect</h2>
        <ul className="list-disc ml-5 text-gray-700 text-sm space-y-1">
          <li>AI generates 10–15 interview questions</li>
          <li>You get 10 seconds to read each question</li>
          <li>You answer via video or text in 30 seconds</li>
          <li>Feedback will be provided at the end</li>
        </ul>
      </div>

      {/* RIGHT: Profile */}
      <div className="w-1/4 bg-white shadow p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">My Profile</h2>
        {profile ? (
          <div className="text-sm space-y-1">
            <p>
              <strong>Email:</strong> {profile.email}
            </p>
            <p>
              <strong>Role:</strong> {profile.role}
            </p>
            <p>
              <strong>GPA:</strong> {profile.gpa}
            </p>
            <p>
              <strong>Department:</strong> {profile.department}
            </p>
            <p>
              <strong>Batch:</strong> {profile.batch}
            </p>
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
      </div>
    </div>
  );
}
