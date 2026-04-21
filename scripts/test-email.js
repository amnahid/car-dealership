require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('Testing Resend email...\n');

  if (!process.env.RESEND_API_KEY) {
    console.log('❌ API key not configured');
    process.exit(1);
  }

  console.log('✅ API key found');
  console.log('   Sending test email...\n');

  const { data, error } = await resend.emails.send({
    from: 'Car Dealership System <noreply@businessgrowthstudio.online>',
    to: ['nahidshikder60@gmail.com'],
    subject: 'Test Email - Car Dealership System',
    html: `
      <h1 style="color: #28aaa9;">Test Email</h1>
      <p>This is a test email from your Car Dealership System.</p>
      <p>If you received this, your email configuration is working!</p>
    `,
  });

  if (error) {
    console.log('❌ Failed to send email');
    console.log('   Error:', error.message);
    process.exit(1);
  }

  console.log('✅✅✅ EMAIL SENT SUCCESSFULLY! ✅✅✅');
  console.log('   Check inbox: nahidshikder60@gmail.com');
  console.log('   Email ID:', data?.id);
}

testEmail();