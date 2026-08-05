import { authenticatedBackendFetch } from "@/lib/auth/auth.server";
import type { ApiResponse } from "@/lib/auth/auth.types";

import type {
  CommerceOrderResponse,
  CommerceOrderStatus,
  CommercePaymentIntentResponse,
  CommercePaymentStatus,
  CommerceSalesSummaryResponse,
  CommerceStoreResponse,
  CreateCommerceStoreRequest,
  CreateProductCategoryRequest,
  CreateProductRequest,
  PageResponse,
  ProductCategoryResponse,
  ProductImageResponse,
  ProductResponse,
  UpdateCommerceOrderPaymentStatusRequest,
  UpdateCommerceOrderStatusRequest,
  UpdateCommercePaymentIntentStatusRequest,
  UpdateCommerceStoreRequest,
  UpdateProductCategoryRequest,
  UpdateProductRequest,
} from "./commerce.types";

type ListParams = {
  page?: number;
  size?: number;
  sort?: string;
};

type SalesFilterParams = {
  from?: string;
  paymentStatus?: CommercePaymentStatus | string;
  q?: string;
  status?: CommerceOrderStatus | string;
  to?: string;
};

type DownloadFile = {
  body: ArrayBuffer;
  contentDisposition: string | null;
  contentLength: string | null;
  contentType: string;
};

export async function getMerchantCommerceStore() {
  const response = await authenticatedBackendFetch("/merchant/commerce/store");

  if (response.status === 404) {
    return null;
  }

  return readApiResponse<CommerceStoreResponse>(response, "Unable to load merchant store.");
}

export async function createMerchantCommerceStore(payload: CreateCommerceStoreRequest) {
  const response = await authenticatedBackendFetch("/merchant/commerce/store", jsonRequest("POST", payload));
  return readApiResponse<CommerceStoreResponse>(response, "Unable to create merchant store.");
}

export async function updateMerchantCommerceStore(payload: UpdateCommerceStoreRequest) {
  const response = await authenticatedBackendFetch("/merchant/commerce/store", jsonRequest("PATCH", payload));
  return readApiResponse<CommerceStoreResponse>(response, "Unable to update merchant store.");
}

export async function listMerchantProductCategories(params: ListParams = {}) {
  const response = await authenticatedBackendFetch(`/merchant/commerce/categories?${paginationParams(params)}`);

  if (response.status === 404) {
    return emptyPage<ProductCategoryResponse>();
  }

  return readApiResponse<PageResponse<ProductCategoryResponse>>(response, "Unable to load product categories.");
}

export async function createMerchantProductCategory(payload: CreateProductCategoryRequest) {
  const response = await authenticatedBackendFetch("/merchant/commerce/categories", jsonRequest("POST", payload));
  return readApiResponse<ProductCategoryResponse>(response, "Unable to create product category.");
}

export async function updateMerchantProductCategory(categoryId: string, payload: UpdateProductCategoryRequest) {
  const response = await authenticatedBackendFetch(
    `/merchant/commerce/categories/${categoryId}`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<ProductCategoryResponse>(response, "Unable to update product category.");
}

export async function deleteMerchantProductCategory(categoryId: string) {
  const response = await authenticatedBackendFetch(`/merchant/commerce/categories/${categoryId}`, { method: "DELETE" });
  return readEmptyResponse(response, "Unable to delete product category.");
}

export async function listMerchantProducts(params: ListParams = {}) {
  const response = await authenticatedBackendFetch(`/merchant/commerce/products?${paginationParams(params)}`);

  if (response.status === 404) {
    return emptyPage<ProductResponse>();
  }

  return readApiResponse<PageResponse<ProductResponse>>(response, "Unable to load products.");
}

export async function createMerchantProduct(payload: CreateProductRequest) {
  const response = await authenticatedBackendFetch("/merchant/commerce/products", jsonRequest("POST", payload));
  return readApiResponse<ProductResponse>(response, "Unable to create product.");
}

export async function updateMerchantProduct(productId: string, payload: UpdateProductRequest) {
  const response = await authenticatedBackendFetch(
    `/merchant/commerce/products/${productId}`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<ProductResponse>(response, "Unable to update product.");
}

export async function deleteMerchantProduct(productId: string) {
  const response = await authenticatedBackendFetch(`/merchant/commerce/products/${productId}`, { method: "DELETE" });
  return readEmptyResponse(response, "Unable to delete product.");
}

export async function uploadMerchantProductImage(productId: string, formData: FormData) {
  const response = await authenticatedBackendFetch(`/merchant/commerce/products/${productId}/images`, {
    body: formData,
    method: "POST",
  });
  return readApiResponse<ProductImageResponse>(response, "Unable to upload product image.");
}

export async function deleteMerchantProductImage(productId: string, imageId: string) {
  const response = await authenticatedBackendFetch(`/merchant/commerce/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
  return readEmptyResponse(response, "Unable to delete product image.");
}

export async function fetchMerchantProductImageFile(productId: string, imageId: string) {
  const response = await authenticatedBackendFetch(`/merchant/commerce/products/${productId}/images/${imageId}/file`);

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

export async function listMerchantOrders(params: ListParams & SalesFilterParams = {}) {
  const query = paginationParams(params);
  appendSalesFilters(query, params);

  const response = await authenticatedBackendFetch(`/merchant/commerce/orders?${query}`);
  return readApiResponse<PageResponse<CommerceOrderResponse>>(response, "Unable to load merchant orders.");
}

export async function getMerchantSalesSummary(params: SalesFilterParams = {}) {
  const query = new URLSearchParams();
  appendSalesFilters(query, params);

  const response = await authenticatedBackendFetch(`/merchant/commerce/sales-summary?${query}`);
  return readApiResponse<CommerceSalesSummaryResponse>(response, "Unable to load sales summary.");
}

export async function exportMerchantSalesCsv(params: SalesFilterParams = {}) {
  const query = new URLSearchParams();
  appendSalesFilters(query, params);

  const response = await authenticatedBackendFetch(`/merchant/commerce/sales-export?${query}`);
  return readDownloadFile(response, "Unable to export sales.");
}

export async function getMerchantOrder(orderId: string) {
  const response = await authenticatedBackendFetch(`/merchant/commerce/orders/${orderId}`);
  return readApiResponse<CommerceOrderResponse>(response, "Unable to load merchant order.");
}

export async function changeMerchantOrderStatus(orderId: string, payload: UpdateCommerceOrderStatusRequest) {
  const response = await authenticatedBackendFetch(
    `/merchant/commerce/orders/${orderId}/status`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<CommerceOrderResponse>(response, "Unable to update merchant order status.");
}

export async function listMerchantOrderPaymentIntents(orderId: string) {
  const response = await authenticatedBackendFetch(`/merchant/commerce/orders/${orderId}/payment-intents`);
  return readApiResponse<CommercePaymentIntentResponse[]>(response, "Unable to load merchant payment intents.");
}

export async function listAdminCommerceStores(params: ListParams & { status?: string } = {}) {
  const query = paginationParams(params);
  if (params.status) {
    query.set("status", params.status);
  }

  const response = await authenticatedBackendFetch(`/commerce/admin/stores?${query}`);
  return readApiResponse<PageResponse<CommerceStoreResponse>>(response, "Unable to load commerce stores.");
}

export async function getAdminCommerceStore(storeId: string) {
  const response = await authenticatedBackendFetch(`/commerce/admin/stores/${storeId}`);
  return readApiResponse<CommerceStoreResponse>(response, "Unable to load commerce store.");
}

export async function updateAdminCommerceStore(storeId: string, payload: UpdateCommerceStoreRequest) {
  const response = await authenticatedBackendFetch(`/commerce/admin/stores/${storeId}`, jsonRequest("PATCH", payload));
  return readApiResponse<CommerceStoreResponse>(response, "Unable to update commerce store.");
}

export async function listAdminBusinessProductCategories(businessId: string, params: ListParams = {}) {
  const response = await authenticatedBackendFetch(
    `/commerce/admin/businesses/${businessId}/categories?${paginationParams(params)}`,
  );
  return readApiResponse<PageResponse<ProductCategoryResponse>>(response, "Unable to load product categories.");
}

export async function updateAdminProductCategory(categoryId: string, payload: UpdateProductCategoryRequest) {
  const response = await authenticatedBackendFetch(
    `/commerce/admin/categories/${categoryId}`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<ProductCategoryResponse>(response, "Unable to update product category.");
}

export async function deleteAdminProductCategory(categoryId: string) {
  const response = await authenticatedBackendFetch(`/commerce/admin/categories/${categoryId}`, { method: "DELETE" });
  return readEmptyResponse(response, "Unable to delete product category.");
}

export async function listAdminBusinessProducts(businessId: string, params: ListParams & { q?: string } = {}) {
  const query = paginationParams(params);
  if (params.q) {
    query.set("q", params.q);
  }

  const response = await authenticatedBackendFetch(`/commerce/admin/businesses/${businessId}/products?${query}`);
  return readApiResponse<PageResponse<ProductResponse>>(response, "Unable to load products.");
}

export async function listAdminBusinessOrders(businessId: string, params: ListParams & SalesFilterParams = {}) {
  const query = paginationParams(params);
  appendSalesFilters(query, params);

  const response = await authenticatedBackendFetch(`/commerce/admin/businesses/${businessId}/orders?${query}`);
  return readApiResponse<PageResponse<CommerceOrderResponse>>(response, "Unable to load commerce orders.");
}

export async function getAdminBusinessSalesSummary(businessId: string, params: SalesFilterParams = {}) {
  const query = new URLSearchParams();
  appendSalesFilters(query, params);

  const response = await authenticatedBackendFetch(`/commerce/admin/businesses/${businessId}/sales-summary?${query}`);
  return readApiResponse<CommerceSalesSummaryResponse>(response, "Unable to load sales summary.");
}

export async function exportAdminBusinessSalesCsv(businessId: string, params: SalesFilterParams = {}) {
  const query = new URLSearchParams();
  appendSalesFilters(query, params);

  const response = await authenticatedBackendFetch(`/commerce/admin/businesses/${businessId}/sales-export?${query}`);
  return readDownloadFile(response, "Unable to export sales.");
}

export async function getAdminCommerceOrder(orderId: string) {
  const response = await authenticatedBackendFetch(`/commerce/admin/orders/${orderId}`);
  return readApiResponse<CommerceOrderResponse>(response, "Unable to load commerce order.");
}

export async function listAdminOrderPaymentIntents(orderId: string) {
  const response = await authenticatedBackendFetch(`/commerce/admin/orders/${orderId}/payment-intents`);
  return readApiResponse<CommercePaymentIntentResponse[]>(response, "Unable to load commerce payment intents.");
}

export async function changeAdminPaymentIntentStatus(
  paymentIntentId: string,
  payload: UpdateCommercePaymentIntentStatusRequest,
) {
  const response = await authenticatedBackendFetch(
    `/commerce/admin/payment-intents/${paymentIntentId}/status`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<CommercePaymentIntentResponse>(response, "Unable to update commerce payment intent status.");
}

export async function changeAdminCommerceOrderStatus(orderId: string, payload: UpdateCommerceOrderStatusRequest) {
  const response = await authenticatedBackendFetch(
    `/commerce/admin/orders/${orderId}/status`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<CommerceOrderResponse>(response, "Unable to update commerce order status.");
}

export async function changeAdminCommerceOrderPaymentStatus(
  orderId: string,
  payload: UpdateCommerceOrderPaymentStatusRequest,
) {
  const response = await authenticatedBackendFetch(
    `/commerce/admin/orders/${orderId}/payment-status`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<CommerceOrderResponse>(response, "Unable to update commerce order payment status.");
}

export async function updateAdminProduct(productId: string, payload: UpdateProductRequest) {
  const response = await authenticatedBackendFetch(
    `/commerce/admin/products/${productId}`,
    jsonRequest("PATCH", payload),
  );
  return readApiResponse<ProductResponse>(response, "Unable to update product.");
}

export async function uploadAdminProductImage(productId: string, formData: FormData) {
  const response = await authenticatedBackendFetch(`/commerce/admin/products/${productId}/images`, {
    body: formData,
    method: "POST",
  });
  return readApiResponse<ProductImageResponse>(response, "Unable to upload product image.");
}

export async function setAdminProductImagePrimary(productId: string, imageId: string) {
  const response = await authenticatedBackendFetch(`/commerce/admin/products/${productId}/images/${imageId}/primary`, {
    method: "PATCH",
  });
  return readApiResponse<ProductImageResponse>(response, "Unable to update primary product image.");
}

export async function deleteAdminProductImage(productId: string, imageId: string) {
  const response = await authenticatedBackendFetch(`/commerce/admin/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
  return readEmptyResponse(response, "Unable to delete product image.");
}

export async function fetchAdminProductImageFile(productId: string, imageId: string) {
  const response = await authenticatedBackendFetch(`/commerce/admin/products/${productId}/images/${imageId}/file`);

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

function paginationParams({ page = 0, size = 100, sort = "createdAt,desc" }: ListParams) {
  return new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
}

function appendSalesFilters(query: URLSearchParams, params: SalesFilterParams) {
  if (params.status) {
    query.set("status", params.status);
  }
  if (params.paymentStatus) {
    query.set("paymentStatus", params.paymentStatus);
  }
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.from) {
    query.set("from", params.from);
  }
  if (params.to) {
    query.set("to", params.to);
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

async function readEmptyResponse(response: Response, fallbackMessage: string) {
  const apiResponse = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

  if (!response.ok || !apiResponse?.success) {
    throw new Error(apiResponse?.message ?? fallbackMessage);
  }
}

async function readDownloadFile(response: Response, fallbackMessage: string): Promise<DownloadFile> {
  if (!response.ok) {
    const apiResponse = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(apiResponse?.message ?? fallbackMessage);
  }

  return {
    body: await response.arrayBuffer(),
    contentDisposition: response.headers.get("content-disposition"),
    contentLength: response.headers.get("content-length"),
    contentType: response.headers.get("content-type") ?? "text/csv;charset=utf-8",
  };
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
