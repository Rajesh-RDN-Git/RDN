export enum DealTransactionType {
  RENT = 'RENT',
  SALE = 'SALE',
  RENEWAL = 'RENEWAL',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export interface ITransaction {
  id: string;
  leadId: string;
  propertyId: string;
  type: DealTransactionType;
  dealValue: number;
  buyerCommission: number;
  sellerCommission: number;
  gstAmount: number;
  rdnShare: number | null;
  dealerShare: number | null;
  rwaShare: number | null;
  paymentStatus: PaymentStatus;
  invoiceUrls: Record<string, unknown>;
  closedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
