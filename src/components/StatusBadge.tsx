import { CarStatus } from '@/types';

interface StatusBadgeProps {
  status: CarStatus;
}

const statusConfig: Record<CarStatus, { label: string; className: string }> = {
  'In Stock': { label: 'In Stock', className: 'bg-green-100 text-green-800' },
  'Under Repair': { label: 'Under Repair', className: 'bg-yellow-100 text-yellow-800' },
  Reserved: { label: 'Reserved', className: 'bg-blue-100 text-blue-800' },
  Sold: { label: 'Sold', className: 'bg-gray-100 text-gray-800' },
  Rented: { label: 'Rented', className: 'bg-purple-100 text-purple-800' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
