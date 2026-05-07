import express from 'express';
import { register, login, getMe, logout, changePassword, verifyAdmin } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';

const router = express.Router();

// Register: first user is public (becomes admin), rest need auth
// The controller handles this logic — we conditionally apply `protect`
router.post('/register', async (req, res, next) => {
    const User = (await import('../models/User.js')).default;
    const userCount = await User.countDocuments();

    if (userCount === 0) {
        // First user, no auth needed
        return validate(registerSchema)(req, res, next);
    } else {
        // Subsequent users require auth
        return protect(req, res, () => validate(registerSchema)(req, res, next));
    }
}, register);

router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/change-password', protect, changePassword);
router.post('/verify-admin', protect, verifyAdmin);

export default router;