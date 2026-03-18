import RepairForm from '@/components/forms/RepairForm';

interface NewRepairPageProps {
  searchParams: Promise<{ carId?: string }>;
}

export default async function NewRepairPage({ searchParams }: NewRepairPageProps) {
  const { carId } = await searchParams;

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Repair</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <RepairForm mode="create" defaultCarId={carId} />
      </div>
    </div>
  );
}
