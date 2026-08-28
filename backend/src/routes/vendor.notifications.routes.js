import { Router } from "express";
import { authenticateVendor } from "../middleware/auth.middleware.js";
import { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification } from "../controllers/vendor.notifications.controller.js";

const router = Router();

router.use(authenticateVendor);

router.get("/",              getNotifications);
router.get("/unread-count",  getUnreadCount);
router.patch("/read-all",    markAllRead);
router.patch("/:id/read",    markRead);
router.delete("/:id",        deleteNotification);

export default router;
