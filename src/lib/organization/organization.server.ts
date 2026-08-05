import { authenticatedBackendFetch } from "@/lib/auth/auth.server";
import type { ApiResponse } from "@/lib/auth/auth.types";

import type {
  BusinessResponse,
  CreateBusinessRequest,
  CreateMerchantUserRequest,
  CreatePointOfSaleRequest,
  CreateStationRequest,
  CreateTerminalRequest,
  MerchantUserResponse,
  PageResponse,
  PointOfSaleResponse,
  StationResponse,
  TerminalResponse,
  UpdateBusinessRequest,
  UpdatePointOfSaleRequest,
  UpdateStationRequest,
  UpdateStatusRequest,
  UpdateTerminalRequest,
} from "./organization.types";

type ListParams = {
  businessType?: string;
  page?: number;
  size?: number;
  sort?: string;
  status?: string;
};

export async function listBusinesses({
  businessType,
  page = 0,
  size = 20,
  sort = "createdAt,desc",
  status,
}: ListParams = {}) {
  const searchParams = paginationParams({ page, size, sort });
  appendIfPresent(searchParams, "status", status);
  appendIfPresent(searchParams, "businessType", businessType);

  const response = await authenticatedBackendFetch(`/businesses?${searchParams.toString()}`);
  return readApiResponse<PageResponse<BusinessResponse>>(response, "Unable to load merchants.");
}

export async function getBusiness(businessId: string) {
  const response = await authenticatedBackendFetch(`/businesses/${businessId}`);
  return readApiResponse<BusinessResponse>(response, "Unable to load merchant.");
}

export async function createBusiness(payload: CreateBusinessRequest) {
  const response = await authenticatedBackendFetch("/businesses", jsonRequest("POST", payload));
  return readApiResponse<BusinessResponse>(response, "Unable to create merchant.");
}

export async function updateBusiness(businessId: string, payload: UpdateBusinessRequest) {
  const response = await authenticatedBackendFetch(`/businesses/${businessId}`, jsonRequest("PATCH", payload));
  return readApiResponse<BusinessResponse>(response, "Unable to update merchant.");
}

export async function changeBusinessStatus(businessId: string, payload: UpdateStatusRequest) {
  const response = await authenticatedBackendFetch(`/businesses/${businessId}/status`, jsonRequest("PATCH", payload));
  return readApiResponse<BusinessResponse>(response, "Unable to update merchant status.");
}

export async function deleteBusiness(businessId: string) {
  const response = await authenticatedBackendFetch(`/businesses/${businessId}`, { method: "DELETE" });
  return readEmptyResponse(response, "Unable to delete merchant.");
}

export async function listBusinessMerchantUsers(businessId: string) {
  const response = await authenticatedBackendFetch(`/businesses/${businessId}/merchant-users`);
  return readApiResponse<MerchantUserResponse[]>(response, "Unable to load merchant users.");
}

export async function createBusinessMerchantUser(businessId: string, payload: CreateMerchantUserRequest) {
  const response = await authenticatedBackendFetch(
    `/businesses/${businessId}/merchant-users`,
    jsonRequest("POST", payload),
  );
  return readApiResponse<MerchantUserResponse>(response, "Unable to create merchant user.");
}

export async function listBusinessStations(businessId: string, params: ListParams = {}) {
  const response = await authenticatedBackendFetch(`/businesses/${businessId}/stations?${paginationParams(params)}`);
  return readApiResponse<PageResponse<StationResponse>>(response, "Unable to load stations.");
}

export async function createStation(businessId: string, payload: CreateStationRequest) {
  const response = await authenticatedBackendFetch(`/businesses/${businessId}/stations`, jsonRequest("POST", payload));
  return readApiResponse<StationResponse>(response, "Unable to create station.");
}

export async function updateStation(stationId: string, payload: UpdateStationRequest) {
  const response = await authenticatedBackendFetch(`/stations/${stationId}`, jsonRequest("PATCH", payload));
  return readApiResponse<StationResponse>(response, "Unable to update station.");
}

export async function changeStationStatus(stationId: string, payload: UpdateStatusRequest) {
  const response = await authenticatedBackendFetch(`/stations/${stationId}/status`, jsonRequest("PATCH", payload));
  return readApiResponse<StationResponse>(response, "Unable to update station status.");
}

export async function deleteStation(stationId: string) {
  const response = await authenticatedBackendFetch(`/stations/${stationId}`, { method: "DELETE" });
  return readEmptyResponse(response, "Unable to delete station.");
}

export async function listBusinessPointsOfSale(businessId: string, params: ListParams = {}) {
  const response = await authenticatedBackendFetch(
    `/businesses/${businessId}/points-of-sale?${paginationParams(params)}`,
  );
  return readApiResponse<PageResponse<PointOfSaleResponse>>(response, "Unable to load points of sale.");
}

export async function createPointOfSale(businessId: string, payload: CreatePointOfSaleRequest) {
  const response = await authenticatedBackendFetch(
    `/businesses/${businessId}/points-of-sale`,
    jsonRequest("POST", payload),
  );
  return readApiResponse<PointOfSaleResponse>(response, "Unable to create point of sale.");
}

export async function updatePointOfSale(pointOfSaleId: string, payload: UpdatePointOfSaleRequest) {
  const response = await authenticatedBackendFetch(`/points-of-sale/${pointOfSaleId}`, jsonRequest("PATCH", payload));
  return readApiResponse<PointOfSaleResponse>(response, "Unable to update point of sale.");
}

export async function changePointOfSaleStatus(pointOfSaleId: string, payload: UpdateStatusRequest) {
  const response = await authenticatedBackendFetch(
    `/points-of-sale/${pointOfSaleId}/status`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<PointOfSaleResponse>(response, "Unable to update point of sale status.");
}

export async function deletePointOfSale(pointOfSaleId: string) {
  const response = await authenticatedBackendFetch(`/points-of-sale/${pointOfSaleId}`, { method: "DELETE" });
  return readEmptyResponse(response, "Unable to delete point of sale.");
}

export async function listPointOfSaleTerminals(pointOfSaleId: string, params: ListParams = {}) {
  const response = await authenticatedBackendFetch(
    `/points-of-sale/${pointOfSaleId}/terminals?${paginationParams(params)}`,
  );
  return readApiResponse<PageResponse<TerminalResponse>>(response, "Unable to load terminals.");
}

export async function listTerminals(params: ListParams = {}) {
  const searchParams = paginationParams(params);
  appendIfPresent(searchParams, "status", params.status);

  const response = await authenticatedBackendFetch(`/terminals?${searchParams.toString()}`);
  return readApiResponse<PageResponse<TerminalResponse>>(response, "Unable to load terminals.");
}

export async function createTerminal(pointOfSaleId: string, payload: CreateTerminalRequest) {
  const response = await authenticatedBackendFetch(
    `/points-of-sale/${pointOfSaleId}/terminals`,
    jsonRequest("POST", payload),
  );
  return readApiResponse<TerminalResponse>(response, "Unable to create terminal.");
}

export async function updateTerminal(terminalId: string, payload: UpdateTerminalRequest) {
  const response = await authenticatedBackendFetch(`/terminals/${terminalId}`, jsonRequest("PATCH", payload));
  return readApiResponse<TerminalResponse>(response, "Unable to update terminal.");
}

export async function changeTerminalStatus(terminalId: string, payload: UpdateStatusRequest) {
  const response = await authenticatedBackendFetch(`/terminals/${terminalId}/status`, jsonRequest("PATCH", payload));
  return readApiResponse<TerminalResponse>(response, "Unable to update terminal status.");
}

export async function deleteTerminal(terminalId: string) {
  const response = await authenticatedBackendFetch(`/terminals/${terminalId}`, { method: "DELETE" });
  return readEmptyResponse(response, "Unable to delete terminal.");
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
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };
}

async function readApiResponse<T>(response: Response, fallbackMessage: string) {
  const apiResponse = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(apiResponse?.message ?? fallbackMessage);
  }

  return apiResponse.data;
}

async function readEmptyResponse(response: Response, fallbackMessage: string) {
  const apiResponse = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

  if (!response.ok || !apiResponse?.success) {
    throw new Error(apiResponse?.message ?? fallbackMessage);
  }
}
