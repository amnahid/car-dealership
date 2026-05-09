import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import User from '../src/models/User';
import { normalizeRole } from '../src/lib/rbac';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config();

async function migrateToMultiRole() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    const users = await User.find({ isDeleted: { $ne: true } });
    console.log(`Found ${users.length} users to migrate.`);

    let updatedCount = 0;
    for (const user of users) {
      // If roles array is empty or missing, populate it from the role field
      if (!user.roles || user.roles.length === 0) {
        const normalized = normalizeRole(user.role);
        if (normalized) {
            console.log(`Migrating user ${user.email}: ${user.role} -> [${normalized}]`);
            user.roles = [normalized];
            user.role = normalized; // Also ensure legacy field is normalized
            await user.save();
            updatedCount++;
        } else {
            console.warn(`User ${user.email} has invalid role: ${user.role}. Skipping multi-role migration for this user.`);
        }
      }
    }

    console.log(`Successfully migrated ${updatedCount} users to multi-role system.`);
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

migrateToMultiRole();
