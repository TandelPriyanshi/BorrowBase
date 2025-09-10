import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Chat } from "../entities/Chat";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { ChatNotFoundError, UnauthorizedError, ValidationError } from "../utils/errors";
import { NotificationService } from "./NotificationService";

export class ChatService {
  private chatRepository: Repository<Chat>;
  private messageRepository: Repository<Message>;
  private userRepository: Repository<User>;
  private notificationService: NotificationService;

  constructor() {
    this.chatRepository = AppDataSource.getRepository(Chat);
    this.messageRepository = AppDataSource.getRepository(Message);
    this.userRepository = AppDataSource.getRepository(User);
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new chat or get existing chat between two users
   */
  async createOrGetChat(user1Id: number, user2Id: number): Promise<Chat> {
    if (user1Id === user2Id) {
      throw new ValidationError("Cannot create chat with yourself");
    }

    // Check if both users exist
    const user1 = await this.userRepository.findOne({ where: { id: user1Id } });
    const user2 = await this.userRepository.findOne({ where: { id: user2Id } });

    if (!user1 || !user2) {
      throw new ValidationError("One or both users not found");
    }

    // Try to find existing chat between the two users (order doesn't matter)
    let chat = await this.chatRepository
      .createQueryBuilder("chat")
      .where(
        "(chat.user1_id = :user1Id AND chat.user2_id = :user2Id) OR (chat.user1_id = :user2Id AND chat.user2_id = :user1Id)",
        { user1Id, user2Id }
      )
      .getOne();

    if (!chat) {
      // Create new chat
      chat = this.chatRepository.create({
        user1_id: Math.min(user1Id, user2Id), // Ensure consistent ordering
        user2_id: Math.max(user1Id, user2Id)
      });
      chat = await this.chatRepository.save(chat);
    }

    return chat;
  }

  /**
   * Get all chats for a user with other user information and last message
   */
  async getUserChats(userId: number): Promise<any[]> {
    const chats = await this.chatRepository
      .createQueryBuilder("chat")
      .leftJoinAndSelect("chat.user1", "user1")
      .leftJoinAndSelect("chat.user2", "user2")
      .where("chat.user1_id = :userId OR chat.user2_id = :userId", { userId })
      .andWhere("chat.status = :status", { status: "active" })
      .orderBy("chat.updated_at", "DESC")
      .getMany();

    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        // Determine the other user
        const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
        const otherUser = chat.user1_id === userId ? chat.user2 : chat.user1;

        // Get the last message
        const lastMessage = await this.messageRepository
          .createQueryBuilder("message")
          .where("message.chat_id = :chatId", { chatId: chat.id })
          .andWhere("message.is_deleted = :isDeleted", { isDeleted: false })
          .orderBy("message.created_at", "DESC")
          .getOne();

        // Get unread count for current user
        const unreadCount = await this.messageRepository
          .createQueryBuilder("message")
          .where("message.chat_id = :chatId", { chatId: chat.id })
          .andWhere("message.sender_id != :userId", { userId })
          .andWhere("message.is_read = :isRead", { isRead: false })
          .andWhere("message.is_deleted = :isDeleted", { isDeleted: false })
          .getCount();

        return {
          id: chat.id,
          user1_id: chat.user1_id,
          user2_id: chat.user2_id,
          subject: chat.subject,
          resource_id: chat.resource_id,
          status: chat.status,
          last_message: chat.last_message,
          last_message_at: chat.last_message_at,
          last_message_sender_id: chat.last_message_sender_id,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          otherUser: otherUser ? {
            id: otherUser.id,
            name: otherUser.name,
            avatar_url: otherUser.avatar_url
          } : null,
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            message_type: lastMessage.message_type,
            sender_id: lastMessage.sender_id,
            created_at: lastMessage.created_at
          } : null,
          unreadCount
        };
      })
    );

    return chatsWithDetails;
  }

  /**
   * Get messages for a specific chat
   */
  async getChatMessages(chatId: number, userId: number, page: number = 1, limit: number = 50): Promise<{
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    }
  }> {
    // Verify user has access to this chat
    const chat = await this.chatRepository
      .createQueryBuilder("chat")
      .where("chat.id = :chatId", { chatId })
      .andWhere("(chat.user1_id = :userId OR chat.user2_id = :userId)", { userId })
      .getOne();

    if (!chat) {
      throw new ChatNotFoundError("Chat not found or access denied");
    }

    // Get total count
    const total = await this.messageRepository
      .createQueryBuilder("message")
      .where("message.chat_id = :chatId", { chatId })
      .andWhere("message.is_deleted = :isDeleted", { isDeleted: false })
      .getCount();

    // Get messages with pagination (newest first, then reverse)
    const messages = await this.messageRepository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender")
      .where("message.chat_id = :chatId", { chatId })
      .andWhere("message.is_deleted = :isDeleted", { isDeleted: false })
      .orderBy("message.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Reverse to show oldest first in the current page
    messages.reverse();

    // Mark messages as read for the current user
    await this.markMessagesAsRead(chatId, userId);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Send a message in a chat
   */
  async sendMessage(chatId: number, senderId: number, content: string, messageType: string = "text"): Promise<Message> {
    if (!content || content.trim() === "") {
      throw new ValidationError("Message content cannot be empty");
    }

    // Verify user has access to this chat
    const chat = await this.chatRepository
      .createQueryBuilder("chat")
      .where("chat.id = :chatId", { chatId })
      .andWhere("(chat.user1_id = :senderId OR chat.user2_id = :senderId)", { senderId })
      .getOne();

    if (!chat) {
      throw new ChatNotFoundError("Chat not found or access denied");
    }

    // Create and save the message
    const message = this.messageRepository.create({
      chat_id: chatId,
      sender_id: senderId,
      content: content.trim(),
      message_type: messageType,
      is_read: false
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update chat's last message information
    await this.updateChatLastMessage(chatId, savedMessage);

    // Load the message with sender information
    const messageWithSender = await this.messageRepository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender")
      .where("message.id = :messageId", { messageId: savedMessage.id })
      .getOne();

    // Create notification for the recipient
    try {
      const recipientId = chat.user1_id === senderId ? chat.user2_id : chat.user1_id;
      await this.notificationService.createChatNotification(
        recipientId,
        chatId,
        senderId,
        content.trim()
      );
    } catch (error) {
      console.warn("Failed to create chat notification:", error);
      // Don't fail the message if notification creation fails
    }

    return messageWithSender!;
  }

  /**
   * Mark messages as read for a user in a chat
   */
  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    // Verify user has access to this chat
    const chat = await this.chatRepository
      .createQueryBuilder("chat")
      .where("chat.id = :chatId", { chatId })
      .andWhere("(chat.user1_id = :userId OR chat.user2_id = :userId)", { userId })
      .getOne();

    if (!chat) {
      throw new ChatNotFoundError("Chat not found or access denied");
    }

    // Mark all unread messages from other users as read
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ 
        is_read: true, 
        read_at: new Date() 
      })
      .where("chat_id = :chatId", { chatId })
      .andWhere("sender_id != :userId", { userId })
      .andWhere("is_read = :isRead", { isRead: false })
      .execute();

    // Update unread counts in chat
    await this.updateChatUnreadCounts(chatId);
  }

  /**
   * Get unread message count for a user across all chats
   */
  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await this.messageRepository
      .createQueryBuilder("message")
      .innerJoin("message.chat", "chat")
      .where("(chat.user1_id = :userId OR chat.user2_id = :userId)", { userId })
      .andWhere("message.sender_id != :userId", { userId })
      .andWhere("message.is_read = :isRead", { isRead: false })
      .andWhere("message.is_deleted = :isDeleted", { isDeleted: false })
      .getCount();

    return result;
  }

  /**
   * Update chat's last message information
   */
  private async updateChatLastMessage(chatId: number, message: Message): Promise<void> {
    await this.chatRepository
      .createQueryBuilder()
      .update(Chat)
      .set({
        last_message: message.content.substring(0, 500), // Truncate if too long
        last_message_at: message.created_at,
        last_message_sender_id: message.sender_id,
        updated_at: new Date()
      })
      .where("id = :chatId", { chatId })
      .execute();

    // Update unread counts
    await this.updateChatUnreadCounts(chatId);
  }

  /**
   * Update unread counts for both users in a chat
   */
  private async updateChatUnreadCounts(chatId: number): Promise<void> {
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (!chat) return;

    // Count unread messages for user1
    const user1UnreadCount = await this.messageRepository
      .createQueryBuilder("message")
      .where("message.chat_id = :chatId", { chatId })
      .andWhere("message.sender_id = :senderId", { senderId: chat.user2_id })
      .andWhere("message.is_read = :isRead", { isRead: false })
      .andWhere("message.is_deleted = :isDeleted", { isDeleted: false })
      .getCount();

    // Count unread messages for user2
    const user2UnreadCount = await this.messageRepository
      .createQueryBuilder("message")
      .where("message.chat_id = :chatId", { chatId })
      .andWhere("message.sender_id = :senderId", { senderId: chat.user1_id })
      .andWhere("message.is_read = :isRead", { isRead: false })
      .andWhere("message.is_deleted = :isDeleted", { isDeleted: false })
      .getCount();

    // Update chat with unread counts
    await this.chatRepository
      .createQueryBuilder()
      .update(Chat)
      .set({
        user1_has_unread: user1UnreadCount > 0,
        user1_unread_count: user1UnreadCount,
        user2_has_unread: user2UnreadCount > 0,
        user2_unread_count: user2UnreadCount
      })
      .where("id = :chatId", { chatId })
      .execute();
  }

  /**
   * Archive/unarchive a chat for a user
   */
  async toggleChatArchive(chatId: number, userId: number): Promise<void> {
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (!chat) {
      throw new ChatNotFoundError("Chat not found");
    }

    if (chat.user1_id !== userId && chat.user2_id !== userId) {
      throw new UnauthorizedError("Not authorized to modify this chat");
    }

    const updateData: any = {};
    if (chat.user1_id === userId) {
      updateData.user1_archived = !chat.user1_archived;
    } else {
      updateData.user2_archived = !chat.user2_archived;
    }

    await this.chatRepository
      .createQueryBuilder()
      .update(Chat)
      .set(updateData)
      .where("id = :chatId", { chatId })
      .execute();
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: number, userId: number): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ["chat"]
    });

    if (!message) {
      throw new ValidationError("Message not found");
    }

    // Only allow sender to delete their own message
    if (message.sender_id !== userId) {
      throw new UnauthorizedError("Can only delete your own messages");
    }

    // Soft delete
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({
        is_deleted: true,
        deleted_at: new Date()
      })
      .where("id = :messageId", { messageId })
      .execute();
  }
}
