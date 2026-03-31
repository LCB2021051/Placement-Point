import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import API_BASE_URL from "../config/api";

export default function SearchJobs() {
  const { user } = useAuth();
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [filters, setFilters] = useState({
    title: "",
    department: "",
    minGPA: "",
  });
  const [filteredJobs, setFilteredJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const token = await user.getIdToken(true);

      const [jobsRes, profileRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/job/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const jobsData = await jobsRes.json();
      const profileData = await profileRes.json();

      setJobs(jobsData);
      setProfile(profileData);

      // 🌐 Apply navbar search query param (if any)
      const params = new URLSearchParams(location.search);
      const queryTitle = params.get("title") || "";

      const initialFiltered = jobsData.filter((job) =>
        job.title.toLowerCase().includes(queryTitle.toLowerCase())
      );

      setFilters((prev) => ({ ...prev, title: queryTitle }));
      setFilteredJobs(initialFiltered.length ? initialFiltered : jobsData);
    };

    fetchJobs();
  }, [user, location.search]);

  const handleSearchChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearchClick = () => {
    const results = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(filters.title.toLowerCase()) &&
        job.eligibility.department.some((dept) =>
          dept.toLowerCase().includes(filters.department.toLowerCase())
        ) &&
        job.eligibility.minGPA >= filters.minGPA
    );

    setFilteredJobs(results);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 max-w-6xl mx-auto">
        {/* Left: Filters */}
        <div className="w-full lg:w-1/4 bg-white shadow p-4 rounded-lg order-1">
          <h2 className="text-lg sm:text-xl font-semibold mb-3">
            Search Filters
          </h2>
          <input
            type="text"
            name="title"
            placeholder="Search by Title"
            value={filters.title}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border rounded text-sm mb-3"
          />
          <input
            type="text"
            name="department"
            placeholder="Filter by Department"
            value={filters.department}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border rounded text-sm mb-3"
          />
          <input
            type="number"
            name="minGPA"
            placeholder="Min GPA"
            value={filters.minGPA}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border rounded text-sm mb-3"
          />
          <button
            onClick={handleSearchClick}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 active:bg-blue-800"
          >
            Search
          </button>
        </div>

        {/* Middle: Results */}
        <div className="w-full lg:w-2/4 order-2">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <Link key={job._id} to={`/job/${job._id}`}>
                <div className="bg-white border p-4 rounded-lg mb-3 hover:shadow transition">
                  <h3 className="font-semibold text-sm sm:text-base">
                    {job.title}
                  </h3>
                  <p className="text-gray-700 text-sm">{job.company}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm">
                    <p>Min GPA: {job.eligibility.minGPA}</p>
                    <p>Dept: {job.eligibility.department.join(", ")}</p>
                    <p>Batch: {job.eligibility.batch.join(", ")}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-sm bg-white p-4 rounded-lg">
              No jobs found matching your filters.
            </p>
          )}
        </div>

        {/* Right: Profile */}
        <div className="w-full lg:w-1/4 bg-white shadow p-4 rounded-lg order-3">
          <h2 className="text-lg sm:text-xl font-semibold mb-3">My Profile</h2>
          {profile ? (
            <div className="space-y-2 text-sm text-gray-800">
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
            <p className="text-gray-500 text-sm">Loading profile...</p>
          )}
        </div>
      </div>
    </div>
  );
}
