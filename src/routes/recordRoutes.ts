import { Router } from 'express';
import { createRecord, getRecords, getRecordById, updateRecord, deleteRecord } from '../controllers/recordController';
import { authenticate, requireRole, Role } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate); // Require authentication for all record routes

// Only Admin can Create, Update, Delete records
router.post('/', requireRole([Role.ADMIN]), createRecord);
router.patch('/:id', requireRole([Role.ADMIN]), updateRecord);
router.delete('/:id', requireRole([Role.ADMIN]), deleteRecord);

// Analyst and Admin can read all records. Viewers cannot access line items.
router.get('/', requireRole([Role.ADMIN, Role.ANALYST]), getRecords);
router.get('/:id', requireRole([Role.ADMIN, Role.ANALYST]), getRecordById);

export default router;
