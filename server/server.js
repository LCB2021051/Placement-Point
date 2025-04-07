const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/user");
const jobRoutes = require("./routes/job");
const interviewRoutes = require("./routes/interview");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err));

app.get("/", (req, res) => res.send("API running"));
app.use("/api/user", userRoutes);
app.use("/api/job", jobRoutes);
app.use("/api/interview", interviewRoutes);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
