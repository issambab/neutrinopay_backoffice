import type { LifecycleStatus, PageResponse } from "@/lib/organization/organization.types";

export type { LifecycleStatus, PageResponse };

export type OwnerType =
  | "user"
  | "business"
  | "station"
  | "platform"
  | "fleet_company"
  | "fleet_user"
  | "cash_agent"
  | "system";

export type WalletType =
  | "client"
  | "merchant"
  | "station"
  | "agent"
  | "platform"
  | "fleet_master"
  | "fleet_subaccount"
  | "settlement"
  | "treasury";

export type AccountType =
  | "main"
  | "fees"
  | "settlement"
  | "cash_in"
  | "cash_out"
  | "treasury"
  | "adjustment"
  | "reserve";

export type WalletAccountResponse = {
  id: string;
  tenantId: string;
  walletId: string;
  ledgerAccountId: string;
  ledgerName: string;
  ledgerAccountAddress: string;
  accountType: AccountType;
  currency: string;
  asset: string;
  availableBalanceMinor: number;
  pendingBalanceMinor: number;
  status: LifecycleStatus;
  createdAt: string;
  updatedAt?: string | null;
};

export type WalletResponse = {
  id: string;
  tenantId: string;
  ownerType: OwnerType;
  ownerId: string;
  walletType: WalletType;
  status: LifecycleStatus;
  defaultCurrency: string;
  label?: string | null;
  availableBalanceMinor: number;
  pendingBalanceMinor: number;
  accounts: WalletAccountResponse[];
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type WalletTransactionResponse = {
  id: string;
  walletId: string;
  operationType: string;
  direction: string;
  amountMinor: number;
  asset: string;
  status: string;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type CustomerWalletEligibilityResponse = {
  blockingReasons: string[];
  eligible: boolean;
  emailVerified: boolean;
  kycStatus: string;
  kycVerified: boolean;
  mfaEnabled: boolean;
  userActive: boolean;
  walletActive: boolean;
  complianceClear: boolean;
  activeComplianceCaseIds: string[];
  walletId?: string | null;
  walletStatus?: LifecycleStatus | null;
};

export type UpdateWalletStatusRequest = {
  status: LifecycleStatus;
  reason?: string | null;
};
