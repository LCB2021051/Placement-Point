import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";

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
        fetch("http://localhost:5000/api/job/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/user/profile", {
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
    <div className="flex gap-6 p-6">
      {/* Left: Filters */}
      <div className="w-1/4 bg-white shadow p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Search Filters</h2>
        <input
          type="text"
          name="title"
          placeholder="Search by Title"
          value={filters.title}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border rounded mb-4"
        />
        <input
          type="text"
          name="department"
          placeholder="Filter by Department"
          value={filters.department}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border rounded mb-4"
        />
        <input
          type="number"
          name="minGPA"
          placeholder="Min GPA"
          value={filters.minGPA}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border rounded mb-4"
        />
        <button
          onClick={handleSearchClick}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          🔍 Search
        </button>
      </div>

      {/* Middle: Results */}
      <div className="w-2/4 bg-white">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Link key={job._id} to={`/job/${job._id}`}>
              <div className="border p-4 rounded-lg my-4 hover:shadow transition">
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-gray-700">{job.company}</p>
                <p className="text-sm text-gray-500">{job.description}</p>
                <p className="text-sm">🎓 Min GPA: {job.eligibility.minGPA}</p>
                <p className="text-sm">
                  🧾 Departments: {job.eligibility.department.join(", ")}
                </p>
                <p className="text-sm">
                  🎓 Batch: {job.eligibility.batch.join(", ")}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-gray-500">No jobs found matching your filters.</p>
        )}
      </div>

      {/* Right: Profile */}
      <div className="w-1/4 bg-white shadow p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">My Profile</h2>
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
          <p className="text-gray-500">Loading profile...</p>
        )}
      </div>
    </div>
  );
}
