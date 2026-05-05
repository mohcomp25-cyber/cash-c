export type UserRole = 'cashier' | 'supervisor';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  branchId?: string;
  branchName?: string;
}

export interface Branch {
  id: string;
  name: string;
}

export type ClosingStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentMethodConfig {
  id: string;
  label: string;
  requiresImage: boolean;
  isActive: boolean;
}

export interface CustomPayment {
  methodId: string;
  amount: number;
  imageUrl?: string;
  methodLabel: string;
}

export interface DailyClosing {
  id: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  branchName: string;
  date: string;
  cashAmount: number;
  cardAmount: number;
  expenses: number;
  expectedSales: number;
  actualTotal: number;
  difference: number;
  notes: string;
  imageUrls: string[];
  status: ClosingStatus;
  createdAt: string;
  customPayments?: CustomPayment[];
}
