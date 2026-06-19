import { Router } from 'express';
import { register, login, refreshToken, logout, forgotPassword, resetPassword } from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
