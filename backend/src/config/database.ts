import { DataSource } from "typeorm";
import path from "path";

// Import all entities
import { User } from "../entities/User";
import { Resource } from "../entities/Resource";
import { ResourcePhoto } from "../entities/ResourcePhoto";
import { BorrowRequest } from "../entities/BorrowRequest";
import { Chat } from "../entities/Chat";
import { Message } from "../entities/Message";
import { Review } from "../entities/Review";
import { Notification } from "../entities/Notification";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "borrowbase.db",
  synchronize: true, // Only for development - will auto-create tables
  logging: process.env.NODE_ENV === "development",
  entities: [
    User,
    Resource,
    ResourcePhoto,
    BorrowRequest,
    Chat,
    Message,
    Review,
    Notification
  ],
  migrations: [
    path.join(__dirname, "../migrations/*.{ts,js}")
  ],
  subscribers: [
    path.join(__dirname, "../subscribers/*.{ts,js}")
  ]
});

export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ Database connection established successfully");
    }
    return AppDataSource;
  } catch (error) {
    console.error("❌ Error during database initialization:", error);
    throw error;
  }
};

export default AppDataSource;
