import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').or(z.literal(''));

export const productFormSchema = z.object({
    name: z.string().min(1, 'Product name is required').max(200),
    shortName: z.string().max(100).optional().or(z.literal('')),
    sku: z.string().max(50).optional().or(z.literal('')),
    barcode: z.string().max(50).optional().or(z.literal('')),
    productType: z.enum(['finished_good', 'raw_material', 'semi_finished', 'packaging', 'service', 'consumable']).optional(),
    canBeSold: z.boolean().optional(),
    canBePurchased: z.boolean().optional(),
    canBeManufactured: z.boolean().optional(),
    description: z.string().max(2000).optional().or(z.literal('')),
    categoryId: z.string().optional(),
    brandId: z.string().optional().or(z.literal('')),
    categoryName: z.string().min(1, 'Category is required'),
    brandName: z.string().optional().or(z.literal('')),
    type: z.enum(['manufactured', 'trading', 'service', 'bundle']),
    unitOfMeasure: z.string().optional(),
    basePrice: z.coerce.number().min(0, 'Selling Price must be 0 or greater'),
    buyingPrice: z.coerce.number().min(0, 'Buying Price must be 0 or greater').optional(),
    profitPercentage: z.coerce.number().optional(),
    mrp: z.coerce.number().min(0).optional(),
    callPrice: z.coerce.number().min(0, 'Call Price must be 0 or greater').optional(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
    taxable: z.boolean().optional(),
    hsCode: z.string().max(20).optional().or(z.literal('')),
    minimumLevel: z.coerce.number().min(0).optional(),
    reorderLevel: z.coerce.number().min(0).optional(),
    maximumLevel: z.coerce.number().min(0).optional(),
    unitsPerCarton: z.coerce.number().min(0).optional(),
    cartonsPerPallet: z.coerce.number().min(0).optional(),
    minimumOrderQuantity: z.coerce.number().min(0).optional(),
    sellable: z.boolean().optional(),
    allowBackorder: z.boolean().optional(),
    status: z.enum(['active', 'inactive', 'draft', 'discontinued']),
    notes: z.string().max(1000).optional().or(z.literal('')),
    productNature: z.enum(['single', 'variable', 'combo']).optional(),
    variations: z.array(z.object({
        sku: z.string().optional().or(z.literal('')),
        name: z.string().min(1, 'Name is required'),
        barcode: z.string().optional().or(z.literal('')),
        attributeName: z.string().optional().or(z.literal('')),
        attributeValue: z.string().optional().or(z.literal('')),
        purchasePrice: z.coerce.number().min(0).optional(),
        price: z.coerce.number().min(0),
        stock: z.coerce.number().optional(),
    })).optional(),
    comboItems: z.array(z.object({
        productId: z.string().min(1, 'Product is required'),
        quantity: z.coerce.number().min(1),
        priceContribution: z.coerce.number().optional(),
    })).optional(),
    tierPricing: z.array(z.object({
        tierName: z.string().optional().or(z.literal('')),
        minQuantity: z.coerce.number().min(0),
        maxQuantity: z.coerce.number().optional().nullable(),
        price: z.coerce.number().min(0),
    })).optional(),
});

export const categoryFormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    code: z.string().min(1, 'Code is required').max(20),
    description: z.string().max(500).optional().or(z.literal('')),
    parentCategory: z.string().optional().or(z.literal('')),
    type: z.enum(['product', 'raw_material', 'both']),
    isActive: z.boolean().optional(),
});

export const brandFormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    code: z.string().max(20).optional().or(z.literal('')),
    description: z.string().max(500).optional().or(z.literal('')),
    isOwnBrand: z.boolean().optional(),
    isActive: z.boolean().optional(),
});