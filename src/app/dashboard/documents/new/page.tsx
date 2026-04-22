import DocumentForm from '@/components/forms/DocumentForm';

export default function NewDocumentPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Documents</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <DocumentForm mode="create" />
      </div>
    </div>
  );
}