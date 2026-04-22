export const CURRENCY = {
  symbol: 'SAR',
  code: 'SAR',
  locale: 'ar-SA',
};

export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `${CURRENCY.symbol}${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${CURRENCY.symbol}${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${CURRENCY.symbol}${(value / 1000).toFixed(1)}K`;
  }
  return `${CURRENCY.symbol}${value}`;
}
