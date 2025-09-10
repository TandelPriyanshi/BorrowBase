import { Request, Response } from "express";
import { ChatService } from "../services/ChatService";
import { AuthenticatedRequest } from "../types/auth";
import { 
  ValidationError, 
  ChatNotFoundError, 
  UnauthorizedError,
  handleControllerError
} from "../utils/errors";
import { Server } from "socket.io";

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  /**
   * Get all chats for the authenticated user
   * GET /api/chats
   */
  async getChats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const chats = await this.chatService.getUserChats(req.user.id);

      res.json({
        data: chats,
        message: "Chats retrieved successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Create or get an existing chat between two users
   * POST /api/chats
   */
  async createOrGetChat(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      // Handle both formats: { other_user_id } and { user1_id, user2_id }
      const { other_user_id, user1_id, user2_id } = req.body;

      let otherUserId: number;
      if (other_user_id) {
        otherUserId = other_user_id;
      } else if (user1_id && user2_id) {
        // Determine which is the other user
        otherUserId = user1_id === req.user.id ? user2_id : user1_id;
      } else {
        res.status(400).json({
          message: "other_user_id is required",
          success: false
        });
        return;
      }

      if (!otherUserId || isNaN(Number(otherUserId))) {
        res.status(400).json({
          message: "Valid other_user_id is required",
          success: false
        });
        return;
      }

      if (Number(otherUserId) === req.user.id) {
        res.status(400).json({
          message: "Cannot create chat with yourself",
          success: false
        });
        return;
      }

      const chat = await this.chatService.createOrGetChat(req.user.id, Number(otherUserId));

      res.status(201).json({
        data: chat,
        message: "Chat created/retrieved successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Get messages for a specific chat
   * GET /api/chats/:id/messages
   */
  async getChatMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const { id } = req.params;
      const chatId = parseInt(id);

      if (isNaN(chatId)) {
        res.status(400).json({
          message: "Invalid chat ID",
          success: false
        });
        return;
      }

      // Get pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 messages per request

      const result = await this.chatService.getChatMessages(chatId, req.user.id, page, limit);

      res.json({
        data: result.messages,
        pagination: result.pagination,
        message: "Messages retrieved successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Send a message in a chat
   * POST /api/chats/:id/messages
   */
  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const { id } = req.params;
      const chatId = parseInt(id);

      if (isNaN(chatId)) {
        res.status(400).json({
          message: "Invalid chat ID",
          success: false
        });
        return;
      }

      const { content, message_type = "text" } = req.body;

      if (!content || typeof content !== "string" || content.trim() === "") {
        res.status(400).json({
          message: "Message content is required and cannot be empty",
          success: false
        });
        return;
      }

      if (content.trim().length > 2000) {
        res.status(400).json({
          message: "Message content cannot exceed 2000 characters",
          success: false
        });
        return;
      }

      const message = await this.chatService.sendMessage(chatId, req.user.id, content.trim(), message_type);

      // Emit the message to other users in the chat room via Socket.IO
      const io = req.app.get("io") as Server;
      if (io) {
        io.to(`chat_${chatId}`).emit("new_message", {
          id: message.id,
          chat_id: message.chat_id,
          sender_id: message.sender_id,
          content: message.content,
          message_type: message.message_type,
          created_at: message.created_at,
          sender: message.sender ? {
            id: message.sender.id,
            name: message.sender.name,
            avatar_url: message.sender.avatar_url
          } : null
        });
      }

      res.status(201).json({
        data: message,
        message: "Message sent successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Mark messages in a chat as read
   * PUT /api/chats/:id/read
   */
  async markMessagesAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const { id } = req.params;
      const chatId = parseInt(id);

      if (isNaN(chatId)) {
        res.status(400).json({
          message: "Invalid chat ID",
          success: false
        });
        return;
      }

      await this.chatService.markMessagesAsRead(chatId, req.user.id);

      res.json({
        message: "Messages marked as read",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Get unread message count for the user
   * GET /api/chats/unread-count
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const count = await this.chatService.getUnreadMessageCount(req.user.id);

      res.json({
        data: { unreadCount: count },
        message: "Unread count retrieved successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Toggle chat archive status
   * PUT /api/chats/:id/archive
   */
  async toggleChatArchive(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const { id } = req.params;
      const chatId = parseInt(id);

      if (isNaN(chatId)) {
        res.status(400).json({
          message: "Invalid chat ID",
          success: false
        });
        return;
      }

      await this.chatService.toggleChatArchive(chatId, req.user.id);

      res.json({
        message: "Chat archive status updated",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Delete a message
   * DELETE /api/messages/:id
   */
  async deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const { id } = req.params;
      const messageId = parseInt(id);

      if (isNaN(messageId)) {
        res.status(400).json({
          message: "Invalid message ID",
          success: false
        });
        return;
      }

      await this.chatService.deleteMessage(messageId, req.user.id);

      res.json({
        message: "Message deleted successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }
}
