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
  dailyLimitMinor?: number | null;
  monthlyLimitMinor?: number | null;
  startsAt: string;
  endsAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
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
  dailyLimitMinor?: number | null;
  monthlyLimitMinor?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateCashAgentContractStatusRequest = {
  status: LifecycleStatus;
};
