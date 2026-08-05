import type { PageResponse, RoleScope, UserResponse } from "@/lib/iam/iam.types";

export type { PageResponse };

export type LifecycleStatus = "draft" | "pending" | "active" | "suspended" | "blocked" | "closed" | "archived";

export type BusinessResponse = {
  id: string;
  tenantId: string;
  externalReference?: string | null;
  name: string;
  businessType: string;
  registrationNumber?: string | null;
  taxIdentifier?: string | null;
  status: LifecycleStatus;
  kycStatus?: "not_started" | "pending" | "in_review" | "verified" | "rejected" | "expired" | null;
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

export type StationResponse = {
  id: string;
  tenantId: string;
  businessId: string;
  businessName: string;
  stationCode: string;
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
  zone?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status: LifecycleStatus;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type PointOfSaleResponse = {
  id: string;
  tenantId: string;
  businessId: string;
  businessName: string;
  stationId?: string | null;
  stationName?: string | null;
  posCode: string;
  name: string;
  posType: string;
  status: LifecycleStatus;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type TerminalResponse = {
  id: string;
  tenantId: string;
  pointOfSaleId: string;
  pointOfSaleName: string;
  businessId: string;
  businessName: string;
  stationId?: string | null;
  stationName?: string | null;
  terminalCode: string;
  deviceType: string;
  serialNumber?: string | null;
  status: LifecycleStatus;
  apiClientId?: string | null;
  apiClientName?: string | null;
  lastSeenAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type MerchantUserResponse = {
  roleAssignment: UserRoleResponse;
  user: UserResponse;
};

export type UserRoleResponse = {
  id: string;
  tenantId: string;
  userId: string;
  roleId: string;
  roleCode: string;
  scope: RoleScope;
  scopeId?: string | null;
  startsAt: string;
  endsAt?: string | null;
  createdAt: string;
};

export type CreateMerchantUserRequest = {
  email: string;
  externalReference?: string | null;
  fullName: string;
  metadata?: Record<string, unknown> | null;
  phoneNumber?: string | null;
  temporaryPassword: string;
};

export type CreateBusinessRequest = Omit<BusinessResponse, "id" | "tenantId" | "createdAt" | "updatedAt">;
export type UpdateBusinessRequest = Partial<Omit<CreateBusinessRequest, "status">>;
export type UpdateStatusRequest = { status: LifecycleStatus };

export type CreateStationRequest = Omit<
  StationResponse,
  "id" | "tenantId" | "businessId" | "businessName" | "createdAt" | "updatedAt"
>;
export type UpdateStationRequest = Partial<Omit<CreateStationRequest, "status">>;

export type CreatePointOfSaleRequest = Omit<
  PointOfSaleResponse,
  "id" | "tenantId" | "businessId" | "businessName" | "stationName" | "createdAt" | "updatedAt"
>;
export type UpdatePointOfSaleRequest = Partial<Omit<CreatePointOfSaleRequest, "status">>;

export type CreateTerminalRequest = Omit<
  TerminalResponse,
  | "id"
  | "tenantId"
  | "pointOfSaleId"
  | "pointOfSaleName"
  | "businessId"
  | "businessName"
  | "stationId"
  | "stationName"
  | "apiClientName"
  | "lastSeenAt"
  | "createdAt"
  | "updatedAt"
>;
export type UpdateTerminalRequest = Partial<Omit<CreateTerminalRequest, "status">>;
