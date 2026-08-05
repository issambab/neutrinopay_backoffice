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

export type UserResponse = {
  id: string;
  tenantId: string;
  externalReference?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  fullName?: string | null;
  userType: string;
  status: string;
  kycStatus: string;
  mfaEnabled: boolean;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type UpdateUserRequest = {
  externalReference?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  fullName?: string | null;
  userType?: string | null;
  mfaEnabled?: boolean | null;
  metadata?: Record<string, unknown> | null;
};

export type ChangeUserStatusRequest = {
  status: string;
};

export type RoleResponse = {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  scope: RoleScope;
  description?: string | null;
  system: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type PermissionResponse = {
  id: string;
  code: string;
  name: string;
  module: string;
  action: string;
  description?: string | null;
  createdAt: string;
};

export type RoleScope = "platform" | "tenant" | "business" | "station" | "wallet" | "fleet_company" | "terminal";

export type CreateRoleRequest = {
  code: string;
  name: string;
  scope: RoleScope;
  description?: string | null;
  permissionIds: string[];
};

export type UpdateRoleRequest = {
  name?: string | null;
  scope?: RoleScope | null;
  description?: string | null;
  permissionIds: string[];
};
