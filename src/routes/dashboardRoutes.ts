import { Router, Request, Response } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { getDashboardSummary } from "../controllers/dashboardController";

const router = Router();

// ✅ PUBLIC TEST ROUTE (NO AUTH REQUIRED)
router.get("/test", (req: Request, res: Response) => {
    res.status(200).json({ message: "Dashboard route working ✅" });
});

// 🔐 PROTECTED ROUTE (REQUIRES AUTHENTICATION)
router.get("/summary", authenticate, getDashboardSummary);

export default router;