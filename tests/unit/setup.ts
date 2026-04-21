Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true, configurable: true });
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.MAILERLITE_API_KEY = 'test_mailerlite_api_key';
process.env.MAILERLITE_FROM_EMAIL = 'test@example.com';
process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
process.env.TWILIO_PHONE_NUMBER = '+1234567890';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test-dealership';