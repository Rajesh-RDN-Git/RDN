export enum CommissionStatus {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  DISTRIBUTED = 'DISTRIBUTED',
  CANCELLED = 'CANCELLED',
}

export interface ICommission {
  id: string;
  dealerId: string;
  transactionId: string;
  amount: number;
  gst: number;
  status: CommissionStatus;
  settlementDate: Date | null;
  payoutReference: string | null;
  createdAt: Date;
}
