export enum ReferralStatus {
  PENDING = 'PENDING',
  SIGNED_UP = 'SIGNED_UP',
  TRANSACTED = 'TRANSACTED',
  REWARDED = 'REWARDED',
}

export interface IReferral {
  id: string;
  referrerId: string;
  referredId: string | null;
  referralCode: string;
  status: ReferralStatus;
  rewardAmount: number | null;
  createdAt: Date;
}
