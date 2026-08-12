import { Router } from "express";
import { submitContact } from "../controllers/public.contact.controller.js";

const router = Router();
router.post("/", submitContact);

export default router;
