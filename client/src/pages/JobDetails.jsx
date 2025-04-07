import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function JobDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState({
    applied: false,
    status: null,
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = await user.getIdToken(true);

        const res = await fetch(`http://localhost:5000/api/job/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Job not found");

        const jobData = await res.json();
        setJob(jobData);
        setLoading(false);

        const sheetLink = jobData.sheetLinks?.[0];
        if (sheetLink && user?.email) {
          const statusRes = await fetch(
            "http://localhost:5000/api/job/status",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ email: user.email, sheetUrl: sheetLink }),
            }
          );

          const data = await statusRes.json();
          setApplicationStatus(data);
        }
      } catch (err) {
        console.error("Error:", err.message);
        navigate("/search-jobs");
      }
    };

    fetchJob();
  }, [id, user, navigate]);

  if (loading || !job) return <div className="p-8 text-lg">Loading job...</div>;

  const [applyLink, ...otherLinks] = job.sheetLinks || [];
  const roadmap = job.statusRoadmap || [];
  const jobCurrent = (job.currentStatus || "").toLowerCase().trim();

  const { applied, status } = applicationStatus;
  const studentStatus = (status || "").toLowerCase().trim();
  const isRejected = studentStatus.includes("reject");

  const jobIndex = roadmap.findIndex(
    (step) => step.toLowerCase().trim() === jobCurrent
  );

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto bg-white  p-10">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 border-b pb-6">
          <div>
            <h1 className="text-4xl font-bold text-blue-700 mb-1">
              {job.title}
            </h1>
            <p className="text-2xl text-gray-800 font-semibold">
              {job.company}
            </p>
          </div>

          <div className="mt-4 sm:mt-0">
            {applied ? (
              isRejected ? (
                <span className="inline-block px-5 py-2 rounded-full font-medium text-sm bg-red-100 text-red-800">
                  📌 Status: {status}
                </span>
              ) : (
                <span className="inline-block px-5 py-2 rounded-full font-medium text-sm bg-green-100 text-green-800">
                  📌 Status: {status}
                </span>
              )
            ) : (
              <span className="inline-block px-5 py-2 rounded-full font-medium text-sm bg-gray-100 text-gray-600">
                🕐 Not Applied Yet
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-700 text-md mb-8 leading-relaxed">
          {job.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border mb-10">
          <div>
            <strong>🎓 Min GPA:</strong> {job.eligibility.minGPA}
          </div>
          <div>
            <strong>📚 Departments:</strong>{" "}
            {job.eligibility.department.join(", ")}
          </div>
          <div>
            <strong>🎓 Batch:</strong> {job.eligibility.batch.join(", ")}
          </div>
          <div>
            <strong>📅 Posted:</strong>{" "}
            {new Date(job.postedAt).toLocaleDateString()}
          </div>
        </div>

        {roadmap.length > 0 && (
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Hiring Process
            </h3>
            {applied && isRejected ? (
              <div className="text-red-600 font-semibold">
                ❌ Your application has been{" "}
                <span className="underline">rejected</span>.
              </div>
            ) : (
              <div className="flex items-center overflow-x-auto py-3">
                {roadmap.map((step, idx) => {
                  const isDone = idx < jobIndex;
                  const isCurrent = idx === jobIndex;
                  return (
                    <div key={idx} className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm border mr-2
                          ${
                            isDone
                              ? "bg-green-500 text-white border-green-500"
                              : isCurrent
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-gray-200 text-gray-600 border-gray-300"
                          }`}
                      >
                        {idx + 1}
                      </div>
                      <span
                        className={`mr-2 text-xs ${
                          isDone
                            ? "text-green-700"
                            : isCurrent
                            ? "text-blue-700 font-semibold"
                            : "text-gray-500"
                        }`}
                      >
                        {step}
                      </span>
                      {idx < roadmap.length - 1 && (
                        <div
                          className={`w-8 h-1 bg-gray-300 mx-2 ${
                            isDone
                              ? "bg-green-500 text-white border-green-500"
                              : isCurrent
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-gray-200 text-gray-600 border-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {job.jd && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📄 Job Description:
            </h3>
            <a
              href={job.jd}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-100 text-blue-800 px-6 py-2 rounded hover:bg-blue-200 transition"
            >
              🔍 View JD PDF
            </a>
          </div>
        )}

        {job.open && applyLink && (
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ✅ Apply Now:
            </h3>
            <a
              href={applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-100 text-green-800 px-6 py-2 rounded hover:bg-green-200 transition"
            >
              📝 Open Application Form
            </a>
          </div>
        )}

        {otherLinks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📎 Additional Resources:
            </h3>
            <div className="flex flex-col gap-3">
              {otherLinks.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gray-100 text-gray-800 px-6 py-2 rounded hover:bg-gray-200 transition"
                >
                  🌐 Resource {index + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
