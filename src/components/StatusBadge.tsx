import { CarStatus } from '@/types';

interface StatusBadgeProps {
  status: CarStatus;
}

const statusConfig: Record<CarStatus, { label: string; background: string; color: string }> = {
  'In Stock': { label: 'In Stock', background: '#42ca7f', color: '#ffffff' },
  'Under Repair': { label: 'Under Repair', background: '#f8b425', color: '#ffffff' },
  Reserved: { label: 'Reserved', background: '#38a4f8', color: '#ffffff' },
  Sold: { label: 'Sold', background: '#adb5bd', color: '#ffffff' },
  Rented: { label: 'Rented', background: '#9c27b0', color: '#ffffff' },
};

const defaultConfig = { label: 'Unknown', background: '#adb5bd', color: '#ffffff' };

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || defaultConfig;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 10px',
        fontWeight: 500,
        fontSize: '12px',
        borderRadius: '3px',
        background: config.background,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
}