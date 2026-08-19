import { authenticatedBackendFetch } from "@/lib/auth/auth.server";
import type { ApiResponse } from "@/lib/auth/auth.types";

import type {
  AgencyResponse,
  AgentFloatBalanceResponse,
  AgentFloatTopupListParams,
  AgentFloatTopupResponse,
  AgentLedgerBalanceResponse,
  AgentPhysicalCashBalanceResponse,
  AgentSettlementListParams,
  AgentSettlementResponse,
  ApproveAgentFloatTopupRequest,
  ApproveAgentSettlementRequest,
  CashAgentContractResponse,
  CashCustomerLookupResponse,
  CashOperationListParams,
  CashOperationResponse,
  ConfirmCashOperationRequest,
  CreateAgencyRequest,
  CreateAgentFloatTopupRequest,
  CreateAgentSettlementRequest,
  CreateCashAgentContractRequest,
  ExecuteCashOperationRequest,
  PageResponse,
  RejectAgentFloatTopupRequest,
  RejectAgentSettlementRequest,
  StartCashOperationRequest,
  UpdateAgencyRequest,
  UpdateAgencyStatusRequest,
  UpdateCashAgentContractRequest,
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

export async function updateAgencyAgentContract(
  agencyId: string,
  contractId: string,
  payload: UpdateCashAgentContractRequest,
) {
  const response = await authenticatedBackendFetch(
    `/agencies/${agencyId}/agents/${contractId}`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<CashAgentContractResponse>(response, "Unable to update cash agent contract.");
}

export async function getCurrentAgentProfile() {
  const response = await authenticatedBackendFetch("/agent/me");
  return readApiResponse<CashAgentContractResponse>(response, "Unable to load cash agent profile.");
}

export async function getCurrentAgentFloatBalance() {
  const response = await authenticatedBackendFetch("/agent/float-balance");
  return readApiResponse<AgentFloatBalanceResponse>(response, "Unable to load cash agent float balance.");
}

export async function getCurrentAgentEarningsBalance() {
  const response = await authenticatedBackendFetch("/agent/earnings-balance");
  return readApiResponse<AgentLedgerBalanceResponse>(response, "Unable to load cash agent earnings balance.");
}

export async function getCurrentAgentPhysicalCashBalance() {
  const response = await authenticatedBackendFetch("/agent/physical-cash-balance");
  return readApiResponse<AgentPhysicalCashBalanceResponse>(
    response,
    "Unable to load cash agent physical cash balance.",
  );
}

export async function searchAgentCashCustomer(query: string) {
  const searchParams = new URLSearchParams({ q: query });
  const response = await authenticatedBackendFetch(`/agent/customers/search?${searchParams.toString()}`);
  return readApiResponse<CashCustomerLookupResponse>(response, "Unable to search cash customer.");
}

export async function startAgentCashIn(payload: StartCashOperationRequest) {
  const response = await authenticatedBackendFetch("/agent/cash-in", jsonRequest("POST", payload));
  return readApiResponse<CashOperationResponse>(response, "Unable to start cash-in.");
}

export async function startAgentCashOut(payload: StartCashOperationRequest) {
  const response = await authenticatedBackendFetch("/agent/cash-out", jsonRequest("POST", payload));
  return readApiResponse<CashOperationResponse>(response, "Unable to start cash-out.");
}

export async function confirmAgentCashOperation(operationId: string, payload: ConfirmCashOperationRequest) {
  const response = await authenticatedBackendFetch(
    `/agent/cash-operations/${operationId}/confirm`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<CashOperationResponse>(response, "Unable to confirm cash operation.");
}

export async function executeAgentCashOperation(operationId: string, payload: ExecuteCashOperationRequest) {
  const response = await authenticatedBackendFetch(
    `/agent/cash-operations/${operationId}/execute`,
    jsonRequest("POST", payload),
  );
  return readApiResponse<CashOperationResponse>(response, "Unable to execute cash operation.");
}

export async function listCurrentAgentCashOperations(params: CashOperationListParams = {}) {
  const searchParams = paginationParams(params);
  appendIfPresent(searchParams, "operationType", params.operationType);
  appendIfPresent(searchParams, "status", params.status);
  const response = await authenticatedBackendFetch(`/agent/cash-operations?${searchParams.toString()}`);
  return readApiResponse<PageResponse<CashOperationResponse>>(response, "Unable to load agent cash operations.");
}

export async function listCurrentAgentFloatTopups(params: AgentFloatTopupListParams = {}) {
  const searchParams = paginationParams(params);
  appendIfPresent(searchParams, "status", params.status);
  appendIfPresent(searchParams, "q", params.q);
  const response = await authenticatedBackendFetch(`/agent/float-topups?${searchParams.toString()}`);
  return readApiResponse<PageResponse<AgentFloatTopupResponse>>(
    response,
    "Unable to load current agent float top-ups.",
  );
}

export async function listCurrentAgentSettlements(params: AgentSettlementListParams = {}) {
  const searchParams = paginationParams(params);
  appendIfPresent(searchParams, "status", params.status);
  appendIfPresent(searchParams, "direction", params.direction);
  appendIfPresent(searchParams, "q", params.q);
  const response = await authenticatedBackendFetch(`/agent/settlements?${searchParams.toString()}`);
  return readApiResponse<PageResponse<AgentSettlementResponse>>(response, "Unable to load current agent settlements.");
}

export async function getCashOperation(operationId: string) {
  const response = await authenticatedBackendFetch(`/cash-operations/${operationId}`);
  return readApiResponse<CashOperationResponse>(response, "Unable to load cash operation.");
}

export async function listCashOperations(params: CashOperationListParams = {}) {
  const searchParams = paginationParams(params);
  appendIfPresent(searchParams, "operationType", params.operationType);
  appendIfPresent(searchParams, "status", params.status);
  appendIfPresent(searchParams, "q", params.q);

  const response = await authenticatedBackendFetch(`/cash-operations?${searchParams.toString()}`);
  return readApiResponse<PageResponse<CashOperationResponse>>(response, "Unable to load cash operations.");
}

export async function createAgentFloatTopup(payload: CreateAgentFloatTopupRequest) {
  const response = await authenticatedBackendFetch("/agent-float-topups", jsonRequest("POST", payload));
  return readApiResponse<AgentFloatTopupResponse>(response, "Unable to create agent float top-up.");
}

export async function listAgentFloatTopups(params: AgentFloatTopupListParams = {}) {
  const searchParams = paginationParams(params);
  appendIfPresent(searchParams, "status", params.status);
  appendIfPresent(searchParams, "agencyId", params.agencyId);
  appendIfPresent(searchParams, "agentUserId", params.agentUserId);
  appendIfPresent(searchParams, "q", params.q);

  const response = await authenticatedBackendFetch(`/agent-float-topups?${searchParams.toString()}`);
  return readApiResponse<PageResponse<AgentFloatTopupResponse>>(response, "Unable to load agent float top-ups.");
}

export async function getAgentFloatTopup(topupId: string) {
  const response = await authenticatedBackendFetch(`/agent-float-topups/${topupId}`);
  return readApiResponse<AgentFloatTopupResponse>(response, "Unable to load agent float top-up.");
}

export async function approveAgentFloatTopup(topupId: string, payload: ApproveAgentFloatTopupRequest) {
  const response = await authenticatedBackendFetch(
    `/agent-float-topups/${topupId}/approve`,
    jsonRequest("POST", payload),
  );
  return readApiResponse<AgentFloatTopupResponse>(response, "Unable to approve agent float top-up.");
}

export async function rejectAgentFloatTopup(topupId: string, payload: RejectAgentFloatTopupRequest) {
  const response = await authenticatedBackendFetch(
    `/agent-float-topups/${topupId}/reject`,
    jsonRequest("POST", payload),
  );
  return readApiResponse<AgentFloatTopupResponse>(response, "Unable to reject agent float top-up.");
}

export async function createAgentSettlement(payload: CreateAgentSettlementRequest) {
  const response = await authenticatedBackendFetch("/agent-settlements", jsonRequest("POST", payload));
  return readApiResponse<AgentSettlementResponse>(response, "Unable to create agent settlement.");
}

export async function listAgentSettlements(params: AgentSettlementListParams = {}) {
  const searchParams = paginationParams(params);
  appendIfPresent(searchParams, "status", params.status);
  appendIfPresent(searchParams, "direction", params.direction);
  appendIfPresent(searchParams, "agencyId", params.agencyId);
  appendIfPresent(searchParams, "agentUserId", params.agentUserId);
  appendIfPresent(searchParams, "q", params.q);

  const response = await authenticatedBackendFetch(`/agent-settlements?${searchParams.toString()}`);
  return readApiResponse<PageResponse<AgentSettlementResponse>>(response, "Unable to load agent settlements.");
}

export async function getAgentSettlement(settlementId: string) {
  const response = await authenticatedBackendFetch(`/agent-settlements/${settlementId}`);
  return readApiResponse<AgentSettlementResponse>(response, "Unable to load agent settlement.");
}

export async function approveAgentSettlement(settlementId: string, payload: ApproveAgentSettlementRequest) {
  const response = await authenticatedBackendFetch(
    `/agent-settlements/${settlementId}/approve`,
    jsonRequest("POST", payload),
  );
  return readApiResponse<AgentSettlementResponse>(response, "Unable to approve agent settlement.");
}

export async function rejectAgentSettlement(settlementId: string, payload: RejectAgentSettlementRequest) {
  const response = await authenticatedBackendFetch(
    `/agent-settlements/${settlementId}/reject`,
    jsonRequest("POST", payload),
  );
  return readApiResponse<AgentSettlementResponse>(response, "Unable to reject agent settlement.");
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
