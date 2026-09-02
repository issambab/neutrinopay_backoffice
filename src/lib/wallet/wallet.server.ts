import { authenticatedBackendFetch } from "@/lib/auth/auth.server";
import type { ApiResponse } from "@/lib/auth/auth.types";

import type {
  CustomerWalletEligibilityResponse,
  OwnerType,
  PageResponse,
  UpdateWalletStatusRequest,
  WalletAccountResponse,
  WalletBalanceResponse,
  WalletReconciliationResponse,
  WalletResponse,
  WalletTransactionResponse,
} from "./wallet.types";

type ListParams = {
  page?: number;
  size?: number;
  sort?: string;
};

type CustomerTransactionListParams = ListParams & {
  createdFrom?: string;
  direction?: string;
  operationType?: string;
  query?: string;
};

type AdminWalletListParams = ListParams & {
  ownerId?: string;
  ownerType?: OwnerType;
  status?: string;
};

export async function getCurrentCustomerWallet() {
  const response = await authenticatedBackendFetch("/customer/wallet");

  if (response.status === 404) {
    return null;
  }

  return readApiResponse<WalletResponse>(response, "Unable to load customer wallet.");
}

export async function provisionCurrentCustomerWallet() {
  const response = await authenticatedBackendFetch("/customer/wallet", { method: "POST" });
  return readApiResponse<WalletResponse>(response, "Unable to provision customer wallet.");
}

export async function listCurrentCustomerWalletAccounts() {
  const response = await authenticatedBackendFetch("/customer/wallet/accounts");
  return readApiResponse<WalletAccountResponse[]>(response, "Unable to load customer wallet accounts.");
}

export async function listCurrentCustomerWalletTransactions(params: CustomerTransactionListParams = {}) {
  const query = paginationParams(params);
  appendIfPresent(query, "operationType", params.operationType);
  appendIfPresent(query, "direction", params.direction);
  appendIfPresent(query, "createdFrom", params.createdFrom);
  appendIfPresent(query, "query", params.query);

  const response = await authenticatedBackendFetch(`/customer/wallet/transactions?${query}`);
  return readApiResponse<PageResponse<WalletTransactionResponse>>(response, "Unable to load customer transactions.");
}

export async function listCurrentMerchantWalletTransactions(params: ListParams = {}) {
  const response = await authenticatedBackendFetch(`/merchant/wallet/transactions?${paginationParams(params)}`);
  return readApiResponse<PageResponse<WalletTransactionResponse>>(response, "Unable to load merchant transactions.");
}

export async function getCurrentMerchantWallet() {
  const response = await authenticatedBackendFetch("/merchant/wallet");
  return readApiResponse<WalletResponse>(response, "Unable to load merchant wallet.");
}

export async function getCurrentMerchantWalletBalance() {
  const response = await authenticatedBackendFetch("/merchant/wallet/balance");
  return readApiResponse<WalletBalanceResponse>(response, "Unable to load merchant wallet balance.");
}

export async function getCurrentCustomerWalletEligibility() {
  const response = await authenticatedBackendFetch("/customer/wallet/eligibility");
  return readApiResponse<CustomerWalletEligibilityResponse>(response, "Unable to load wallet eligibility.");
}

export async function getCurrentCustomerWalletBalance() {
  const response = await authenticatedBackendFetch("/customer/wallet/balance");
  return readApiResponse<WalletBalanceResponse>(response, "Unable to load customer wallet balance.");
}

export async function getAdminCustomerWalletEligibility(userId: string) {
  const response = await authenticatedBackendFetch(`/wallets/owners/user/${userId}/eligibility`);
  return readApiResponse<CustomerWalletEligibilityResponse>(response, "Unable to load customer wallet eligibility.");
}

export async function listAdminWallets(params: AdminWalletListParams = {}) {
  const query = paginationParams(params);
  appendIfPresent(query, "ownerType", params.ownerType);
  appendIfPresent(query, "ownerId", params.ownerId);
  appendIfPresent(query, "status", params.status);

  const response = await authenticatedBackendFetch(`/wallets?${query}`);
  return readApiResponse<PageResponse<WalletResponse>>(response, "Unable to load wallets.");
}

export async function getAdminWallet(walletId: string) {
  const response = await authenticatedBackendFetch(`/wallets/${walletId}`);
  return readApiResponse<WalletResponse>(response, "Unable to load wallet.");
}

export async function changeAdminWalletStatus(walletId: string, payload: UpdateWalletStatusRequest) {
  const response = await authenticatedBackendFetch(`/wallets/${walletId}/status`, jsonRequest("PATCH", payload));
  return readApiResponse<WalletResponse>(response, "Unable to update wallet status.");
}

export async function listAdminWalletAccounts(walletId: string) {
  const response = await authenticatedBackendFetch(`/wallets/${walletId}/accounts`);
  return readApiResponse<WalletAccountResponse[]>(response, "Unable to load wallet accounts.");
}

export async function getAdminWalletBalance(walletId: string) {
  const response = await authenticatedBackendFetch(`/wallets/${walletId}/balance`);
  return readApiResponse<WalletBalanceResponse>(response, "Unable to load wallet balance.");
}

export async function getAdminWalletReconciliation(walletId: string) {
  const response = await authenticatedBackendFetch(`/wallets/${walletId}/reconciliation`);
  return readApiResponse<WalletReconciliationResponse>(response, "Unable to load wallet reconciliation.");
}

export async function listAdminWalletTransactions(walletId: string, params: ListParams = {}) {
  const response = await authenticatedBackendFetch(`/wallets/${walletId}/transactions?${paginationParams(params)}`);
  return readApiResponse<PageResponse<WalletTransactionResponse>>(response, "Unable to load wallet transactions.");
}

function paginationParams(params: ListParams) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 20));
  if (params.sort) {
    searchParams.set("sort", params.sort);
  }
  return searchParams;
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
  const apiResponse = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(apiResponse?.message ?? fallbackMessage);
  }

  return apiResponse.data;
}
