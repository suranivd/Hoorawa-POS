import express from 'express';
import {
    getInstallments,
    getInstallmentById,
    payInstallment
} from '../controllers/installmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getInstallments);

router.route('/:id')
    .get(getInstallmentById);

router.route('/:id/pay')
    .post(authorize('admin', 'manager', 'accountant'), payInstallment);

export default router;
