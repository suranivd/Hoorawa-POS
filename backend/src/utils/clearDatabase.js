import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDefaults } from './seedDefaults.js';

dotenv.config();

const clearDatabase = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');

        const dbCollections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = dbCollections.map(col => col.name);

        console.log(`Found ${collectionNames.length} physical collections in DB. Clearing data...`);

        for (const name of collectionNames) {
            if (name === 'users') {
                console.log('Skipping "users" collection (keeping logins).');
                continue;
            }
            console.log(`Clearing collection: ${name}`);
            await mongoose.connection.db.collection(name).deleteMany({});
        }

        console.log('✓ Database cleared successfully (except users).');
        console.log('Seeding defaults...');
        await seedDefaults();
        console.log('✓ Defaults seeded successfully.');

        await mongoose.connection.close();
        console.log('✓ Connection closed. Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing database:', error);
        process.exit(1);
    }
};

clearDatabase();
