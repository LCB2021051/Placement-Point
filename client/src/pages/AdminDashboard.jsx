import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Dashboard</h1>

        <div className="space-y-4">
          <Link
            to="/admin/post-job"
            className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Post a Job
          </Link>

          <Link
            to="/admin/post-question"
            className="block w-full text-center bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          >
            Post a Question
          </Link>
        </div>
      </div>
    </div>
  );
}
