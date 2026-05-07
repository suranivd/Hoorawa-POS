import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public for first user (becomes admin), then Admin-only
 */
export const register = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    // First user in system becomes admin automatically
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // Only admins can create other users (after first user)
    if (!isFirstUser) {
        if (!req.user) {
            res.status(401);
            throw new Error('Not authorized. Only existing admins can register new users.');
        }
        if (req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Only admins can register new users');
        }
    }

    const user = await User.create({
        firstName,
        lastName,
        email,
        phone,
        password,
        role: isFirstUser ? 'admin' : (role || 'staff'),
        createdBy: req.user?._id,
    });

    if (user) {
        res.status(201).json({
            success: true,
            message: isFirstUser
                ? 'Admin account created successfully. Please login.'
                : 'User registered successfully',
            data: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Explicitly include password (because select: false on model)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked()) {
        const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000);
        res.status(423);
        throw new Error(`Account locked. Try again in ${minutesLeft} minute(s).`);
    }

    // Check if deactivated
    if (!user.isActive) {
        res.status(403);
        throw new Error('Account is deactivated. Contact admin.');
    }

    // Verify password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        user.failedLoginAttempts += 1;

        if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
            user.lockedUntil = Date.now() + LOCK_TIME_MINUTES * 60 * 1000;
            await user.save();
            res.status(423);
            throw new Error(`Account locked due to too many failed attempts. Try again in ${LOCK_TIME_MINUTES} minutes.`);
        }

        await user.save();
        res.status(401);
        throw new Error(`Invalid email or password. ${MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts} attempt(s) remaining.`);
    }

    // Success: reset failed attempts, update last login
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin,
            token,
        },
    });
});

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    res.json({
        success: true,
        data: user,
    });
});

/**
 * @desc    Logout (client-side mostly, but we can log it)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
    // With JWT, logout is mostly client-side (delete token).
    // In future we can implement token blacklist in Redis.
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Both current and new passwords are required');
    }
    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('New password must be at least 6 characters');
    }

    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) { res.status(404); throw new Error('User not found'); }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
});

/**
 * @desc    Verify admin credentials for sensitive actions
 * @route   POST /api/auth/verify-admin
 * @access  Private
 */
export const verifyAdmin = asyncHandler(async (req, res) => {
    const { password, adminEmail } = req.body;

    if (!password) {
        res.status(400);
        throw new Error('Admin password is required');
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user || user.role !== 'admin') {
        if (!adminEmail) {
            res.status(403);
            throw new Error('Not authorized as admin. Please provide admin credentials.');
        }

        const admin = await User.findOne({ email: adminEmail, role: 'admin', isActive: true }).select('+password');
        if (!admin) {
            res.status(401);
            throw new Error('Invalid admin credentials');
        }

        const isMatch = await admin.matchPassword(password);
        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid admin credentials');
        }

        return res.json({
            success: true,
            message: 'Admin verification successful',
            data: { adminId: admin._id, adminName: admin.fullName }
        });
    }

    // If current user IS admin, just check their password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        res.status(401);
        throw new Error('Invalid password');
    }

    res.json({
        success: true,
        message: 'Admin verification successful',
        data: { adminId: user._id, adminName: user.fullName }
    });
});