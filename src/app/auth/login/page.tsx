import LoginForm from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">🚗 NahidDealership</h1>
          <p className="mt-2 text-gray-500 text-sm">Car Dealership & Rental Management System</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">
          Default: admin@dealership.com / Admin@123
        </p>
      </div>
    </div>
  );
}
