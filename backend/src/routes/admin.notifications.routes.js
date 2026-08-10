import { Router } from "express";
import { authenticateAdmin } from "../middleware/admin.auth.middleware.js";
import {
    getNotifications,
    getUnreadCount,
    markRead,
    markAllRead,
    deleteNotification,
} from "../controllers/admin.notifications.controller.js";

const router = Router();
router.use(authenticateAdmin);

router.get("/",              getNotifications);
router.get("/unread-count",  getUnreadCount);
router.patch("/read-all",    markAllRead);
router.patch("/:id/read",    markRead);
router.delete("/:id",        deleteNotification);

export default router;
