import { authenticatedBackendFetch } from "@/lib/auth/auth.server";
import type { ApiResponse } from "@/lib/auth/auth.types";
import type { KycOwnerType } from "@/lib/kyc/kyc.types";
import type {
  ComplianceCaseResponse,
  ComplianceEventResponse,
  CreateComplianceCaseRequest,
  CreateComplianceEventRequest,
  PageResponse,
  UpdateComplianceCaseStatusRequest,
} from "./compliance.types";

type ListComplianceCasesParams = {
  assignedTo?: string;
  ownerType?: KycOwnerType;
  page?: number;
  riskLevel?: string;
  size?: number;
  sort?: string;
  status?: string;
};

type ListOwnerCasesParams = {
  ownerId: string;
  ownerType: KycOwnerType;
  page?: number;
  size?: number;
  sort?: string;
};

export async function listComplianceCases({
  assignedTo,
  ownerType,
  page = 0,
  riskLevel,
  size = 20,
  sort = "createdAt,desc",
  status,
}: ListComplianceCasesParams = {}) {
  const searchParams = paginationParams({ page, size, sort });
  appendIfPresent(searchParams, "status", status);
  appendIfPresent(searchParams, "riskLevel", riskLevel);
  appendIfPresent(searchParams, "assignedTo", assignedTo);
  appendIfPresent(searchParams, "ownerType", ownerType);

  const response = await authenticatedBackendFetch(`/compliance/cases?${searchParams.toString()}`);
  return readApiResponse<PageResponse<ComplianceCaseResponse>>(response, "Unable to load compliance cases.");
}

export async function listComplianceCasesByOwner({
  ownerId,
  ownerType,
  page = 0,
  size = 20,
  sort = "createdAt,desc",
}: ListOwnerCasesParams) {
  const searchParams = paginationParams({ page, size, sort });
  searchParams.set("ownerType", ownerType);
  searchParams.set("ownerId", ownerId);

  const response = await authenticatedBackendFetch(`/compliance/cases/by-owner?${searchParams.toString()}`);
  return readApiResponse<PageResponse<ComplianceCaseResponse>>(response, "Unable to load owner compliance cases.");
}

export async function getComplianceCase(caseId: string) {
  const response = await authenticatedBackendFetch(`/compliance/cases/${caseId}`);
  return readApiResponse<ComplianceCaseResponse>(response, "Unable to load compliance case.");
}

export async function createComplianceCase(payload: CreateComplianceCaseRequest) {
  const response = await authenticatedBackendFetch("/compliance/cases", jsonRequest("POST", payload));
  return readApiResponse<ComplianceCaseResponse>(response, "Unable to create compliance case.");
}

export async function updateComplianceCaseStatus(caseId: string, payload: UpdateComplianceCaseStatusRequest) {
  const response = await authenticatedBackendFetch(`/compliance/cases/${caseId}/status`, jsonRequest("PATCH", payload));
  return readApiResponse<ComplianceCaseResponse>(response, "Unable to update compliance case status.");
}

export async function addComplianceCaseEvent(caseId: string, payload: CreateComplianceEventRequest) {
  const response = await authenticatedBackendFetch(`/compliance/cases/${caseId}/events`, jsonRequest("POST", payload));
  return readApiResponse<ComplianceEventResponse>(response, "Unable to add compliance event.");
}

export async function listComplianceCaseTimeline(caseId: string) {
  const response = await authenticatedBackendFetch(`/compliance/cases/${caseId}/timeline`);
  return readApiResponse<ComplianceEventResponse[]>(response, "Unable to load compliance case timeline.");
}

function paginationParams({ page = 0, size = 20, sort = "createdAt,desc" }: ListComplianceCasesParams) {
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
