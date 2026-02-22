export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RWA_ADMIN = 'RWA_ADMIN',
  DEALER = 'DEALER',
  OWNER = 'OWNER',
  BUYER_TENANT = 'BUYER_TENANT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface IUser {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
