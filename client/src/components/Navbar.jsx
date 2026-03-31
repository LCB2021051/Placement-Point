import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api";

export default function Navbar() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const title = params.get("title");
    if (title) setSearch(title);
  }, [location.search]);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
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

  if (!user) return null;

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      {/* Top bar */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="text-lg sm:text-xl font-bold whitespace-nowrap">
          Placement Point
        </Link>

        {/* Desktop search */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex items-center gap-2 flex-1 mx-6 max-w-lg"
        >
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded text-black text-sm focus:outline-none"
          />
          <button
            type="submit"
            className="bg-white text-blue-600 font-medium px-4 py-2 rounded text-sm hover:bg-gray-100"
          >
            Search
          </button>
        </form>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-4 whitespace-nowrap">
          <Link to="/" className="hover:underline text-sm">
            Dashboard
          </Link>
          <Link to="/search-jobs" className="hover:underline text-sm">
            Jobs
          </Link>
          <Link to="/ai/mock-interview" className="hover:underline text-sm">
            Interview
          </Link>
          <Link to="/practice" className="hover:underline text-sm">
            Practice
          </Link>
          {isAdmin && (
            <Link to="/admin" className="hover:underline text-sm">
              Admin
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-500 px-3 py-1.5 rounded text-sm hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Hamburger button (mobile) */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded hover:bg-blue-700 transition"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-blue-500 px-4 pb-4 pt-3 space-y-3">
          {/* Mobile search */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 rounded text-black text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="bg-white text-blue-600 font-medium px-4 py-2 rounded text-sm hover:bg-gray-100"
            >
              Search
            </button>
          </form>

          {/* Mobile nav links */}
          <div className="flex flex-col gap-1">
            <Link
              to="/"
              className="block px-3 py-2 rounded hover:bg-blue-700 transition text-sm"
            >
              Dashboard
            </Link>
            <Link
              to="/search-jobs"
              className="block px-3 py-2 rounded hover:bg-blue-700 transition text-sm"
            >
              Jobs
            </Link>
            <Link
              to="/ai/mock-interview"
              className="block px-3 py-2 rounded hover:bg-blue-700 transition text-sm"
            >
              Interview
            </Link>
            <Link
              to="/practice"
              className="block px-3 py-2 rounded hover:bg-blue-700 transition text-sm"
            >
              Practice
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="block px-3 py-2 rounded hover:bg-blue-700 transition text-sm"
              >
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="mt-2 w-full bg-red-500 px-3 py-2.5 rounded text-sm font-semibold hover:bg-red-600 active:bg-red-700 transition text-left"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
