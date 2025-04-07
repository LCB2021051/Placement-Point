import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [latestJobs, setLatestJobs] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchProfileAndJobs = async () => {
      if (!user) {
        console.log("❌ No user found, skipping fetch");
        return;
      }
      console.log("🔐 Fetching profile & jobs...");

      const token = await user.getIdToken(true);

      const [profileRes, jobsRes] = await Promise.all([
        fetch("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/job/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        console.log("✅ Profile fetched:", profileData);
        setProfile(profileData);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        console.log("✅ Jobs fetched:", jobsData);
        setLatestJobs(jobsData.slice(0, 4)); // limit to 4
      }
    };

    fetchProfileAndJobs();
  }, [user]);

  // Automatically slide every 4 seconds if multiple jobs
  useEffect(() => {
    if (latestJobs.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % latestJobs.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [latestJobs]);

  // For alternating background colors
  const bgColors = [
    "bg-slate-200",
    "bg-slate-300",
    "bg-slate-200",
    "bg-slate-300",
  ];

  return (
    <div className="w-full">
      {/* Basic Profile Info */}
      <h1 className="text-2xl font-bold text-blue-600 mb-4 p-4">
        Welcome, {profile?.email || user?.email}
      </h1>
      {profile && (
        <div className="mb-6 text-gray-800 p-4">
          <p>
            <strong>Role:</strong> {profile.role}
          </p>
          <p>
            <strong>Department:</strong> {profile.department}
          </p>
          <p>
            <strong>Batch:</strong> {profile.batch}
          </p>
          <p>
            <strong>GPA:</strong> {profile.gpa}
          </p>
        </div>
      )}

      <h2 className="text-xl font-semibold text-gray-800 mb-2 p-4">
        🚀 Latest Job Openings
      </h2>

      {latestJobs.length > 0 ? (
        // Full-width container
        <div className="relative w-full overflow-hidden h-64">
          {/* Slideshow "track" */}
          <div
            className="whitespace-nowrap transition-transform duration-700 h-full"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {latestJobs.map((job, index) => (
              <div
                key={job._id}
                // Each slide has a different background color
                className={`inline-block w-full align-top h-full box-border p-6 ${
                  bgColors[index % bgColors.length]
                }`}
              >
                <h3 className="text-lg font-bold">{job.title}</h3>
                <p className="text-gray-700">{job.company}</p>
                <p className="text-sm text-gray-500 truncate mt-1 mb-2">
                  {job.description}
                </p>
                <p className="text-sm">🎓 Min GPA: {job.eligibility.minGPA}</p>
                <p className="text-sm">
                  🧾 Departments: {job.eligibility.department.join(", ")}
                </p>
                <Link
                  to={`/job/${job._id}`}
                  className="inline-block mt-3 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No jobs available at the moment.</p>
      )}
    </div>
  );
}
