import { authenticatedBackendFetch } from "@/lib/auth/auth.server";
import type { ApiResponse } from "@/lib/auth/auth.types";

import type { CreateRoleRequest, PageResponse, PermissionResponse, RoleResponse, UpdateRoleRequest } from "./iam.types";

type ListRolesParams = {
  page: number;
  size: number;
  q?: string;
  system?: string;
  sort?: string;
};

type ListPermissionsParams = {
  page?: number;
  size?: number;
};

export async function listRoles({ page, q, size, sort = "createdAt,desc", system }: ListRolesParams) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  appendIfPresent(searchParams, "q", q);
  if (system === "system") {
    searchParams.set("system", "true");
  }
  if (system === "custom") {
    searchParams.set("system", "false");
  }

  const response = await authenticatedBackendFetch(`/iam/roles?${searchParams.toString()}`);
  return readApiResponse<PageResponse<RoleResponse>>(response, "Unable to load roles.");
}

function appendIfPresent(searchParams: URLSearchParams, key: string, value?: string) {
  if (value?.trim()) {
    searchParams.set(key, value.trim());
  }
}

export async function getRole(roleId: string) {
  const response = await authenticatedBackendFetch(`/iam/roles/${roleId}`);
  return readApiResponse<RoleResponse>(response, "Unable to load role.");
}

export async function listPermissions({ page = 0, size = 200 }: ListPermissionsParams = {}) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: "code,asc",
  });

  const response = await authenticatedBackendFetch(`/iam/permissions?${searchParams.toString()}`);
  return readApiResponse<PageResponse<PermissionResponse>>(response, "Unable to load permissions.");
}

export async function listRolePermissions(roleId: string) {
  const response = await authenticatedBackendFetch(`/iam/roles/${roleId}/permissions`);
  return readApiResponse<PermissionResponse[]>(response, "Unable to load role permissions.");
}

export async function createRole(payload: CreateRoleRequest) {
  const response = await authenticatedBackendFetch("/iam/roles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return readApiResponse<RoleResponse>(response, "Unable to create role.");
}

export async function updateRole(roleId: string, payload: UpdateRoleRequest) {
  const response = await authenticatedBackendFetch(`/iam/roles/${roleId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return readApiResponse<RoleResponse>(response, "Unable to update role.");
}

export async function deleteRole(roleId: string) {
  const response = await authenticatedBackendFetch(`/iam/roles/${roleId}`, {
    method: "DELETE",
  });
  const apiResponse = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

  if (!response.ok || !apiResponse?.success) {
    throw new Error(apiResponse?.message ?? "Unable to delete role.");
  }
}

async function readApiResponse<T>(response: Response, fallbackMessage: string) {
  const apiResponse = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(apiResponse?.message ?? fallbackMessage);
  }

  return apiResponse.data;
}
