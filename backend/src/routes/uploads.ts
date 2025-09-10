import express from "express";
import { ResourceController } from "../controllers/ResourceController";

const router = express.Router();
const resourceController = new ResourceController();

/**
 * GET /uploads/resources/:filename
 * Serve uploaded resource photos
 */
router.get("/resources/:filename", resourceController.servePhoto);

export default router;
