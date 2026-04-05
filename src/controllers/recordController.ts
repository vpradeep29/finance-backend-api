import { Request, Response } from "express";
import prisma from "../config/db";
import { logAction } from "../services/auditService";

// 🔧 Helper to fix string | string[] issue
const getId = (id: string | string[]): string => {
  return Array.isArray(id) ? id[0] : id;
};

// ----------------------
// ➕ Create Record
// ----------------------
export const createRecord = async (req: Request, res: Response) => {
  try {
    const { type, amount, category, description } = req.body;

    const record = await prisma.record.create({
      data: {
        type,
        amount,
        category,
        description,
        userId: (req as any).user.id, // ✅ FIXED
      },
    });

    await logAction((req as any).user.id, "CREATE_RECORD", record.id); // ✅ FIXED

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: "Error creating record" });
  }
};

// ----------------------
// 📄 Get All Records
// ----------------------
export const getRecords = async (req: Request, res: Response) => {
  try {
    const { type, category, startDate, endDate } = req.query;

    const records = await prisma.record.findMany({
      where: {
        isDeleted: false,
        ...(type && { type: type as string }),
        ...(category && { category: category as string }),
        ...(startDate &&
          endDate && {
          date: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
          },
        }),
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Error fetching records" });
  }
};

// ----------------------
// 🔍 Get Single Record
// ----------------------
export const getRecordById = async (req: Request, res: Response) => {
  try {
    const id = getId(req.params.id);

    const record = await prisma.record.findUnique({
      where: { id },
    });

    if (!record || record.isDeleted) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Error fetching record" });
  }
};

// ----------------------
// ✏️ Update Record
// ----------------------
export const updateRecord = async (req: Request, res: Response) => {
  try {
    const id = getId(req.params.id);
    const { type, amount, category, description } = req.body;

    const existing = await prisma.record.findUnique({
      where: { id },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({ message: "Record not found" });
    }

    const updated = await prisma.record.update({
      where: { id },
      data: {
        type,
        amount,
        category,
        description,
      },
    });

    await logAction((req as any).user.id, "UPDATE_RECORD", id); // ✅ FIXED

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating record" });
  }
};

// ----------------------
// ❌ Delete Record (Soft Delete)
// ----------------------
export const deleteRecord = async (req: Request, res: Response) => {
  try {
    const id = getId(req.params.id);

    const existing = await prisma.record.findUnique({
      where: { id },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({ message: "Record not found" });
    }

    await prisma.record.update({
      where: { id },
      data: { isDeleted: true },
    });

    await logAction((req as any).user.id, "DELETE_RECORD", id); // ✅ FIXED

    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting record" });
  }
};