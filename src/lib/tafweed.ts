export type TafweedStatus = 'None' | 'Active' | 'Expired';

interface TafweedValidationInput {
  startDate: Date | string;
  customerName: string;
  tafweedAuthorizedTo?: string;
  tafweedDriverIqama?: string;
  tafweedExpiryDate?: Date | string;
  tafweedDurationMonths?: number | string;
  allowExpired?: boolean;
}

interface TafweedValidationResult {
  authorizedTo: string;
  driverIqama: string;
  expiryDate: Date;
  durationMonths: number;
  status: TafweedStatus;
}

export function getTafweedStatus(tafweedExpiryDate?: Date | string | null): TafweedStatus {
  if (!tafweedExpiryDate) return 'None';
  const expiry = new Date(tafweedExpiryDate);
  if (Number.isNaN(expiry.getTime())) return 'None';
  return expiry < new Date() ? 'Expired' : 'Active';
}

export function calculateTafweedDurationMonths(startDate: Date, expiryDate: Date): number {
  let months =
    (expiryDate.getFullYear() - startDate.getFullYear()) * 12 +
    (expiryDate.getMonth() - startDate.getMonth());

  if (expiryDate.getDate() < startDate.getDate()) {
    months -= 1;
  }

  if (months < 1) {
    const diffMs = expiryDate.getTime() - startDate.getTime();
    const approxMonths = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30));
    months = Math.max(approxMonths, 0);
  }

  return months;
}

export function validateTafweedAuthorization(input: TafweedValidationInput): TafweedValidationResult {
  const startDate = new Date(input.startDate);
  if (Number.isNaN(startDate.getTime())) {
    throw new Error('Invalid authorization start date');
  }

  const authorizedTo = (input.tafweedAuthorizedTo || input.customerName || '').trim();
  if (!authorizedTo) {
    throw new Error("Driver's full name is required for Tafweed");
  }

  const driverIqama = (input.tafweedDriverIqama || '').trim();
  if (!driverIqama) {
    throw new Error("Driver's Iqama number is required for Tafweed");
  }

  if (!input.tafweedExpiryDate) {
    throw new Error('Tafweed expiration date is required');
  }
  const expiryDate = new Date(input.tafweedExpiryDate);
  if (Number.isNaN(expiryDate.getTime())) {
    throw new Error('Invalid Tafweed expiration date');
  }
  if (expiryDate <= startDate) {
    throw new Error('Tafweed expiration must be after the authorization start date');
  }
  if (!input.allowExpired && expiryDate < new Date()) {
    throw new Error('Tafweed is expired. Driving authorization must be valid');
  }

  const rawDuration = input.tafweedDurationMonths;
  const durationMonths =
    rawDuration !== undefined && rawDuration !== ''
      ? Number(rawDuration)
      : calculateTafweedDurationMonths(startDate, expiryDate);
  if (!Number.isFinite(durationMonths) || durationMonths < 1) {
    throw new Error('Tafweed duration must be at least 1 month');
  }

  return {
    authorizedTo,
    driverIqama,
    expiryDate,
    durationMonths: Math.floor(durationMonths),
    status: getTafweedStatus(expiryDate),
  };
}

