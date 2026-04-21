require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.MAILERLITE_API_KEY;
const TO_EMAIL = 'nahidshikder60@gmail.com';

async function testEmail() {
  console.log('Testing MailerLite API Key Format...\n');
  console.log('API Key:', API_KEY?.substring(0, 30) + '...\n');

  // Try different authentication methods
  const authMethods = [
    `Bearer ${API_KEY}`,
    API_KEY,
    `ApiKey ${API_KEY}`,
  ];

  for (const auth of authMethods) {
    console.log(`Testing auth: ${auth.substring(0, 20)}...`);
    try {
      const response = await fetch('https://api.mailerlite.com/api/v2/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          to: TO_EMAIL,
          subject: 'Test Email',
          from: 'noreply@mailerlite.com',
          from_name: 'Car Dealership',
          html: '<h1>Test</h1>',
        }),
      });
      const data = await response.json();
      console.log(`  Status: ${response.status}`);
      if (!response.ok) {
        console.log(`  Error: ${data.error?.message || JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
}

testEmail();