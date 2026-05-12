import cron from 'node-cron';

const CRON_API_KEY = process.env.CRON_API_KEY || 'your-cron-secret-key-change-in-production';
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('Starting expiry alert cron job...');
console.log(`Target API: ${API_URL}/api/cron/check-expiry`);

const task = cron.schedule('0 9 * * *', async () => {
  console.log(`\n[${new Date().toISOString()}] Running daily expiry alert check...`);

  try {
    const response = await fetch(`${API_URL}/api/cron/check-expiry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CRON_API_KEY,
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`[${new Date().toISOString()}] Alert check completed:`);
      console.log(`  - Documents checked: ${result.totalDocuments}`);
      console.log(`  - Emails sent: ${result.emailsSent}`);
      console.log(`  - Emails failed: ${result.emailsFailed}`);
      console.log(`  - WhatsApp sent: ${result.whatsappSent}`);
      console.log(`  - WhatsApp failed: ${result.whatsappFailed}`);
      if (result.errors && result.errors.length > 0) {
        console.log('  - Errors:', result.errors);
      }
    } else {
      console.error(`[${new Date().toISOString()}] Alert check failed:`, result);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error running cron job:`, error);
  }
});

console.log('Cron job scheduled: Run daily at 9:00 AM');
console.log('Press Ctrl+C to stop');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping cron job...');
  task.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nStopping cron job...');
  task.stop();
  process.exit(0);
});