interface ExpiryAlertProps {
  daysUntilExpiry: number;
  documentType: string;
  carId: string;
}

export default function ExpiryAlert({ daysUntilExpiry, documentType, carId }: ExpiryAlertProps) {
  let colorClass = 'bg-orange-50 border-orange-200 text-orange-800';
  let icon = '⚠️';

  if (daysUntilExpiry <= 7) {
    colorClass = 'bg-red-50 border-red-200 text-red-800';
    icon = '🚨';
  } else if (daysUntilExpiry <= 15) {
    colorClass = 'bg-yellow-50 border-yellow-200 text-yellow-800';
    icon = '⚠️';
  }

  return (
    <div className={`rounded-md border p-3 ${colorClass}`}>
      <p className="text-sm font-medium">
        {icon} {documentType} for car {carId} expires in {daysUntilExpiry} day
        {daysUntilExpiry !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
