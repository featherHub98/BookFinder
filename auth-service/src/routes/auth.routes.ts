import { Router } from 'express';
import AuthController from '../controllers/Auth.controller';
import { authMiddleware } from '../middlewares/Auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/verify', authMiddleware, AuthController.verifyToken);
router.get('/user/:id', AuthController.getUserById);

router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

router.get('/me', authMiddleware, AuthController.getCurrentUser);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.post('/logout', AuthController.logout);
router.put('/password', authMiddleware, AuthController.changePassword);

export default router;
