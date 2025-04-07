import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const title = params.get("title");
    if (title) setSearch(title);
  }, [location.search]);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5000/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIsAdmin(data?.role === "admin");
    };

    checkRole();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search-jobs?title=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow-md">
      {/* Left: Brand */}
      <Link to="/" className="text-xl font-bold whitespace-nowrap">
        Placement Point
      </Link>

      {/* Middle: Search */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center gap-2 mx-8 flex-1 justify-center"
      >
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded text-black focus:outline-none"
        />
        <button
          type="submit"
          className="bg-white text-blue-600 font-medium px-4 py-2 rounded hover:bg-gray-100"
        >
          Search
        </button>
      </form>

      {/* Right: Navigation */}
      <div className="space-x-4 flex items-center whitespace-nowrap">
        <Link to="/" className="hover:underline">
          Dashboard
        </Link>
        <Link to="/search-jobs" className="hover:underline">
          Jobs
        </Link>
        <Link to="/ai/mock-interview" className="hover:underline">
          interview
        </Link>

        {isAdmin && (
          <Link to="/admin/post-job" className="hover:underline">
            Admin
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
