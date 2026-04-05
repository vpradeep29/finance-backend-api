import { Response, NextFunction } from "express";
import prisma from "../config/db";
import { AuthRequest, Role } from "../middlewares/authMiddleware";

export const getDashboardSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const where: any = { isDeleted: false };

    // 🔐 Role-based filtering
    if (req.user?.role !== Role.ADMIN && req.user?.role !== Role.ANALYST) {
      where.userId = req.user?.id;
    } else if (req.query.userId) {
      where.userId = req.query.userId;
    }

    // 📊 Fetch all records
    const records = await prisma.record.findMany({
      where,
    });

    let totalIncome = 0;
    let totalExpense = 0;

    records.forEach((r: any) => {
      if (r.type === "INCOME") {
        totalIncome += r.amount;
      } else if (r.type === "EXPENSE") {
        totalExpense += r.amount;
      }
    });

    const netBalance = totalIncome - totalExpense;

    // 📊 Category Breakdown
    const categoryMap: any = {};

    records.forEach((r: any) => {
      const key = `${r.category}_${r.type}`;
      if (!categoryMap[key]) {
        categoryMap[key] = {
          category: r.category,
          type: r.type,
          total: 0,
        };
      }
      categoryMap[key].total += r.amount;
    });

    const categoryBreakdown = Object.values(categoryMap);

    // 🕒 Recent Transactions
    const recentRecords = await prisma.record.findMany({
      where,
      orderBy: { date: "desc" },
      take: 5,
    });

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