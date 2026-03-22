// server/server.js
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/user");
const jobRoutes = require("./routes/job");
const interviewRoutes = require("./routes/interview");
const questionRoutes = require("./routes/question");
const codeRunner = require("./routes/codeRunner");
const solutionRoutes = require("./routes/solution");
const initSocket = require("./socket");

const app = express();
const server = http.createServer(app); // <— HTTP server for Socket.io
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo error:", err));

app.get("/", (_, res) => res.send("API running"));
app.use("/api/user", userRoutes);
app.use("/api/job", jobRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/run", codeRunner);
app.use("/api/solutions", solutionRoutes);

initSocket(server); // 🔌 attach Socket.io
server.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
