import { Router } from "express";
import { ChatController } from "../controllers/ChatController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const chatController = new ChatController();

/**
 * Chat Routes
 */

// Get unread message count (should be first to avoid conflict with :id)
router.get("/unread-count", authenticateToken, (req, res) => {
  chatController.getUnreadCount(req, res);
});

// Get all chats for the authenticated user
router.get("/", authenticateToken, (req, res) => {
  chatController.getChats(req, res);
});

// Create or get an existing chat between two users
router.post("/", authenticateToken, (req, res) => {
  chatController.createOrGetChat(req, res);
});

// Get messages for a specific chat
router.get("/:id/messages", authenticateToken, (req, res) => {
  chatController.getChatMessages(req, res);
});

// Send a message in a chat
router.post("/:id/messages", authenticateToken, (req, res) => {
  chatController.sendMessage(req, res);
});

// Mark messages in a chat as read
router.put("/:id/read", authenticateToken, (req, res) => {
  chatController.markMessagesAsRead(req, res);
});

// Toggle chat archive status
router.put("/:id/archive", authenticateToken, (req, res) => {
  chatController.toggleChatArchive(req, res);
});

/**
 * Message Routes
 */

// Delete a message (separate route for clarity)
router.delete("/messages/:id", authenticateToken, (req, res) => {
  chatController.deleteMessage(req, res);
});

export default router;
