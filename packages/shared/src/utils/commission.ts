import {
  RENT_COMMISSION_MONTHS,
  SALE_COMMISSION_PERCENTAGE,
  GST_RATE,
} from '../constants/commission';

export function calculateRentCommission(monthlyRent: number): number {
  return monthlyRent * RENT_COMMISSION_MONTHS;
}

export function calculateSaleCommission(salePrice: number): number {
  return salePrice * SALE_COMMISSION_PERCENTAGE;
}

export function calculateGST(amount: number): number {
  return Math.round(amount * GST_RATE * 100) / 100;
}

export function splitCommission(
  totalCommission: number,
  rdnPercentage: number,
  dealerPercentage: number,
  rwaPercentage: number,
): { rdnShare: number; dealerShare: number; rwaShare: number } {
  return {
    rdnShare: Math.round(totalCommission * rdnPercentage * 100) / 100,
    dealerShare: Math.round(totalCommission * dealerPercentage * 100) / 100,
    rwaShare: Math.round(totalCommission * rwaPercentage * 100) / 100,
  };
}
