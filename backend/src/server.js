import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import uomRoutes from './routes/uomRoutes.js';
import productRoutes from './routes/productRoutes.js';
import customerGroupRoutes from './routes/customerGroupRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import userRoutes from './routes/userRoutes.js';
import salesOrderRoutes from './routes/salesOrderRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';
import grnRoutes from './routes/grnRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import billRoutes from './routes/billRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import bomRoutes from './routes/bomRoutes.js';
import productionOrderRoutes from './routes/productionOrderRoutes.js';
import customerReturnRoutes from './routes/customerReturnRoutes.js';
import creditNoteRoutes from './routes/creditNoteRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import posSessionRoutes from './routes/posSessionRoutes.js';
import financialReportRoutes from './routes/financialReportRoutes.js';
import damageRoutes from './routes/damageRoutes.js';
import supplierReturnRoutes from './routes/supplierReturnRoutes.js';
import repairRoutes from './routes/repairRoutes.js';
import hrRoutes from './routes/hrRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import chequeRoutes from './routes/chequeRoutes.js';
import bankRoutes from './routes/bankRoutes.js';
import fundTransferRoutes from './routes/fundTransferRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import installmentRoutes from './routes/installmentRoutes.js';

import reportsRoutes from './routes/reportsRoutes.js';

import { seedDefaults } from './utils/seedDefaults.js';

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();


connectDB().then(() => seedDefaults());

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({
    origin: true, // Allow all origins in dev, or use the logic below
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging in dev
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate limiting for auth routes (prevents brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 login attempts per 15 min
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/uoms', uomRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customer-groups', customerGroupRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/grns', grnRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/boms', bomRoutes);
app.use('/api/production-orders', productionOrderRoutes);
app.use('/api/customer-returns', customerReturnRoutes);
app.use('/api/credit-notes', creditNoteRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/pos-sessions', posSessionRoutes);
app.use('/api/financial-reports', financialReportRoutes);
app.use('/api/damages', damageRoutes);
app.use('/api/supplier-returns', supplierReturnRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/cheques', chequeRoutes);
app.use('/api/bank-accounts', bankRoutes);
app.use('/api/fund-transfers', fundTransferRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/installments', installmentRoutes);

app.use('/api/reports', reportsRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// Error handling (must be LAST)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✓ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});