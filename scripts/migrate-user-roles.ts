/**
 * Migrates legacy non-admin roles to the new specialized role set.
 *
 * Usage:
 *   npm run migrate:roles
 *   npm run migrate:roles -- --dry-run
 */

import mongoose from 'mongoose';
import User from '../src/models/User';

const ROLE_MIGRATION_MAP = {
  Manager: 'Car Manager',
  'Accounts Officer': 'Accountant',
  'Sales Agent': 'Sales Person',
} as const;

type LegacyRole = keyof typeof ROLE_MIGRATION_MAP;

const LEGACY_ROLES = Object.keys(ROLE_MIGRATION_MAP) as LegacyRole[];

function getLegacyRoleCountMap() {
  return LEGACY_ROLES.reduce<Record<LegacyRole, number>>((acc, role) => {
    acc[role] = 0;
    return acc;
  }, {} as Record<LegacyRole, number>);
}

async function connectToMongo() {
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });
  dotenv.config({ path: '.env' });

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car-dealership';
  await mongoose.connect(uri);
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  await connectToMongo();
  console.log('Connected to MongoDB');

  try {
    const legacyUsers = await User.find({ role: { $in: LEGACY_ROLES } })
      .select('role')
      .lean();

    if (legacyUsers.length === 0) {
      console.log('No legacy roles found. Nothing to migrate.');
      return;
    }

    const roleCounts = getLegacyRoleCountMap();
    for (const user of legacyUsers) {
      const role = user.role as LegacyRole;
      if (role in roleCounts) {
        roleCounts[role] += 1;
      }
    }

    console.log('\nLegacy role usage:');
    for (const role of LEGACY_ROLES) {
      console.log(`  ${role}: ${roleCounts[role]}`);
    }

    if (isDryRun) {
      console.log('\nDry run complete. No changes were made.');
      return;
    }

    console.log('\nApplying role migration...');

    let totalUpdated = 0;
    for (const legacyRole of LEGACY_ROLES) {
      const nextRole = ROLE_MIGRATION_MAP[legacyRole];
      const result = await User.updateMany(
        { role: legacyRole },
        { $set: { role: nextRole } }
      );

      totalUpdated += result.modifiedCount;
      console.log(`  ${legacyRole} -> ${nextRole}: ${result.modifiedCount} users updated`);
    }

    const remainingLegacyUsers = await User.countDocuments({ role: { $in: LEGACY_ROLES } });

    if (remainingLegacyUsers > 0) {
      console.error(`\nMigration incomplete: ${remainingLegacyUsers} users still have legacy roles.`);
      process.exitCode = 1;
      return;
    }

    console.log(`\nMigration complete. Updated ${totalUpdated} users.`);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main().catch((error) => {
  console.error('Role migration failed:', error);
  process.exit(1);
});
