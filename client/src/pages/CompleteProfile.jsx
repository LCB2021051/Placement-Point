import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CompleteProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    gpa: "",
    department: "",
    batch: "",
    role: "student",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Force a fresh token, to avoid "Invalid token" if it's expired
      const token = await user.getIdToken(true);

      const res = await fetch("http://localhost:5000/api/user/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        // If profile saved, go to home
        navigate("/");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Profile submission error:", err);
      alert("Something went wrong. Please try again or log in again.");
      navigate("/login");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 shadow-md rounded bg-white">
      <h2 className="text-xl font-bold mb-4">Complete Your Profile</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="gpa"
          placeholder="GPA"
          className="w-full mb-3 px-4 py-2 border rounded"
          onChange={handleChange}
        />
        <input
          name="department"
          placeholder="Department"
          className="w-full mb-3 px-4 py-2 border rounded"
          onChange={handleChange}
        />
        <input
          name="batch"
          placeholder="Batch Year"
          className="w-full mb-3 px-4 py-2 border rounded"
          onChange={handleChange}
        />
        <select
          name="role"
          className="w-full mb-3 px-4 py-2 border rounded"
          onChange={handleChange}
        >
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
