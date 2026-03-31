import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import API_BASE_URL from "../config/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [latestJobs, setLatestJobs] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchProfileAndJobs = async () => {
      if (!user) {
        return;
      }

      const token = await user.getIdToken(true);

      const [profileRes, jobsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/job/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
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
    <div className="w-full min-h-screen bg-gray-50">
      <div className="px-3 sm:px-6 py-4">
        <h1 className="text-xl sm:text-2xl font-bold text-blue-600 mb-3">
          Welcome, {profile?.email || user?.email}
        </h1>
        {profile && (
          <div className="mb-6 text-gray-800 text-sm sm:text-base grid grid-cols-2 gap-1 sm:flex sm:gap-6">
            <p>
              <strong>Role:</strong> {profile.role}
            </p>
            <p>
              <strong>Dept:</strong> {profile.department}
            </p>
            <p>
              <strong>Batch:</strong> {profile.batch}
            </p>
            <p>
              <strong>GPA:</strong> {profile.gpa}
            </p>
          </div>
        )}

        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">
          Latest Job Openings
        </h2>
      </div>

      {latestJobs.length > 0 ? (
        <div className="relative w-full overflow-hidden h-56 sm:h-64">
          <div
            className="whitespace-nowrap transition-transform duration-700 h-full"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {latestJobs.map((job, index) => (
              <div
                key={job._id}
                className={`inline-block w-full align-top h-full box-border px-4 py-4 sm:p-6 ${
                  bgColors[index % bgColors.length]
                }`}
              >
                <h3 className="text-base sm:text-lg font-bold truncate">
                  {job.title}
                </h3>
                <p className="text-gray-700 text-sm sm:text-base">
                  {job.company}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 truncate mt-1 mb-2">
                  {job.description}
                </p>
                <p className="text-xs sm:text-sm">
                  Min GPA: {job.eligibility.minGPA}
                </p>
                <p className="text-xs sm:text-sm truncate">
                  Departments: {job.eligibility.department.join(", ")}
                </p>
                <Link
                  to={`/job/${job._id}`}
                  className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 active:bg-blue-800 transition"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 px-4">No jobs available at the moment.</p>
      )}
    </div>
  );
}
