import { authenticatedBackendFetch } from "@/lib/auth/auth.server";
import type { ApiResponse } from "@/lib/auth/auth.types";

import type {
  CreateCustomerKycProfileRequest,
  CreateKycProfileRequest,
  CreateMerchantKycProfileRequest,
  KycDocumentResponse,
  KycOwnerType,
  KycProfileResponse,
  PageResponse,
  ReviewKycDocumentRequest,
  ReviewKycProfileRequest,
} from "./kyc.types";

type ListProfilesParams = {
  ownerType?: KycOwnerType;
  page?: number;
  riskLevel?: string;
  size?: number;
  sort?: string;
  status?: string;
};

export async function listKycProfiles({
  ownerType,
  page = 0,
  riskLevel,
  size = 20,
  sort = "createdAt,desc",
  status,
}: ListProfilesParams = {}) {
  const searchParams = paginationParams({ page, size, sort });
  appendIfPresent(searchParams, "ownerType", ownerType);
  appendIfPresent(searchParams, "status", status);
  appendIfPresent(searchParams, "riskLevel", riskLevel);

  const response = await authenticatedBackendFetch(`/kyc/profiles?${searchParams.toString()}`);
  return readApiResponse<PageResponse<KycProfileResponse>>(response, "Unable to load KYC profiles.");
}

export async function getKycProfile(profileId: string) {
  const response = await authenticatedBackendFetch(`/kyc/profiles/${profileId}`);
  return readApiResponse<KycProfileResponse>(response, "Unable to load KYC profile.");
}

export async function createKycProfile(payload: CreateKycProfileRequest) {
  const response = await authenticatedBackendFetch("/kyc/profiles", jsonRequest("POST", payload));
  return readApiResponse<KycProfileResponse>(response, "Unable to create KYC profile.");
}

export async function getKycProfileByOwner(ownerType: KycOwnerType, ownerId: string) {
  const response = await authenticatedBackendFetch(`/kyc/profiles/by-owner?ownerType=${ownerType}&ownerId=${ownerId}`);

  if (response.status === 404) {
    return null;
  }

  return readApiResponse<KycProfileResponse>(response, "Unable to load KYC profile.");
}

export async function listKycProfileDocuments(
  profileId: string,
  { page = 0, size = 20, sort = "createdAt,desc" } = {},
) {
  const response = await authenticatedBackendFetch(
    `/kyc/profiles/${profileId}/documents?${paginationParams({ page, size, sort })}`,
  );
  return readApiResponse<PageResponse<KycDocumentResponse>>(response, "Unable to load KYC documents.");
}

export async function listKycDocuments({
  page = 0,
  size = 20,
  sort = "createdAt,desc",
  status,
}: ListProfilesParams = {}) {
  const searchParams = paginationParams({ page, size, sort });
  appendIfPresent(searchParams, "status", status);

  const response = await authenticatedBackendFetch(`/kyc/documents?${searchParams.toString()}`);
  return readApiResponse<PageResponse<KycDocumentResponse>>(response, "Unable to load KYC documents.");
}

export async function reviewKycProfile(profileId: string, payload: ReviewKycProfileRequest) {
  const response = await authenticatedBackendFetch(`/kyc/profiles/${profileId}/review`, jsonRequest("PATCH", payload));
  return readApiResponse<KycProfileResponse>(response, "Unable to review KYC profile.");
}

export async function reviewKycDocument(documentId: string, payload: ReviewKycDocumentRequest) {
  const response = await authenticatedBackendFetch(
    `/kyc/documents/${documentId}/review`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<KycDocumentResponse>(response, "Unable to review KYC document.");
}

export async function fetchKycDocumentFile(documentId: string) {
  const response = await authenticatedBackendFetch(`/kyc/documents/${documentId}/file`);
  return readFileResponse(response, "Unable to load KYC document file.");
}

export async function uploadKycDocument(profileId: string, formData: FormData) {
  const response = await authenticatedBackendFetch(`/kyc/profiles/${profileId}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  return readApiResponse<KycDocumentResponse>(response, "Unable to upload KYC document.");
}

export async function getMerchantKycProfile() {
  const response = await authenticatedBackendFetch("/merchant/kyc/profile");

  if (response.status === 404) {
    return null;
  }

  return readApiResponse<KycProfileResponse>(response, "Unable to load merchant KYC profile.");
}

export async function createMerchantKycProfile(payload: CreateMerchantKycProfileRequest) {
  const response = await authenticatedBackendFetch("/merchant/kyc/profile", jsonRequest("POST", payload));
  return readApiResponse<KycProfileResponse>(response, "Unable to create merchant KYC profile.");
}

export async function listMerchantKycDocuments() {
  const response = await authenticatedBackendFetch("/merchant/kyc/documents?size=50&sort=createdAt,desc");

  if (response.status === 404) {
    return emptyPage<KycDocumentResponse>();
  }

  return readApiResponse<PageResponse<KycDocumentResponse>>(response, "Unable to load merchant KYC documents.");
}

export async function uploadMerchantKycDocument(formData: FormData) {
  const response = await authenticatedBackendFetch("/merchant/kyc/documents/upload", {
    method: "POST",
    body: formData,
  });
  return readApiResponse<KycDocumentResponse>(response, "Unable to upload merchant KYC document.");
}

export async function fetchMerchantKycDocumentFile(documentId: string) {
  const response = await authenticatedBackendFetch(`/merchant/kyc/documents/${documentId}/file`);
  return readFileResponse(response, "Unable to load merchant KYC document file.");
}

export async function getCustomerKycProfile() {
  const response = await authenticatedBackendFetch("/customer/kyc/profile");

  if (response.status === 404) {
    return null;
  }

  return readApiResponse<KycProfileResponse>(response, "Unable to load customer KYC profile.");
}

export async function createCustomerKycProfile(payload: CreateCustomerKycProfileRequest) {
  const response = await authenticatedBackendFetch("/customer/kyc/profile", jsonRequest("POST", payload));
  return readApiResponse<KycProfileResponse>(response, "Unable to create customer KYC profile.");
}

export async function listCustomerKycDocuments() {
  const response = await authenticatedBackendFetch("/customer/kyc/documents?size=50&sort=createdAt,desc");

  if (response.status === 404) {
    return emptyPage<KycDocumentResponse>();
  }

  return readApiResponse<PageResponse<KycDocumentResponse>>(response, "Unable to load customer KYC documents.");
}

export async function uploadCustomerKycDocument(formData: FormData) {
  const response = await authenticatedBackendFetch("/customer/kyc/documents/upload", {
    method: "POST",
    body: formData,
  });
  return readApiResponse<KycDocumentResponse>(response, "Unable to upload customer KYC document.");
}

export async function fetchCustomerKycDocumentFile(documentId: string) {
  const response = await authenticatedBackendFetch(`/customer/kyc/documents/${documentId}/file`);
  return readFileResponse(response, "Unable to load customer KYC document file.");
}

function paginationParams({
  page = 0,
  size = 20,
  sort = "createdAt,desc",
}: {
  page?: number;
  size?: number;
  sort?: string;
}) {
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

async function readFileResponse(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    const apiResponse = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(apiResponse?.message ?? fallbackMessage);
  }

  return {
    body: await response.arrayBuffer(),
    contentDisposition: response.headers.get("content-disposition"),
    contentLength: response.headers.get("content-length"),
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
  };
}

function emptyPage<T>(): PageResponse<T> {
  return {
    content: [],
    empty: true,
    first: true,
    last: true,
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  };
}
