import { Response, NextFunction } from "express";
import prisma from "../config/db";
import { AuthRequest, Role } from "../middlewares/authMiddleware";

/**
 * GET /dashboard/summary
 * Returns financial summary: total income, total expense, net balance
 * Includes category breakdown and recent transactions
 * 
 * Permission:
 * - ADMIN/ANALYST: Can view all records or filter by userId via query param
 * - VIEWER: Can only view own records
 */
export const getDashboardSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // ❌ Type guard: ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    // 🔐 Build where clause based on role
    const where: any = { isDeleted: false };

    // If VIEWER, only show their own records
    // If ADMIN/ANALYST, show all records unless filtered by query userId
    if (req.user.role === Role.VIEWER) {
      where.userId = req.user.id;
    } else if (req.user.role === Role.ADMIN || req.user.role === Role.ANALYST) {
      // Allow filtering by userId if provided as query param
      if (req.query.userId && typeof req.query.userId === "string") {
        where.userId = req.query.userId;
      }
    }

    // 📊 Fetch all records matching the where clause
    const records = await prisma.record.findMany({
      where,
      orderBy: { date: "desc" },
    });

    // 💰 Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;

    records.forEach((record) => {
      if (record.type === "INCOME") {
        totalIncome += record.amount;
      } else if (record.type === "EXPENSE") {
        totalExpense += record.amount;
      }
    });

    const netBalance = totalIncome - totalExpense;

    // 📊 Category Breakdown (aggregated by category and type)
    const categoryMap: { [key: string]: any } = {};

    records.forEach((record) => {
      const key = `${record.category}_${record.type}`;
      if (!categoryMap[key]) {
        categoryMap[key] = {
          category: record.category,
          type: record.type,
          total: 0,
        };
      }
      categoryMap[key].total += record.amount;
    });

    const categoryBreakdown = Object.values(categoryMap);

    // 🕒 Recent Transactions (last 5)
    const recentRecords = await prisma.record.findMany({
      where,
      orderBy: { date: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        amount: true,
        category: true,
        date: true,
        description: true,
      },
    });

    // ✅ Return response
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          netBalance,
        },
        categoryBreakdown,
        recentRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};
