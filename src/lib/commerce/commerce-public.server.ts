import { DEFAULT_TENANT_ID } from "@/lib/auth/auth.constants";
import type { ApiResponse } from "@/lib/auth/auth.types";

import type {
  CommerceOrderResponse,
  CommercePaymentIntentResponse,
  CommerceStoreResponse,
  CreateCommerceOrderRequest,
  CreateCommercePaymentIntentRequest,
  LookupCommerceOrderRequest,
  PageResponse,
  ProductCategoryResponse,
  ProductResponse,
} from "./commerce.types";

type ListParams = {
  page?: number;
  size?: number;
  sort?: string;
};

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

function getApiBaseUrl() {
  return (process.env.BACKEND_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
    /\/$/,
    "",
  );
}

function getDefaultTenantId() {
  return process.env.BACKOFFICE_DEFAULT_TENANT_ID ?? DEFAULT_TENANT_ID;
}

export async function getPublicCommerceStore(slug: string) {
  const response = await publicBackendFetch(`/public/stores/${slug}`);

  if (response.status === 404) {
    return null;
  }

  return readApiResponse<CommerceStoreResponse>(response, "Unable to load public store.");
}

export async function listPublicStoreCategories(slug: string, params: ListParams = {}) {
  const response = await publicBackendFetch(`/public/stores/${slug}/categories?${paginationParams(params)}`);

  if (response.status === 404) {
    return emptyPage<ProductCategoryResponse>();
  }

  return readApiResponse<PageResponse<ProductCategoryResponse>>(response, "Unable to load public categories.");
}

export async function listPublicStoreProducts(slug: string, params: ListParams = {}) {
  const response = await publicBackendFetch(`/public/stores/${slug}/products?${paginationParams(params)}`);

  if (response.status === 404) {
    return emptyPage<ProductResponse>();
  }

  return readApiResponse<PageResponse<ProductResponse>>(response, "Unable to load public products.");
}

export async function getPublicStoreProduct(slug: string, productSlug: string) {
  const response = await publicBackendFetch(`/public/stores/${slug}/products/${productSlug}`);

  if (response.status === 404) {
    return null;
  }

  return readApiResponse<ProductResponse>(response, "Unable to load public product.");
}

export async function createPublicStoreOrder(slug: string, payload: CreateCommerceOrderRequest) {
  const response = await publicBackendFetch(`/public/stores/${slug}/orders`, jsonRequest("POST", payload));
  return readApiResponse<CommerceOrderResponse>(response, "Unable to create commerce order.");
}

export async function getPublicStoreOrder(slug: string, orderId: string) {
  const response = await publicBackendFetch(`/public/stores/${slug}/orders/${orderId}`);

  if (response.status === 404) {
    return null;
  }

  return readApiResponse<CommerceOrderResponse>(response, "Unable to load commerce order.");
}

export async function lookupPublicStoreOrder(slug: string, payload: LookupCommerceOrderRequest) {
  const response = await publicBackendFetch(`/public/stores/${slug}/orders/lookup`, jsonRequest("POST", payload));

  if (response.status === 404) {
    return null;
  }

  return readApiResponse<CommerceOrderResponse>(response, "Unable to lookup commerce order.");
}

export async function createPublicStoreOrderPaymentIntent(
  slug: string,
  orderId: string,
  payload: CreateCommercePaymentIntentRequest = {},
) {
  const response = await publicBackendFetch(
    `/public/stores/${slug}/orders/${orderId}/payment-intent`,
    jsonRequest("POST", payload),
  );

  return readApiResponse<CommercePaymentIntentResponse>(response, "Unable to create commerce payment intent.");
}

export async function simulatePublicStorePaymentPaid(slug: string, paymentIntentId: string) {
  const response = await publicBackendFetch(`/public/stores/${slug}/payment-intents/${paymentIntentId}/simulate-paid`, {
    method: "POST",
  });

  return readApiResponse<CommercePaymentIntentResponse>(response, "Unable to confirm simulated payment.");
}

export async function fetchPublicProductImageFile(imageId: string) {
  const response = await publicBackendFetch(`/public/product-images/${imageId}/file`);

  if (!response.ok) {
    const apiResponse = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(apiResponse?.message ?? "Unable to load product image.");
  }

  return {
    body: await response.arrayBuffer(),
    contentDisposition: response.headers.get("content-disposition"),
    contentLength: response.headers.get("content-length"),
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
  };
}

function jsonRequest(method: "POST", payload: unknown): RequestInit {
  return {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method,
  };
}

async function publicBackendFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("X-Tenant-Id", getDefaultTenantId());

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });
}

function paginationParams({ page = 0, size = 100, sort = "createdAt,desc" }: ListParams) {
  return new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
}

async function readApiResponse<T>(response: Response, fallbackMessage: string) {
  const apiResponse = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(apiResponse?.message ?? fallbackMessage);
  }

  return apiResponse.data;
}

function emptyPage<T>(): PageResponse<T> {
  return {
    content: [],
    empty: true,
    first: true,
    last: true,
    page: 0,
    size: 100,
    totalElements: 0,
    totalPages: 0,
  };
}
