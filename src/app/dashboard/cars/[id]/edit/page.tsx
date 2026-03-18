import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import CarForm from '@/components/forms/CarForm';

async function getCar(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cars/${id}`,
    { headers: { Cookie: `auth-token=${token}` }, cache: 'no-store' }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.car;
}

export default async function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const car = await getCar(id);
  if (!car) notFound();

  const purchaseDate = car.purchaseDate
    ? new Date(car.purchaseDate).toISOString().split('T')[0]
    : '';

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Car — {car.carId}</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <CarForm mode="edit" initialData={{ ...car, purchaseDate }} />
      </div>
    </div>
  );
}
