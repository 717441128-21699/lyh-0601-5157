export type ContractType = 'lease' | 'loan' | 'labor' | 'other';

export type ContractStatus = 'draft' | 'pending' | 'negotiating' | 'signed' | 'expired' | 'terminated';

export type RiskLevel = 'high' | 'medium' | 'low';

export type ReminderLevel = 'normal' | 'urgent' | 'critical';

export type FormStep = 'basic' | 'parties' | 'terms' | 'confirm';

export interface Party {
  name: string;
  idNumber: string;
  phone: string;
  address: string;
  email?: string;
}

export interface ContractClause {
  id: string;
  title: string;
  content: string;
  isEditable: boolean;
  isRequired: boolean;
}

export interface RiskItem {
  id: string;
  level: RiskLevel;
  title: string;
  description: string;
  suggestion: string;
  clauseId?: string;
  field?: string;
}

export interface SignRecord {
  id: string;
  partyName: string;
  signatureData: string;
  signedAt: string;
  ip?: string;
}

export interface NegotiationRecord {
  id: string;
  version: number;
  author: string;
  content: string;
  createdAt: string;
  changes: Array<{
    field: string;
    oldValue: string;
    newValue: string;
  }>;
}

export interface Contract {
  id: string;
  type: ContractType;
  title: string;
  templateId: string;
  contractNo: string;
  partyA: Party;
  partyB: Party;
  clauses: ContractClause[];
  amount: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
  risks: RiskItem[];
  signRecords: SignRecord[];
  negotiationHistory: NegotiationRecord[];
  version: number;
  qrCodeData?: string;
  encryptedData?: string;
  reminderDays: number;
  reminderLevel: ReminderLevel;
  hasReminded: boolean;
}

export interface ContractTemplate {
  id: string;
  type: ContractType;
  name: string;
  description: string;
  icon: string;
  clauses: ContractClause[];
  defaultReminderDays: number;
  applicableRegions: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface MonthlyReport {
  month: string;
  totalCount: number;
  totalAmount: number;
  typeDistribution: Record<ContractType, number>;
  statusDistribution: Record<ContractStatus, number>;
  expiryDistribution: Array<{
    period: string;
    count: number;
  }>;
  upcomingExpiry: Contract[];
}

export interface ReminderSettings {
  defaultDays: number;
  urgentDays: number;
  criticalDays: number;
  enableNotification: boolean;
  enableEmail: boolean;
}
