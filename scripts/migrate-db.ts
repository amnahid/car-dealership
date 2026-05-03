import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const SOURCE_URI = 'mongodb+srv://abcd:abcd@cluster0.4acsjko.mongodb.net/test?appName=Cluster0'; // using default test db, or will fetch from uri
const TARGET_URI = 'mongodb://127.0.0.1:27017/car_dealership';

async function migrate() {
  const sourceClient = new MongoClient(SOURCE_URI);
  const targetClient = new MongoClient(TARGET_URI);

  try {
    await sourceClient.connect();
    await targetClient.connect();
    console.log('Connected to both databases.');

    // We can just use the default db from the connection string or explicitly state 'test' or whatever
    // Usually mongoose defaults to 'test' if no DB name is in the URI.
    // Let's connect to the source DB to figure out what DB it actually uses if not specified
    const sourceDb = sourceClient.db(); 
    const targetDb = targetClient.db();

    console.log(`Source DB: ${sourceDb.databaseName}`);
    console.log(`Target DB: ${targetDb.databaseName}`);

    const collections = await sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections to migrate.`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      if (collectionName.startsWith('system.')) continue;

      console.log(`Migrating collection: ${collectionName}...`);
      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);

      // Clear target collection before inserting to prevent duplicate key errors
      await targetCollection.deleteMany({});

      const documents = await sourceCollection.find({}).toArray();
      
      if (documents.length > 0) {
        await targetCollection.insertMany(documents);
        console.log(`✅ Migrated ${documents.length} documents for ${collectionName}`);
      } else {
        console.log(`⚠️ No documents found for ${collectionName}`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

migrate();