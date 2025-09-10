import "reflect-metadata";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { initializeDatabase } from "./config/database";
import apiRoutes from "./routes/index";
import { NotificationManager } from "./services/NotificationManager";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// CORS configuration - Allow all origins for development
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, Postman, curl)
            if (!origin) return callback(null, true);

            // For development, allow any localhost origin
            if (origin.includes("localhost")) {
                return callback(null, true);
            }

            // Allow other origins as needed
            callback(null, true);
        },
        credentials: true, // Enable credentials
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    })
);

// Socket.IO with CORS
const io = new Server(httpServer, {
    cors: {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (origin.includes("localhost")) {
                return callback(null, true);
            }
            callback(null, true);
        },
        credentials: true,
    },
});

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security headers
app.use((req, res, next) => {
    res.header("X-Content-Type-Options", "nosniff");
    res.header("X-Frame-Options", "DENY");
    res.header("X-XSS-Protection", "1; mode=block");
    next();
});

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Create notification manager
const notificationManager = new NotificationManager(io);

// API Routes
app.use("/api", apiRoutes);

// Error handling middleware (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // Handle joining chat rooms
    socket.on("join_chat", (chatId) => {
        socket.join(`chat_${chatId}`);
        console.log(`💬 Socket ${socket.id} joined chat ${chatId}`);
    });

    // Handle leaving chat rooms
    socket.on("leave_chat", (chatId) => {
        socket.leave(`chat_${chatId}`);
        console.log(`👋 Socket ${socket.id} left chat ${chatId}`);
    });

    // Handle new messages (legacy - no longer used as ChatController handles emission)
    // socket.on("send_message", (data) => {
    //   console.log("📨 New message received:", data);
    //   // Broadcast to all other users in the chat room
    //   socket.to(`chat_${data.chatId}`).emit("new_message", data.message);
    // });

    // Handle user room joining for notifications
    socket.on("join_user_room", (userId) => {
        if (typeof userId === "number") {
            notificationManager.handleUserConnection(socket, userId);
        }
    });

    // Handle leaving user rooms
    socket.on("leave_user_room", (userId) => {
        if (typeof userId === "number") {
            notificationManager.handleUserDisconnection(socket, userId);
        }
    });

    // Handle notification-related events
    socket.on("mark_notification_read", async (data) => {
        if (data.userId && data.notificationId) {
            await notificationManager.notifyNotificationRead(
                data.userId,
                data.notificationId
            );
        }
    });

    // Handle test notification request
    socket.on("send_test_notification", async (data) => {
        if (data.userId) {
            await notificationManager.sendTestNotification(data.userId);
        }
    });

    // Handle typing indicators
    socket.on("typing_start", (data) => {
        socket.to(`chat_${data.chatId}`).emit("user_typing", {
            userId: data.userId,
            chatId: data.chatId,
            isTyping: true,
        });
    });

    socket.on("typing_stop", (data) => {
        socket.to(`chat_${data.chatId}`).emit("user_typing", {
            userId: data.userId,
            chatId: data.chatId,
            isTyping: false,
        });
    });

    // Handle read receipts
    socket.on("message_read", (data) => {
        socket.to(`chat_${data.chatId}`).emit("message_read_receipt", {
            messageId: data.messageId,
            readBy: data.userId,
            readAt: new Date(),
        });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("🔌 Socket disconnected:", socket.id);
    });
});

// Make io and notification manager accessible to other parts of the app
app.set("io", io);
app.set("notificationManager", notificationManager);

// Basic route
app.get("/", (req, res) => {
    res.json({
        message: "BorrowBase Neighborhood Resource Exchange API",
        version: "1.0.0",
        status: "running",
        features: ["Real-time chat", "Socket.IO", "TypeORM"],
        endpoints: {
            auth: "/api/auth",
            profile: "/api/profile",
            health: "/api/health",
            chats: "/api/chats",
            resources: "/api/resources",
        },
    });
});

// Start server function
const startServer = async () => {
    try {
        // Initialize database
        await initializeDatabase();
        console.log("🔧 Database initialized");

        // Start HTTP server with Socket.IO
        httpServer.listen(PORT, () => {
            console.log("🚀 BorrowBase API Server started successfully!");
            console.log(`📡 Server running on http://localhost:${PORT}`);
            console.log(
                `🔗 API endpoints available at http://localhost:${PORT}/api`
            );
            console.log(`💬 Socket.IO enabled for real-time chat`);
            console.log(`💾 Using SQLite Database with TypeORM`);
            console.log(`🏗️  Architecture: MVC with Services pattern`);
            console.log("");
            console.log("📋 Available API Routes:");
            console.log("");
            console.log("🔐 Authentication:");
            console.log("   POST /api/auth/register     - Register new user");
            console.log("   POST /api/auth/login        - Login user");
            console.log(
                "   POST /api/auth/refresh      - Refresh access token"
            );
            console.log("   GET  /api/profile           - Get user profile");
            console.log("   PUT  /api/profile           - Update user profile");
            console.log("   POST /api/auth/logout       - Logout user");
            console.log("");
            console.log("📦 Resources:");
            console.log(
                "   GET  /api/resources         - Get all resources (with filters)"
            );
            console.log("   GET  /api/resources/:id     - Get resource by ID");
            console.log("   POST /api/resources         - Create new resource");
            console.log("   PUT  /api/resources/:id     - Update resource");
            console.log("   DELETE /api/resources/:id   - Delete resource");
            console.log(
                "   GET  /api/my-resources      - Get user's resources"
            );
            console.log("");
            console.log("💬 Chat:");
            console.log("   GET  /api/chats             - Get user's chats");
            console.log("   POST /api/chats             - Create/get chat");
            console.log("   GET  /api/chats/:id/messages - Get chat messages");
            console.log("   POST /api/chats/:id/messages - Send message");
            console.log(
                "   PUT  /api/chats/:id/read    - Mark messages as read"
            );
            console.log("   GET  /api/chats/unread-count - Get unread count");
            console.log("");
            console.log("🔌 Socket.IO Events:");
            console.log(
                "   join_chat, leave_chat       - Chat room management"
            );
            console.log("   send_message, new_message   - Real-time messaging");
            console.log("   typing_start, typing_stop   - Typing indicators");
            console.log("   message_read               - Read receipts");
            console.log("   join_user_room             - User notifications");
            console.log("");
            console.log("✅ Server is ready to handle requests!");
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("💥 Uncaught Exception:", error);
    process.exit(1);
});

process.on("unhandledRejection", (error) => {
    console.error("💥 Unhandled Rejection:", error);
    process.exit(1);
});

// Start the server
startServer();
