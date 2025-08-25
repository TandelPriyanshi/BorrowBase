// server.js
import express from "express";
import session from "express-session";
import passport from "./auth.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

// Routes
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import borrowRoutes from "./routes/borrowRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import NotificationRoutes from "./routes/notificationRoutes.js";
import ReviewRoutes from "./routes/reviewRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(session({
  secret: "keyboard_cat",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use("/api", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", NotificationRoutes);
app.use("/api/reviews", ReviewRoutes);
app.use("/uploads", express.static("uploads"));

// Socket.IO
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_room", (chat_id) => {
    socket.join(`chat_${chat_id}`);
  });
  
  socket.on("send_message", (data) => {

    console.log("Socket message received:", data);
    io.to(data.chat_id).emit("receive_message", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });



  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
