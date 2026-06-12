import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Customer from './src/models/Customer.js';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';
import Warehouse from './src/models/Warehouse.js';
import StockItem from './src/models/StockItem.js';
import BankAccount from './src/models/BankAccount.js';
import User from './src/models/User.js';

dotenv.config();

const PORT = 5005;
const BASE_URL = `http://localhost:${PORT}/api`;

async function ensureSeed() {
    console.log("Ensuring database seed records exist...");
    
    // 1. Warehouse
    let warehouse = await Warehouse.findOne({ isActive: true });
    if (!warehouse) {
        console.log("Creating default warehouse...");
        warehouse = new Warehouse({
            name: "Default Warehouse",
            warehouseCode: "WH-DEF",
            isActive: true,
            isDefault: true
        });
        await warehouse.save();
    }
    
    // 2. Customer
    let customer = await Customer.findOne({ displayName: "Test Customer" });
    if (!customer) {
        console.log("Creating test customer...");
        customer = new Customer({
            displayName: "Test Customer",
            customerType: "individual",
            status: "active",
            primaryContact: { name: "Test Contact", phone: "0771234567" },
            paymentTerms: { type: "credit", creditLimit: 50000, creditDays: 30 }
        });
        await customer.save();
    }
    
    // 3. Category
    let category = await Category.findOne({ name: "Test Category" });
    if (!category) {
        console.log("Creating default category...");
        category = new Category({
            name: "Test Category",
            code: "CAT-TEST",
            isActive: true
        });
        await category.save();
    }
    
    // 4. Product
    let product = await Product.findOne({ productCode: "TESTPROD" });
    if (!product) {
        console.log("Creating test product...");
        product = new Product({
            name: "Test Product",
            productCode: "TESTPROD",
            categoryId: category._id,
            basePrice: 100,
            status: "active",
            unitOfMeasure: "pcs"
        });
        await product.save();
    }
    
    // 5. StockItem (ensure product has stock in warehouse)
    let stockItem = await StockItem.findOne({ productId: product._id, warehouseId: warehouse._id });
    if (!stockItem) {
        console.log("Creating stock for test product...");
        stockItem = new StockItem({
            productId: product._id,
            warehouseId: warehouse._id,
            quantities: { onHand: 100, available: 100, allocated: 0 }
        });
        await stockItem.save();
    } else {
        // Ensure stock is sufficient
        stockItem.quantities.onHand = 100;
        stockItem.quantities.available = 100;
        await stockItem.save();
    }
    
    // 6. BankAccount
    let bankAccount = await BankAccount.findOne({ accountName: "Test Bank Account" });
    if (!bankAccount) {
        console.log("Creating test bank account...");
        bankAccount = new BankAccount({
            accountName: "Test Bank Account",
            accountNumber: `ACC-${Math.floor(Math.random() * 1000000)}`,
            bankName: "Test Bank",
            category: "received",
            currentBalance: 1000,
            isActive: true
        });
        await bankAccount.save();
    }
    
    return { customer, product, warehouse, bankAccount, category };
}

async function test() {
    // Connect Mongoose to database
    console.log("Connecting directly to MongoDB for seeding check...");
    await mongoose.connect(process.env.MONGO_URI);
    
    const seed = await ensureSeed();
    
    // 1. Generate Token
    console.log("\nGenerating JWT token directly from admin database record...");
    const admin = await User.findOne({ email: 'admin@admin.com' });
    if (!admin) {
        throw new Error("Admin user not found in database.");
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
    
    const { customer, product, warehouse, bankAccount } = seed;
    console.log(`- Customer: ${customer.displayName} (${customer._id})`);
    console.log(`- Product: ${product.name} (${product._id})`);
    console.log(`- Warehouse: ${warehouse.name} (${warehouse._id})`);
    console.log(`- Bank Account: ${bankAccount.accountName} (${bankAccount._id})`);
    
    // Test 1: POS Checkout via CARD (Deposits directly into BankAccount)
    console.log("\n--- TEST 1: POS Checkout via CARD ---");
    const freshBankAccountBefore = await BankAccount.findById(bankAccount._id);
    const initialBankBalance = freshBankAccountBefore.currentBalance;
    console.log(`Initial Bank Balance (direct DB): ${initialBankBalance} LKR`);
    
    const cardOrderPayload = {
        customerId: customer._id,
        sourceWarehouseId: warehouse._id,
        source: 'pos',
        items: [{
            productId: product._id,
            orderedQuantity: 1,
            unitPrice: 100 // Test value
        }],
        status: 'approved',
        paymentMethod: 'card',
        bankAccountId: bankAccount._id.toString()
    };
    
    console.log("Sending checkout payload:", JSON.stringify(cardOrderPayload, null, 2));
    
    const cardOrderRes = await fetch(`${BASE_URL}/sales-orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(cardOrderPayload)
    });
    if (!cardOrderRes.ok) {
        throw new Error(`Card checkout failed: ${await cardOrderRes.text()}`);
    }
    const cardOrderData = await cardOrderRes.json();
    console.log("Card POS checkout completed successfully! Order Number:", cardOrderData.data.orderNumber);
    console.log("Checkout response data:", JSON.stringify(cardOrderData, null, 2));
    
    // Check updated bank account balance
    const freshBankAccountAfter = await BankAccount.findById(bankAccount._id);
    console.log(`New Bank Balance (direct DB): ${freshBankAccountAfter.currentBalance} LKR`);
    
    const updatedBankRes = await fetch(`${BASE_URL}/bank-accounts`, { headers });
    const updatedBankData = await updatedBankRes.json();
    console.log("All bank accounts from API:", JSON.stringify(updatedBankData.data, null, 2));
    
    const updatedBankAccount = updatedBankData.data.find(b => b._id.toString() === bankAccount._id.toString());
    console.log(`New Bank Balance (API): ${updatedBankAccount.currentBalance} LKR`);
    
    const balanceDiff = +(updatedBankAccount.currentBalance - initialBankBalance).toFixed(2);
    console.log(`Balance Difference: +${balanceDiff} LKR`);
    const expectedDiff = cardOrderData.data.grandTotal;
    if (balanceDiff !== expectedDiff) {
        throw new Error(`Expected balance difference of +${expectedDiff}, got +${balanceDiff}`);
    }
    console.log("✓ CARD Payment tallied with Bank Balance successfully!");
    
    // Cleanup created test orders to keep DB clean
    console.log("\nCleaning up test records...");
    await Warehouse.deleteOne({ warehouseCode: "WH-DEF" });
    await Customer.deleteOne({ displayName: "Test Customer" });
    await Category.deleteOne({ code: "CAT-TEST" });
    await Product.deleteOne({ productCode: "TESTPROD" });
    await StockItem.deleteOne({ productId: product._id, warehouseId: warehouse._id });
    await BankAccount.deleteOne({ accountName: "Test Bank Account" });
    await mongoose.connection.close();
    
    console.log("\n=================================");
    console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("=================================");
    process.exit(0);
}

test().catch(async (err) => {
    console.error("Test failed:", err);
    await mongoose.connection.close();
    process.exit(1);
});
