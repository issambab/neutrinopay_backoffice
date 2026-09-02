import type { PageResponse } from "@/lib/iam/iam.types";
import type { LifecycleStatus } from "@/lib/organization/organization.types";

export type { LifecycleStatus, PageResponse };

export type CommerceStoreResponse = {
  id: string;
  tenantId: string;
  businessId: string;
  businessName: string;
  slug: string;
  displayName: string;
  description?: string | null;
  status: LifecycleStatus;
  themeConfig?: Record<string, unknown> | null;
  contactConfig?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type ProductCategoryResponse = {
  id: string;
  tenantId: string;
  businessId: string;
  storeId: string;
  name: string;
  slug: string;
  description?: string | null;
  status: LifecycleStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string | null;
};

export type ProductImageResponse = {
  id: string;
  productId: string;
  storageReference: string;
  url?: string | null;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  sortOrder: number;
  primary: boolean;
  createdAt: string;
};

export type ProductResponse = {
  id: string;
  tenantId: string;
  businessId: string;
  storeId: string;
  categoryId?: string | null;
  categoryName?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  sku?: string | null;
  priceAmount: number | string;
  currency: string;
  stockQuantity: number;
  status: LifecycleStatus;
  images: ProductImageResponse[];
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type CreateCommerceStoreRequest = {
  slug?: string | null;
  displayName: string;
  description?: string | null;
  status?: LifecycleStatus | null;
  themeConfig?: Record<string, unknown> | null;
  contactConfig?: Record<string, unknown> | null;
};

export type UpdateCommerceStoreRequest = Partial<CreateCommerceStoreRequest>;

export type CreateProductCategoryRequest = {
  name: string;
  slug?: string | null;
  description?: string | null;
  status?: LifecycleStatus | null;
  sortOrder?: number | null;
};

export type UpdateProductCategoryRequest = Partial<CreateProductCategoryRequest>;

export type CreateProductRequest = {
  categoryId?: string | null;
  name: string;
  slug?: string | null;
  description?: string | null;
  sku?: string | null;
  priceAmount: number;
  stockQuantity?: number | null;
  status?: LifecycleStatus | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateProductRequest = Partial<CreateProductRequest>;

export type CommerceOrderStatus = "draft" | "pending" | "confirmed" | "preparing" | "ready" | "cancelled" | "fulfilled";
export type CommercePaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
export type CommercePaymentIntentStatus = "created" | "pending" | "paid" | "failed" | "cancelled" | "refunded";

export type CreateCommerceOrderItemRequest = {
  productId: string;
  quantity: number;
};

export type CreateCommerceOrderRequest = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddressLine1?: string | null;
  customerCity?: string | null;
  notes?: string | null;
  items: CreateCommerceOrderItemRequest[];
  metadata?: Record<string, unknown> | null;
};

export type LookupCommerceOrderRequest = {
  orderNumber: string;
  customerPhone: string;
};

export type CommerceOrderItemResponse = {
  id: string;
  productId?: string | null;
  productName: string;
  productSku?: string | null;
  quantity: number;
  unitPriceAmount: number | string;
  lineTotalAmount: number | string;
  currency: string;
  createdAt?: string | null;
};

export type CommerceOrderEventResponse = {
  id: string;
  status: CommerceOrderStatus;
  eventType: string;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string | null;
  createdBy?: string | null;
};

export type CommerceOrderResponse = {
  id: string;
  tenantId: string;
  businessId: string;
  businessName: string;
  storeId: string;
  storeSlug: string;
  storeDisplayName: string;
  orderNumber: string;
  status: CommerceOrderStatus;
  paymentStatus: CommercePaymentStatus;
  currency: string;
  subtotalAmount: number | string;
  totalAmount: number | string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddressLine1?: string | null;
  customerCity?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  items: CommerceOrderItemResponse[];
  events: CommerceOrderEventResponse[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateCommercePaymentIntentRequest = {
  provider?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type CommercePaymentIntentResponse = {
  id: string;
  tenantId: string;
  businessId: string;
  storeId: string;
  orderId: string;
  orderNumber: string;
  provider: string;
  providerReference?: string | null;
  checkoutReference: string;
  status: CommercePaymentIntentStatus;
  amount: number | string;
  currency: string;
  expiresAt?: string | null;
  confirmedAt?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CommerceSalesSummaryResponse = {
  currency: string;
  totalOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  unpaidPaymentOrders: number;
  pendingPaymentOrders: number;
  failedPaymentOrders: number;
  paidRevenue: number | string;
  refundedAmount: number | string;
  averagePaidBasket: number | string;
  netRevenue: number | string;
  cashChangeAmount: number | string;
  walletChangeAmount: number | string;
  walletChangeCount: number;
};

export type UpdateCommerceOrderStatusRequest = {
  status: CommerceOrderStatus;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateCommerceOrderPaymentStatusRequest = {
  paymentStatus: CommercePaymentStatus;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateCommercePaymentIntentStatusRequest = {
  status: CommercePaymentIntentStatus;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};
