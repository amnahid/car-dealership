Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true, configurable: true });
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.MAILERLITE_API_KEY = 'test_mailerlite_api_key';
process.env.MAILERLITE_FROM_EMAIL = 'test@example.com';
process.env.META_WA_ACCESS_TOKEN = 'test_token';
process.env.META_WA_PHONE_NUMBER_ID = 'test_id';
process.env.META_WA_ADMIN_PHONE = '1987654321';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test-dealership';