const express = require("express");
const cors = require("cors");
const taskRoutes = require("./src/routes/taskRoutes");

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use("/api", taskRoutes);

// Root Endpoint
app.get("/", (req, res) => {
  res.status(200).send("API is running...");
});

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
