export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type LifecycleStatus = "draft" | "pending" | "active" | "suspended" | "blocked" | "closed" | "archived";

export type AgencyResponse = {
  id: string;
  tenantId: string;
  agencyCode: string;
  name: string;
  status: LifecycleStatus;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
  zone?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type CashAgentContractResponse = {
  id: string;
  tenantId: string;
  agencyId: string;
  agencyCode: string;
  agencyName: string;
  agentUserId: string;
  agentName?: string | null;
  agentEmail?: string | null;
  agentPhoneNumber?: string | null;
  status: LifecycleStatus;
  commissionMode: "fixed" | "percent" | "tiered";
  commissionValue: number;
  platformCommissionSharePercent: number;
  dailyLimitMinor?: number | null;
  monthlyLimitMinor?: number | null;
  startsAt: string;
  endsAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type AgentFloatBalanceResponse = {
  tenantId: string;
  agentUserId: string;
  agentContractId: string;
  accountAddress: string;
  asset: string;
  currency: string;
  availableBalanceMinor: number;
};

export type AgentLedgerBalanceResponse = {
  tenantId: string;
  agentUserId: string;
  agentContractId: string;
  accountAddress: string;
  accountRole: string;
  asset: string;
  currency: string;
  balanceMinor: number;
};

export type AgentPhysicalCashBalanceResponse = {
  tenantId: string;
  agentUserId: string;
  agentContractId: string;
  currency: string;
  cashInPostedMinor: number;
  cashOutPostedMinor: number;
  topupPostedMinor: number;
  cashToFloatPostedMinor: number;
  floatToCashPostedMinor: number;
  physicalCashBalanceMinor: number;
};

export type CashOperationResponse = {
  id: string;
  tenantId: string;
  agencyId: string;
  agencyCode: string;
  agentContractId: string;
  agentUserId: string;
  customerUserId: string;
  customerName?: string | null;
  customerWalletId: string;
  operationType: "cash_in" | "cash_out";
  status: "otp_pending" | "prepared" | "posted" | "failed" | "cancelled" | string;
  amountMinor: number;
  grossAmountMinor?: number | null;
  customerNetAmountMinor?: number | null;
  commissionAmountMinor?: number | null;
  agentCommissionAmountMinor?: number | null;
  platformCommissionAmountMinor?: number | null;
  currency: string;
  otpChallengeId?: string | null;
  preparedAt?: string | null;
  ledgerTransactionId?: string | null;
  postedAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type CustomerWalletEligibilityResponse = {
  eligible: boolean;
  userActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  kycVerified: boolean;
  walletActive: boolean;
  complianceClear: boolean;
  activeComplianceCaseIds: string[];
  walletId?: string | null;
  walletStatus?: LifecycleStatus | null;
  kycStatus?: string | null;
  blockingReasons: string[];
};

export type CashCustomerLookupResponse = {
  customerUserId: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  externalReference?: string | null;
  status: LifecycleStatus;
  kycStatus: string;
  walletId?: string | null;
  eligibility: CustomerWalletEligibilityResponse;
};

export type StartCashOperationRequest = {
  customerLookup: string;
  amountMinor: number;
  currency: "TND";
  metadata?: Record<string, unknown> | null;
};

export type ConfirmCashOperationRequest = {
  otpChallengeId: string;
  code: string;
};

export type ExecuteCashOperationRequest = {
  idempotencyKey: string;
};

export type CreateAgencyRequest = {
  agencyCode: string;
  name: string;
  status?: LifecycleStatus | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
  zone?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateAgencyRequest = Partial<Omit<CreateAgencyRequest, "status">>;

export type UpdateAgencyStatusRequest = {
  status: LifecycleStatus;
};

export type CreateCashAgentContractRequest = {
  agentUserId: string;
  status?: LifecycleStatus | null;
  commissionMode?: "fixed" | "percent" | "tiered" | null;
  commissionValue?: number | null;
  platformCommissionSharePercent?: number | null;
  dailyLimitMinor?: number | null;
  monthlyLimitMinor?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateCashAgentContractStatusRequest = {
  status: LifecycleStatus;
};

export type UpdateCashAgentContractRequest = {
  commissionMode?: "fixed" | "percent" | "tiered" | null;
  commissionValue?: number | null;
  platformCommissionSharePercent?: number | null;
  dailyLimitMinor?: number | null;
  monthlyLimitMinor?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type CashOperationListParams = {
  operationType?: string;
  page?: number;
  q?: string;
  size?: number;
  sort?: string;
  status?: string;
};

export type AgentFloatTopupStatus = "pending" | "posted" | "rejected" | "failed";

export type AgentFloatTopupResponse = {
  id: string;
  tenantId: string;
  agencyId: string;
  agencyCode: string;
  agentContractId: string;
  agentUserId: string;
  agentName?: string | null;
  amountMinor: number;
  currency: string;
  sourceAccount: string;
  destinationAccount: string;
  status: AgentFloatTopupStatus;
  proofReference?: string | null;
  reason?: string | null;
  idempotencyKey?: string | null;
  ledgerTransactionId?: string | null;
  postedAt?: string | null;
  failedAt?: string | null;
  rejectedAt?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type CreateAgentFloatTopupRequest = {
  agentContractId: string;
  amountMinor: number;
  currency: "TND";
  proofReference?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ApproveAgentFloatTopupRequest = {
  idempotencyKey: string;
};

export type RejectAgentFloatTopupRequest = {
  reason: string;
};

export type AgentFloatTopupListParams = {
  agencyId?: string;
  agentUserId?: string;
  page?: number;
  q?: string;
  size?: number;
  sort?: string;
  status?: AgentFloatTopupStatus | string;
};

export type AgentSettlementDirection = "cash_to_float" | "float_to_cash";

export type AgentSettlementStatus = "pending" | "posted" | "rejected" | "failed";

export type AgentSettlementResponse = {
  id: string;
  tenantId: string;
  agencyId: string;
  agencyCode: string;
  agentContractId: string;
  agentUserId: string;
  agentName?: string | null;
  direction: AgentSettlementDirection;
  amountMinor: number;
  currency: string;
  sourceAccount: string;
  destinationAccount: string;
  status: AgentSettlementStatus;
  proofReference?: string | null;
  reason?: string | null;
  rejectionReason?: string | null;
  idempotencyKey?: string | null;
  ledgerTransactionId?: string | null;
  postedAt?: string | null;
  failedAt?: string | null;
  rejectedAt?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type CreateAgentSettlementRequest = {
  agentContractId: string;
  direction: AgentSettlementDirection;
  amountMinor: number;
  currency: "TND";
  proofReference?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ApproveAgentSettlementRequest = {
  idempotencyKey: string;
};

export type RejectAgentSettlementRequest = {
  reason: string;
};

export type AgentSettlementListParams = {
  agencyId?: string;
  agentUserId?: string;
  direction?: AgentSettlementDirection | string;
  page?: number;
  q?: string;
  size?: number;
  sort?: string;
  status?: AgentSettlementStatus | string;
};
export type AgentPayoutStatus = "pending" | "posted" | "rejected" | "failed";

export type AgentPayoutResponse = {
  id: string;
  tenantId: string;
  agencyId: string;
  agencyCode: string;
  agentContractId: string;
  agentUserId: string;
  agentName?: string | null;
  amountMinor: number;
  currency: string;
  sourceAccount: string;
  destinationAccount: string;
  status: AgentPayoutStatus;
  proofReference?: string | null;
  reason?: string | null;
  rejectionReason?: string | null;
  idempotencyKey?: string | null;
  ledgerTransactionId?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  rejectedAt?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type CreateAgentPayoutRequest = {
  agentContractId: string;
  amountMinor: number;
  currency: "TND";
  proofReference?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ApproveAgentPayoutRequest = {
  idempotencyKey: string;
};

export type RejectAgentPayoutRequest = {
  reason: string;
};

export type AgentPayoutListParams = {
  agencyId?: string;
  agentUserId?: string;
  page?: number;
  q?: string;
  size?: number;
  sort?: string;
  status?: AgentPayoutStatus | string;
};
