import { Router } from 'express';
import { createUser, getUsers, updateUser, deleteUser } from '../controllers/userController';
import { authenticate, requireRole, Role } from '../middlewares/authMiddleware';

const router = Router();

// Full CRUD on Users is restricted to Admin
router.use(authenticate);
router.use(requireRole([Role.ADMIN]));

router.post('/', createUser);
router.get('/', getUsers);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
