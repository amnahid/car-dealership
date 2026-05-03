import mongoose from 'mongoose';
import ZatcaConfig from '../src/models/ZatcaConfig';

async function checkConfig() {
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const config = await ZatcaConfig.findOne({ isActive: true });
  
  if (!config) {
    console.log('No active ZATCA configuration found.');
  } else {
    console.log('ZATCA Config found:');
    console.log('Seller Name:', config.sellerName);
    console.log('TRN:', config.trn);
    console.log('Environment:', config.environment);
    console.log('Has Certificate:', !!config.certificate);
    console.log('Has Production CSID:', !!config.productionCsid);
  }
  
  process.exit(0);
}

checkConfig();
