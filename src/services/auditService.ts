import prisma from '../config/db';

export const logAction = async (userId: string, action: string, recordId?: string, details?: any) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        recordId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};
