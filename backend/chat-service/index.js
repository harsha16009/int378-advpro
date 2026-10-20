require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const chatRoutes = require("./routes/chat.routes");
const errorMiddleware = require("./middleware/error.middleware");
const initSocket = require("./socket/socket");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

// Health endpoint for Prometheus, Docker & Kubernetes probes
app.get("/health", (req, res) => {
  res.json({ 
    status: "Chat Service is running", 
    service: "chat-service",
    mongoConnected: true
  });
});

app.get("/", (req, res) => res.json({ status: "Chat API Running" }));

// Mount routes at both /api/chat and /
app.use("/api/chat", chatRoutes);
app.use("/", chatRoutes);

// Error middleware
app.use(errorMiddleware);

// Connect MongoDB & Start server
connectDB();
const PORT = process.env.CHAT_PORT || process.env.PORT || 3007;
server.listen(PORT, () => {
  console.log(`💬 Real-Time Chat Service running on port ${PORT}`);
});
