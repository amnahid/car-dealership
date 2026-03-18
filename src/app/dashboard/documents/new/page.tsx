import DocumentForm from '@/components/forms/DocumentForm';

interface NewDocumentPageProps {
  searchParams: Promise<{ carId?: string }>;
}

export default async function NewDocumentPage({ searchParams }: NewDocumentPageProps) {
  const { carId } = await searchParams;

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Document</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <DocumentForm mode="create" initialData={carId ? { car: carId } : undefined} />
      </div>
    </div>
  );
}
