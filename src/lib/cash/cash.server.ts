import { authenticatedBackendFetch } from "@/lib/auth/auth.server";
import type { ApiResponse } from "@/lib/auth/auth.types";

import type {
  AgencyResponse,
  CashAgentContractResponse,
  CreateAgencyRequest,
  CreateCashAgentContractRequest,
  PageResponse,
  UpdateAgencyRequest,
  UpdateAgencyStatusRequest,
  UpdateCashAgentContractStatusRequest,
} from "./cash.types";

type ApiErrorResponse = {
  details?: Array<{
    field?: string;
    message?: string;
    rejectedValue?: unknown;
  }> | null;
  message?: string | null;
};

type ListParams = {
  page?: number;
  size?: number;
  sort?: string;
  status?: string;
};

export async function listAgencies({ page = 0, size = 20, sort = "createdAt,desc", status }: ListParams = {}) {
  const searchParams = paginationParams({ page, size, sort });
  appendIfPresent(searchParams, "status", status);

  const response = await authenticatedBackendFetch(`/agencies?${searchParams.toString()}`);
  return readApiResponse<PageResponse<AgencyResponse>>(response, "Unable to load agencies.");
}

export async function createAgency(payload: CreateAgencyRequest) {
  const response = await authenticatedBackendFetch("/agencies", jsonRequest("POST", payload));
  return readApiResponse<AgencyResponse>(response, "Unable to create agency.");
}

export async function updateAgency(agencyId: string, payload: UpdateAgencyRequest) {
  const response = await authenticatedBackendFetch(`/agencies/${agencyId}`, jsonRequest("PATCH", payload));
  return readApiResponse<AgencyResponse>(response, "Unable to update agency.");
}

export async function changeAgencyStatus(agencyId: string, payload: UpdateAgencyStatusRequest) {
  const response = await authenticatedBackendFetch(`/agencies/${agencyId}/status`, jsonRequest("PATCH", payload));
  return readApiResponse<AgencyResponse>(response, "Unable to update agency status.");
}

export async function listAgencyAgents(agencyId: string, params: ListParams = {}) {
  const response = await authenticatedBackendFetch(`/agencies/${agencyId}/agents?${paginationParams(params)}`);
  return readApiResponse<PageResponse<CashAgentContractResponse>>(response, "Unable to load agency agents.");
}

export async function assignAgencyAgent(agencyId: string, payload: CreateCashAgentContractRequest) {
  const response = await authenticatedBackendFetch(`/agencies/${agencyId}/agents`, jsonRequest("POST", payload));
  return readApiResponse<CashAgentContractResponse>(response, "Unable to assign cash agent.");
}

export async function changeAgencyAgentStatus(
  agencyId: string,
  contractId: string,
  payload: UpdateCashAgentContractStatusRequest,
) {
  const response = await authenticatedBackendFetch(
    `/agencies/${agencyId}/agents/${contractId}/status`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<CashAgentContractResponse>(response, "Unable to update cash agent contract.");
}

export async function getCurrentAgentProfile() {
  const response = await authenticatedBackendFetch("/agent/me");
  return readApiResponse<CashAgentContractResponse>(response, "Unable to load cash agent profile.");
}

function paginationParams({ page = 0, size = 20, sort = "createdAt,desc" }: ListParams) {
  return new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
}

function appendIfPresent(searchParams: URLSearchParams, key: string, value?: string) {
  if (value?.trim()) {
    searchParams.set(key, value.trim());
  }
}

function jsonRequest(method: "PATCH" | "POST", payload: unknown): RequestInit {
  return {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method,
  };
}

async function readApiResponse<T>(response: Response, fallbackMessage: string) {
  const apiResponse = (await response.json().catch(() => null)) as (ApiResponse<T> & ApiErrorResponse) | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(formatApiError(apiResponse, fallbackMessage));
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
