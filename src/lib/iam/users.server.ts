import { authenticatedBackendFetch } from "@/lib/auth/auth.server";
import type { ApiResponse } from "@/lib/auth/auth.types";

import type { ChangeUserStatusRequest, CreateUserRequest, PageResponse, UpdateUserRequest, UserResponse } from "./iam.types";

type ApiErrorResponse = {
  details?: Array<{
    field?: string;
    message?: string;
    rejectedValue?: unknown;
  }> | null;
  message?: string | null;
};

type ListUsersParams = {
  page: number;
  size: number;
  q?: string;
  status?: string;
  type?: string;
  kyc?: string;
  sort?: string;
};

export async function listUsers({ kyc, page, q, size, sort = "createdAt,desc", status, type }: ListUsersParams) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  appendIfPresent(searchParams, "q", q);
  appendIfPresent(searchParams, "status", status);
  appendIfPresent(searchParams, "type", type);
  appendIfPresent(searchParams, "kyc", kyc);

  const response = await authenticatedBackendFetch(`/iam/users?${searchParams.toString()}`);
  const apiResponse = (await response.json().catch(() => null)) as ApiResponse<PageResponse<UserResponse>> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(apiResponse?.message ?? "Unable to load users.");
  }

  return apiResponse.data;
}

function appendIfPresent(searchParams: URLSearchParams, key: string, value?: string) {
  if (value?.trim()) {
    searchParams.set(key, value.trim());
  }
}

export async function getUser(userId: string) {
  const response = await authenticatedBackendFetch(`/iam/users/${userId}`);
  const apiResponse = (await response.json().catch(() => null)) as ApiResponse<UserResponse> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(apiResponse?.message ?? "Unable to load user.");
  }

  return apiResponse.data;
}

export async function createUser(payload: CreateUserRequest) {
  const response = await authenticatedBackendFetch("/iam/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const apiResponse = (await response.json().catch(() => null)) as (ApiResponse<UserResponse> & ApiErrorResponse) | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(formatApiError(apiResponse, "Unable to create user."));
  }

  return apiResponse.data;
}

export async function updateUser(userId: string, payload: UpdateUserRequest) {
  const response = await authenticatedBackendFetch(`/iam/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const apiResponse = (await response.json().catch(() => null)) as ApiResponse<UserResponse> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(apiResponse?.message ?? "Unable to update user.");
  }

  return apiResponse.data;
}

function formatApiError(apiResponse: ApiErrorResponse | null, fallbackMessage: string) {
  const details = apiResponse?.details
    ?.map((detail) => {
      const field = detail.field ? `${detail.field}: ` : "";
      return detail.message ? `${field}${detail.message}` : null;
    })
    .filter(Boolean);

  if (details?.length) {
    return details.join(" | ");
  }

  return apiResponse?.message ?? fallbackMessage;
}

export async function changeUserStatus(userId: string, payload: ChangeUserStatusRequest) {
  const response = await authenticatedBackendFetch(`/iam/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const apiResponse = (await response.json().catch(() => null)) as ApiResponse<UserResponse> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(apiResponse?.message ?? "Unable to update user status.");
  }

  return apiResponse.data;
}
