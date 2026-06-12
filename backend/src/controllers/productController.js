import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

async function resolveCategoryAndBrand(req) {
    const { categoryName, brandName } = req.body;

    if (categoryName && typeof categoryName === 'string' && categoryName.trim() !== '') {
        const Category = mongoose.model('Category');
        let category = await Category.findOne({ name: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') } });
        if (!category) {
            let code = categoryName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
            if (!code) code = `CAT-${Math.floor(1000 + Math.random() * 9000)}`;
            const existingCode = await Category.findOne({ code });
            if (existingCode) {
                code = `${code.slice(0, 10)}-${Math.floor(100 + Math.random() * 900)}`;
            }
            category = await Category.create({
                name: categoryName.trim(),
                code,
                createdBy: req.user?._id
            });
        }
        req.body.categoryId = category._id;
    }

    if (brandName !== undefined) {
        if (brandName && typeof brandName === 'string' && brandName.trim() !== '') {
            const Brand = mongoose.model('Brand');
            let brand = await Brand.findOne({ name: { $regex: new RegExp(`^${brandName.trim()}$`, 'i') } });
            if (!brand) {
                brand = await Brand.create({
                    name: brandName.trim(),
                    createdBy: req.user?._id
                });
            }
            req.body.brandId = brand._id;
        } else {
            req.body.brandId = null;
        }
    }

    if (!req.body.unitOfMeasure) {
        req.body.unitOfMeasure = 'pcs';
    }
}

export const createProduct = asyncHandler(async (req, res) => {
    await resolveCategoryAndBrand(req);
    const product = await Product.create({
        ...req.body,
        createdBy: req.user._id,
    });

    // Automatically create a StockItem entry for the default warehouse (or first warehouse)
    // so it shows up in the Stock Overview even with 0 stock.
    try {
        const Warehouse = mongoose.model('Warehouse');
        const StockItem = mongoose.model('StockItem');
        const defaultWh = await Warehouse.findOne({ isDefault: true }) || await Warehouse.findOne();
        
        if (defaultWh) {
            await StockItem.create({
                productId: product._id,
                warehouseId: defaultWh._id,
                productCode: product.productCode,
                productName: product.name,
                unitOfMeasure: product.unitOfMeasure,
                quantities: { onHand: 0, reserved: 0 },
                totalValue: 0
            });
        }
    } catch (err) {
        console.error('Initial stock record creation failed:', err);
    }

    const populated = await Product.findById(product._id)
        .populate('categoryId', 'name code')
        .populate('brandId', 'name');

    res.status(201).json({ success: true, data: populated });
});

export const getProducts = asyncHandler(async (req, res) => {
    const {
        search,
        categoryId,
        brandId,
        status,
        type,
        minPrice,
        maxPrice,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { shortName: { $regex: search, $options: 'i' } },
            { productCode: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
            { barcode: { $regex: search, $options: 'i' } },
        ];
    }

    if (categoryId) filter.categoryId = categoryId;
    if (brandId) filter.brandId = brandId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    if (minPrice || maxPrice) {
        filter.basePrice = {};
        if (minPrice) filter.basePrice.$gte = Number(minPrice);
        if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
        Product.find(filter)
            .populate('categoryId', 'name code')
            .populate('brandId', 'name')
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit)),
        Product.countDocuments(filter),
    ]);

    res.json({
        success: true,
        count: products.length,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: products,
    });
});

export const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('categoryId', 'name code')
        .populate('brandId', 'name')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }
    res.json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
    await resolveCategoryAndBrand(req);
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedBy: req.user._id },
        { new: true, runValidators: true }
    )
        .populate('categoryId', 'name code')
        .populate('brandId', 'name');

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Sync denormalized fields in StockItems
    try {
        const StockItem = mongoose.model('StockItem');
        await StockItem.updateMany(
            { productId: product._id },
            { 
                productName: product.name,
                productCode: product.productCode,
                unitOfMeasure: product.unitOfMeasure
            }
        );
    } catch (err) {
        console.error('StockItem sync failed:', err);
    }

    res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }
    product.deletedAt = new Date();
    product.status = 'inactive';
    await product.save();
    res.json({ success: true, message: 'Product deleted' });
});