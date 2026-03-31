import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

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
  const [loading, setLoading] = useState(false); // 👈 add loading state

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await user.getIdToken(true);
      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
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
    setLoading(true); // disable button
    try {
      const token = await user.getIdToken(true);
      const formUpload = new FormData();

      formUpload.append("role", formData.role);
      formUpload.append("experience", formData.experience);
      formUpload.append("topics", formData.topics);
      if (resume) formUpload.append("resumePdf", resume);
      if (jdFile) formUpload.append("jdPdf", jdFile);

      const res = await fetch(
        `${API_BASE_URL}/api/interview/generate-questions`,
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
    } catch (err) {
      console.error("❌ Error starting interview:", err);
      setLoading(false); // re-enable on failure
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 max-w-6xl mx-auto">
        {/* LEFT: Input Form */}
        <div className="w-full lg:w-1/3 bg-white shadow p-4 sm:p-5 rounded-lg order-1">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Interview Setup
          </h2>

          <label className="text-sm block mb-1 font-medium">
            Upload Resume (PDF)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setResume(e.target.files[0])}
            className="mb-3 w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
          />

          <label className="text-sm block mb-1 font-medium">
            Upload Job Description (PDF)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setJdFile(e.target.files[0])}
            className="mb-3 w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
          />

          <input
            type="text"
            name="role"
            placeholder="Job Role (e.g. SDE Intern)"
            value={formData.role}
            onChange={handleChange}
            className="mb-3 w-full border px-3 py-2 rounded text-sm"
          />
          <input
            type="text"
            name="experience"
            placeholder="Experience (e.g. 0-1 years)"
            value={formData.experience}
            onChange={handleChange}
            className="mb-3 w-full border px-3 py-2 rounded text-sm"
          />
          <input
            type="text"
            name="topics"
            placeholder="Topics (comma separated)"
            value={formData.topics}
            onChange={handleChange}
            className="mb-4 w-full border px-3 py-2 rounded text-sm"
          />

          <button
            onClick={handleStartInterview}
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white text-sm font-semibold ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 active:bg-green-800"
            }`}
          >
            {loading ? "Generating Questions..." : "Start Mock Interview"}
          </button>
        </div>

        {/* MIDDLE: What to Expect */}
        <div className="w-full lg:w-1/3 bg-white shadow p-4 sm:p-5 rounded-lg order-3 lg:order-2">
          <h2 className="text-lg sm:text-xl font-semibold mb-3">
            What to Expect
          </h2>
          <ul className="list-disc ml-5 text-gray-700 text-sm space-y-2">
            <li>AI generates 10-15 interview questions</li>
            <li>You get 10 seconds to read each question</li>
            <li>You answer via video or text in 30 seconds</li>
            <li>Feedback will be provided at the end</li>
          </ul>
        </div>

        {/* RIGHT: Profile */}
        <div className="w-full lg:w-1/3 bg-white shadow p-4 sm:p-5 rounded-lg order-2 lg:order-3">
          <h2 className="text-lg sm:text-xl font-semibold mb-3">My Profile</h2>
          {profile ? (
            <div className="text-sm space-y-2">
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
            <p className="text-sm text-gray-500">Loading profile...</p>
          )}
        </div>
      </div>
    </div>
  );
}
