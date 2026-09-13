export type Currency = 'MXN' | 'USD';

export interface BankAccount {
  id: string;
  company_id: string;
  bank_name: string;
  account_number_mask: string;
  currency: Currency;
  current_balance: number;
  minimum_required_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  company_id: string;
  trip_id?: string | null;
  client_id: string;
  bank_account_id?: string | null;
  invoice_number: string;
  issue_date: string;       // YYYY-MM-DD
  due_date: string;         // YYYY-MM-DD
  adjusted_due_date: string;// YYYY-MM-DD
  total_amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory = 'fuel' | 'toll' | 'maintenance' | 'driver_payroll' | 'port_fees' | 'insurance' | 'other';
export type ExpenseStatus = 'pending' | 'paid' | 'cancelled';

export interface Expense {
  id: string;
  company_id: string;
  trip_id?: string | null;
  bank_account_id?: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  due_date: string;         // YYYY-MM-DD
  paid_date?: string | null;// YYYY-MM-DD
  status: ExpenseStatus;
  created_at: string;
  updated_at: string;
}

// Las que emite el backend (domain/treasury/service.go: severityFor).
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface CashAlert {
  id: string;
  company_id: string;
  projected_date: string;   // YYYY-MM-DD
  severity: AlertSeverity;
  projected_deficit: number;
  description: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface CashFlowProjection {
  id: string;
  company_id: string;
  projected_date: string;   // YYYY-MM-DD
  projected_balance: number;
  generated_at: string;
}

export interface CreateBankAccountPayload {
  bank_name: string;
  account_number_mask: string;
  currency: Currency;
  current_balance: number;
  minimum_required_balance: number;
  is_active?: boolean;
}

export interface CreateInvoicePayload {
  trip_id?: string | null;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  adjusted_due_date?: string;
  total_amount: number;
}

export interface RecordInvoicePaymentPayload {
  amount: number;
  bank_account_id: string;
}

export interface CreateExpensePayload {
  trip_id?: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  due_date: string;
}

export interface PayExpensePayload {
  bank_account_id: string;
}
