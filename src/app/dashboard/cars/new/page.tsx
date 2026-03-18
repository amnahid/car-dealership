import CarForm from '@/components/forms/CarForm';

export default function NewCarPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Car</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <CarForm mode="create" />
      </div>
    </div>
  );
}
