import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompleteProfile from "./pages/CompleteProfile";
import PostJob from "./pages/PostJob";
import SearchJobs from "./pages/SearchJobs";
import Navbar from "./components/Navbar";
import JobDetails from "./pages/JobDetails";
import AIInterviewLanding from "./pages/AIInterviewLanding";
import MockInterview from "./pages/mockInterview";
import PracticePage from "./pages/PracticePage";
import SolvePage from "./pages/SolvePage";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/admin/post-job" element={<PostJob />} />
        <Route path="/search-jobs" element={<SearchJobs />} />
        <Route path="/job/:id" element={<JobDetails />} />
        <Route path="/ai/mock-interview" element={<AIInterviewLanding />} />
        <Route path="/mock-interview" element={<MockInterview />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/solve/:questionId" element={<SolvePage />} />
      </Routes>
    </Router>
  );
}

export default App;
