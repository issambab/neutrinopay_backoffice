"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  ImageIcon,
  PackageCheck,
  Pencil,
  Phone,
  ReceiptText,
  Search,
  Star,
  Store,
  Tags,
  Trash2,
  TrendingUp,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { CommerceOrderDetail } from "@/components/commerce/commerce-order-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  CommerceOrderResponse,
  CommerceOrderStatus,
  CommercePaymentStatus,
  CommerceSalesSummaryResponse,
  CommerceStoreResponse,
  LifecycleStatus,
  PageResponse,
  ProductCategoryResponse,
  ProductImageResponse,
  ProductResponse,
  UpdateProductCategoryRequest,
  UpdateProductRequest,
} from "@/lib/commerce/commerce.types";
import {
  commerceStatusClassName,
  formatCommerceStatus,
  formatMoney,
  formatOrderStatus,
  formatPaymentStatus,
  orderStatusClassName,
  paymentStatusClassName,
} from "@/lib/commerce/commerce-format";

type StoresAdminPanelProps = {
  categories: ProductCategoryResponse[];
  orderFilters: {
    page: number;
    q: string;
    size: number;
    status: CommerceOrderStatus | "";
  };
  orders: CommerceOrderResponse[];
  ordersPage: PageResponse<CommerceOrderResponse>;
  pendingOrders: number;
  productFilters: {
    page: number;
    q: string;
    size: number;
  };
  products: PageResponse<ProductResponse>;
  salesFilters: {
    from: string;
    page: number;
    paymentStatus: CommercePaymentStatus | "";
    period: PeriodFilter;
    q: string;
    size: number;
    status: CommerceOrderStatus | "";
    to: string;
  };
  salesOrders: CommerceOrderResponse[];
  salesOrdersPage: PageResponse<CommerceOrderResponse>;
  salesSummary: CommerceSalesSummaryResponse;
  selectedStore: CommerceStoreResponse;
};

const STATUS_OPTIONS: LifecycleStatus[] = ["pending", "active", "suspended", "archived"];
const PRODUCT_SIZE_OPTIONS = [8, 16, 32];
const ORDER_STATUSES: (CommerceOrderStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "fulfilled",
  "cancelled",
];
const ORDER_SIZE_OPTIONS = [8, 16, 32];
const PAYMENT_STATUSES: (CommercePaymentStatus | "all")[] = ["all", "unpaid", "pending", "paid", "failed", "refunded"];
const SALES_SIZE_OPTIONS = [10, 20, 50];
const LOW_STOCK_THRESHOLD = 5;
const STORE_TABS = ["overview", "products", "categories", "orders", "sales"] as const;

type PeriodFilter = "all" | "today" | "7d" | "30d" | "custom";
type StoreTab = (typeof STORE_TABS)[number];

export function StoresAdminPanel({
  categories,
  orderFilters,
  orders,
  ordersPage,
  pendingOrders,
  productFilters,
  products,
  salesFilters,
  salesOrders,
  salesOrdersPage,
  salesSummary,
  selectedStore,
}: StoresAdminPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = normalizeStoreTab(searchParams.get("tab"));
  const [editOpen, setEditOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ProductCategoryResponse | null>(null);
  const [editProduct, setEditProduct] = useState<ProductResponse | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [orderQuery, setOrderQuery] = useState(orderFilters.q);
  const [orderStatus, setOrderStatus] = useState<CommerceOrderStatus | "all">(orderFilters.status || "all");
  const [productQuery, setProductQuery] = useState(productFilters.q);
  const [salesFromDate, setSalesFromDate] = useState(salesFilters.from);
  const [salesPaymentStatus, setSalesPaymentStatus] = useState<CommercePaymentStatus | "all">(
    salesFilters.paymentStatus || "all",
  );
  const [salesPeriod, setSalesPeriod] = useState<PeriodFilter>(salesFilters.period);
  const [salesQuery, setSalesQuery] = useState(salesFilters.q);
  const [salesStatus, setSalesStatus] = useState<CommerceOrderStatus | "all">(salesFilters.status || "all");
  const [salesToDate, setSalesToDate] = useState(salesFilters.to);
  const [selectedSale, setSelectedSale] = useState<CommerceOrderResponse | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? "");
  const [visibleOrders, setVisibleOrders] = useState(orders);
  const productItems = products.content;
  const [visibleSalesOrders, setVisibleSalesOrders] = useState(salesOrders);
  const overview = useMemo(
    () => buildStoreOverview(selectedStore, productItems, visibleOrders),
    [productItems, selectedStore, visibleOrders],
  );
  const productTotalPages = Math.max(1, products.totalPages);
  const orderTotalPages = Math.max(1, ordersPage.totalPages);
  const salesTotalPages = Math.max(1, salesOrdersPage.totalPages);
  const currentProductPage = Math.min(products.page, productTotalPages - 1);
  const currentOrderPage = Math.min(ordersPage.page, orderTotalPages - 1);
  const currentSalesPage = Math.min(salesOrdersPage.page, salesTotalPages - 1);
  const selectedOrder = visibleOrders.find((order) => order.id === selectedOrderId) ?? visibleOrders[0] ?? null;

  useEffect(() => {
    setVisibleOrders(orders);
    setSelectedOrderId(orders[0]?.id ?? "");
  }, [orders]);

  useEffect(() => {
    setVisibleSalesOrders(salesOrders);
    setSelectedSale(null);
  }, [salesOrders]);

  useEffect(() => {
    setOrderQuery(orderFilters.q);
    setOrderStatus(orderFilters.status || "all");
  }, [orderFilters.q, orderFilters.status]);

  useEffect(() => {
    setProductQuery(productFilters.q);
  }, [productFilters.q]);

  useEffect(() => {
    setSalesFromDate(salesFilters.from);
    setSalesPaymentStatus(salesFilters.paymentStatus || "all");
    setSalesPeriod(salesFilters.period);
    setSalesQuery(salesFilters.q);
    setSalesStatus(salesFilters.status || "all");
    setSalesToDate(salesFilters.to);
  }, [
    salesFilters.from,
    salesFilters.paymentStatus,
    salesFilters.period,
    salesFilters.q,
    salesFilters.status,
    salesFilters.to,
  ]);

  function updateSalesPeriod(nextPeriod: PeriodFilter) {
    setSalesPeriod(nextPeriod);
    if (nextPeriod !== "custom") {
      setSalesFromDate("");
      setSalesToDate("");
    }
    updateSalesFilters({
      from: "",
      page: 0,
      period: nextPeriod,
      to: "",
    });
  }

  function updateTab(nextTab: string) {
    const tab = normalizeStoreTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());

    if (tab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function updateProductFilters(updates: Partial<typeof productFilters>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "products");

    const nextPage = updates.page ?? productFilters.page;
    const nextSize = updates.size ?? productFilters.size;
    const nextQuery = updates.q ?? productFilters.q;

    if (nextPage > 0) {
      params.set("productsPage", String(nextPage));
    } else {
      params.delete("productsPage");
    }

    if (PRODUCT_SIZE_OPTIONS.includes(nextSize) && nextSize !== PRODUCT_SIZE_OPTIONS[0]) {
      params.set("productsSize", String(nextSize));
    } else {
      params.delete("productsSize");
    }

    if (nextQuery.trim()) {
      params.set("productsQ", nextQuery.trim());
    } else {
      params.delete("productsQ");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function submitProductSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProductFilters({ page: 0, q: productQuery });
  }

  function updateOrderFilters(updates: Partial<typeof orderFilters>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "orders");

    const nextPage = updates.page ?? orderFilters.page;
    const nextSize = updates.size ?? orderFilters.size;
    const nextQuery = updates.q ?? orderFilters.q;
    const nextStatus = updates.status ?? orderFilters.status;

    if (nextPage > 0) {
      params.set("ordersPage", String(nextPage));
    } else {
      params.delete("ordersPage");
    }

    if (ORDER_SIZE_OPTIONS.includes(nextSize) && nextSize !== ORDER_SIZE_OPTIONS[0]) {
      params.set("ordersSize", String(nextSize));
    } else {
      params.delete("ordersSize");
    }

    if (nextQuery.trim()) {
      params.set("ordersQ", nextQuery.trim());
    } else {
      params.delete("ordersQ");
    }

    if (nextStatus) {
      params.set("ordersStatus", nextStatus);
    } else {
      params.delete("ordersStatus");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function submitOrderSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateOrderFilters({ page: 0, q: orderQuery });
  }

  function updateSalesFilters(updates: Partial<typeof salesFilters>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "sales");

    const nextPage = updates.page ?? salesFilters.page;
    const nextSize = updates.size ?? salesFilters.size;
    const nextQuery = updates.q ?? salesFilters.q;
    const nextStatus = updates.status ?? salesFilters.status;
    const nextPaymentStatus = updates.paymentStatus ?? salesFilters.paymentStatus;
    const nextPeriod = updates.period ?? salesFilters.period;
    const nextFrom = updates.from ?? salesFilters.from;
    const nextTo = updates.to ?? salesFilters.to;

    if (nextPage > 0) {
      params.set("salesPage", String(nextPage));
    } else {
      params.delete("salesPage");
    }

    if (SALES_SIZE_OPTIONS.includes(nextSize) && nextSize !== SALES_SIZE_OPTIONS[0]) {
      params.set("salesSize", String(nextSize));
    } else {
      params.delete("salesSize");
    }

    if (nextQuery.trim()) {
      params.set("salesQ", nextQuery.trim());
    } else {
      params.delete("salesQ");
    }

    if (nextStatus) {
      params.set("salesStatus", nextStatus);
    } else {
      params.delete("salesStatus");
    }

    if (nextPaymentStatus) {
      if (nextPaymentStatus === "paid") {
        params.delete("salesPaymentStatus");
      } else {
        params.set("salesPaymentStatus", nextPaymentStatus);
      }
    } else {
      params.set("salesPaymentStatus", "all");
    }

    if (nextPeriod === "30d") {
      params.delete("salesPeriod");
    } else {
      params.set("salesPeriod", nextPeriod);
    }

    if (nextPeriod === "custom") {
      if (nextFrom) {
        params.set("salesFrom", nextFrom);
      } else {
        params.delete("salesFrom");
      }

      if (nextTo) {
        params.set("salesTo", nextTo);
      } else {
        params.delete("salesTo");
      }
    } else {
      params.delete("salesFrom");
      params.delete("salesTo");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function submitSalesSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSalesFilters({ page: 0, q: salesQuery });
  }

  function exportSalesCsv() {
    const params = new URLSearchParams();
    appendFilterParam(params, "status", salesFilters.status);
    appendFilterParam(params, "paymentStatus", salesFilters.paymentStatus);
    appendFilterParam(params, "q", salesFilters.q);
    appendFilterParam(params, "from", salesFilters.from);
    appendFilterParam(params, "to", salesFilters.to);
    const queryString = params.toString();
    window.location.assign(
      `/api/commerce/admin/businesses/${selectedStore.businessId}/sales-export${queryString ? `?${queryString}` : ""}`,
    );
  }

  async function saveStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStore) {
      return;
    }

    setIsBusy(true);
    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        contactConfig: {
          email: textValue(formData, "contactEmail"),
          phone: textValue(formData, "contactPhone"),
        },
        description: textValue(formData, "description"),
        displayName: textValue(formData, "displayName"),
        slug: textValue(formData, "slug"),
        status: formData.get("status"),
        themeConfig: {
          accentColor: textValue(formData, "accentColor"),
        },
      };
      const response = await fetch(`/api/commerce/admin/stores/${selectedStore.id}`, jsonRequest("PATCH", payload));
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        store?: CommerceStoreResponse;
      } | null;

      if (!response.ok || !result?.store) {
        toast.error(result?.message ?? "Impossible d'enregistrer la boutique.");
        return;
      }

      toast.success("Boutique mise a jour.");
      setEditOpen(false);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editProduct) {
      return;
    }

    setIsBusy(true);
    try {
      const formData = new FormData(event.currentTarget);
      const payload: UpdateProductRequest = {
        categoryId: textValue(formData, "categoryId") || null,
        description: textValue(formData, "description"),
        name: textValue(formData, "name"),
        priceAmount: numberValue(formData, "priceAmount"),
        sku: textValue(formData, "sku"),
        slug: textValue(formData, "slug"),
        status: formData.get("status") as LifecycleStatus,
        stockQuantity: numberValue(formData, "stockQuantity"),
      };
      const response = await fetch(`/api/commerce/admin/products/${editProduct.id}`, jsonRequest("PATCH", payload));
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        product?: ProductResponse;
      } | null;

      if (!response.ok || !result?.product) {
        toast.error(result?.message ?? "Impossible d'enregistrer le produit.");
        return;
      }

      toast.success("Produit mis a jour.");
      setEditProduct(null);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editCategory) {
      return;
    }

    setIsBusy(true);
    try {
      const formData = new FormData(event.currentTarget);
      const payload: UpdateProductCategoryRequest = {
        description: textValue(formData, "description"),
        name: textValue(formData, "name"),
        slug: textValue(formData, "slug"),
        sortOrder: numberValue(formData, "sortOrder"),
        status: formData.get("status") as LifecycleStatus,
      };
      const response = await fetch(`/api/commerce/admin/categories/${editCategory.id}`, jsonRequest("PATCH", payload));
      const result = (await response.json().catch(() => null)) as {
        category?: ProductCategoryResponse;
        message?: string;
      } | null;

      if (!response.ok || !result?.category) {
        toast.error(result?.message ?? "Impossible d'enregistrer la categorie.");
        return;
      }

      toast.success("Categorie mise a jour.");
      setEditCategory(null);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteCategory(category: ProductCategoryResponse) {
    if (!window.confirm(`Supprimer la categorie "${category.name}" ?`)) {
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch(`/api/commerce/admin/categories/${category.id}`, { method: "DELETE" });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        toast.error(result?.message ?? "Impossible de supprimer la categorie.");
        return;
      }

      toast.success("Categorie supprimee.");
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function uploadProductImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editProduct) {
      return;
    }

    setIsBusy(true);
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch(`/api/commerce/admin/products/${editProduct.id}/images`, {
        body: formData,
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as {
        image?: ProductImageResponse;
        message?: string;
      } | null;

      if (!response.ok || !result?.image) {
        toast.error(result?.message ?? "Impossible d'uploader l'image.");
        return;
      }

      toast.success("Image ajoutee.");
      event.currentTarget.reset();
      setEditProduct((product) => addProductImage(product, result.image));
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function setProductPrimaryImage(image: ProductImageResponse) {
    if (!editProduct) {
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch(`/api/commerce/admin/products/${editProduct.id}/images/${image.id}/primary`, {
        method: "PATCH",
      });
      const result = (await response.json().catch(() => null)) as {
        image?: ProductImageResponse;
        message?: string;
      } | null;

      if (!response.ok || !result?.image) {
        toast.error(result?.message ?? "Impossible de definir l'image principale.");
        return;
      }

      toast.success("Image principale mise a jour.");
      setEditProduct((product) => setPrimaryProductImage(product, result.image));
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteProductImage(image: ProductImageResponse) {
    if (!editProduct || !window.confirm("Supprimer cette image produit ?")) {
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch(`/api/commerce/admin/products/${editProduct.id}/images/${image.id}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        toast.error(result?.message ?? "Impossible de supprimer l'image.");
        return;
      }

      toast.success("Image supprimee.");
      setEditProduct((product) => removeProductImage(product, image.id));
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function changeOrderStatus(
    form: HTMLFormElement,
    order: CommerceOrderResponse,
    nextStatus: CommerceOrderStatus,
  ) {
    setIsBusy(true);
    try {
      const formData = new FormData(form);
      const response = await fetch(`/api/commerce/admin/orders/${order.id}/status`, {
        body: JSON.stringify({
          message: textValue(formData, "message"),
          metadata: {
            source: "admin_stores_panel",
            storeId: selectedStore?.id,
          },
          status: nextStatus,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        order?: CommerceOrderResponse;
      } | null;

      if (!response.ok || !result?.order) {
        toast.error(result?.message ?? "Impossible de changer le statut de la commande.");
        return;
      }

      setVisibleOrders((items) => items.map((item) => (item.id === result.order?.id ? result.order : item)));
      setVisibleSalesOrders((items) => items.map((item) => (item.id === result.order?.id ? result.order : item)));
      setSelectedOrderId(result.order.id);
      toast.success("Statut commande mis a jour.");
      form.reset();
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function changeOrderPaymentStatus(
    form: HTMLFormElement,
    order: CommerceOrderResponse,
    nextStatus: CommercePaymentStatus,
  ) {
    setIsBusy(true);
    try {
      const formData = new FormData(form);
      const response = await fetch(`/api/commerce/admin/orders/${order.id}/payment-status`, {
        body: JSON.stringify({
          message: textValue(formData, "paymentMessage"),
          metadata: {
            source: "admin_stores_panel",
            storeId: selectedStore?.id,
          },
          paymentStatus: nextStatus,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        order?: CommerceOrderResponse;
      } | null;

      if (!response.ok || !result?.order) {
        toast.error(result?.message ?? "Impossible de changer le statut paiement.");
        return;
      }

      const updatedOrder = result.order;
      setVisibleOrders((items) => items.map((item) => (item.id === updatedOrder.id ? updatedOrder : item)));
      setVisibleSalesOrders((items) => items.map((item) => (item.id === updatedOrder.id ? updatedOrder : item)));
      setSelectedOrderId(updatedOrder.id);
      setSelectedSale((sale) => (sale?.id === updatedOrder.id ? updatedOrder : sale));
      toast.success("Statut paiement mis a jour.");
      form.reset();
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="gap-3 border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{selectedStore.displayName}</CardTitle>
                <Badge variant="outline" className={commerceStatusClassName(selectedStore.status)}>
                  {formatCommerceStatus(selectedStore.status)}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">{selectedStore.businessName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/shop/${selectedStore.slug}`} target="_blank">
                  <ExternalLink className="size-4" />
                  Voir boutique
                </Link>
              </Button>
              <Button onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Modifier
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Info label="URL publique" value={`/shop/${selectedStore.slug}`} />
          <Info label="Business ID" value={selectedStore.businessId} />
          <Info label="Statut" value={formatCommerceStatus(selectedStore.status)} />
          <Info label="Description" value={selectedStore.description ?? "-"} />
          <Info label="Cree le" value={formatDate(selectedStore.createdAt)} />
          <Info label="Mis a jour" value={selectedStore.updatedAt ? formatDate(selectedStore.updatedAt) : "-"} />
        </CardContent>
      </Card>

      <Tabs onValueChange={updateTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-5 md:w-fit">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="size-5" />
                    Vue d'ensemble boutique
                  </CardTitle>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Synthese publication, catalogue, stock, commandes et encaissement.
                  </p>
                </div>
                <Badge className={commerceStatusClassName(selectedStore.status)} variant="outline">
                  {formatCommerceStatus(selectedStore.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SalesMetricCard
                  icon={TrendingUp}
                  label="CA encaisse"
                  value={formatMoney(overview.paidRevenue, overview.currency)}
                />
                <SalesMetricCard icon={ReceiptText} label="Commandes attente" value={String(overview.pendingOrders)} />
                <SalesMetricCard icon={PackageCheck} label="Produits actifs" value={overview.activeProductsLabel} />
                <SalesMetricCard icon={ImageIcon} label="Sans image" value={String(overview.productsWithoutImage)} />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="font-medium text-sm">Points de controle</div>
                    <Badge variant="secondary">{overview.alerts.length} alerte(s)</Badge>
                  </div>
                  {overview.alerts.length === 0 ? (
                    <EmptyPanel text="Aucun point bloquant detecte pour cette boutique." />
                  ) : (
                    <div className="grid gap-2">
                      {overview.alerts.map((alert) => (
                        <div className="rounded-md border bg-muted/20 p-3" key={alert.label}>
                          <div className="font-medium text-sm">{alert.label}</div>
                          <div className="mt-1 text-muted-foreground text-xs">{alert.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="font-medium text-sm">Dernieres commandes</div>
                    <Badge variant="secondary">{ordersPage.totalElements} total</Badge>
                  </div>
                  {overview.latestOrders.length === 0 ? (
                    <EmptyPanel text="Aucune commande pour cette boutique." />
                  ) : (
                    <div className="grid gap-2">
                      {overview.latestOrders.map((order) => (
                        <div
                          className="grid gap-2 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_auto]"
                          key={order.id}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium text-sm">{order.orderNumber}</div>
                            <div className="truncate text-muted-foreground text-xs">
                              {order.customerName} - {formatDate(order.createdAt)}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:justify-end">
                            <Badge className={orderStatusClassName(order.status)} variant="outline">
                              {formatOrderStatus(order.status)}
                            </Badge>
                            <Badge className={paymentStatusClassName(order.paymentStatus)} variant="outline">
                              {formatPaymentStatus(order.paymentStatus)}
                            </Badge>
                            <span className="font-medium text-sm">
                              {formatMoney(order.totalAmount, order.currency)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Info label="URL publique" value={`/shop/${selectedStore.slug}`} />
                <Info label="CA commandes confirmees" value={formatMoney(overview.orderedRevenue, overview.currency)} />
                <Info label="Stock faible" value={`${overview.lowStockProducts} produit(s)`} />
                <Info
                  label="Panier moyen encaisse"
                  value={formatMoney(overview.averagePaidBasket, overview.currency)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="products">
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Store className="size-5" />
                  Produits du marchand
                </CardTitle>
                <form
                  className="grid w-full gap-2 md:max-w-xl md:grid-cols-[minmax(0,1fr)_auto]"
                  onSubmit={submitProductSearch}
                >
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      onChange={(event) => setProductQuery(event.target.value)}
                      placeholder="Rechercher par nom de produit"
                      value={productQuery}
                    />
                  </div>
                  <Button type="submit" variant="outline">
                    Rechercher
                  </Button>
                </form>
              </div>
              <p className="text-muted-foreground text-sm">
                {products.content.length} produit(s) affiche(s) sur {products.totalElements}
              </p>
            </CardHeader>
            <CardContent>
              {products.empty && !productFilters.q ? (
                <EmptyPanel text="Aucun produit rattache a cette boutique." />
              ) : products.empty ? (
                <EmptyPanel text="Aucun produit ne correspond a cette recherche." />
              ) : (
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    {productItems.map((product) => (
                      <div
                        className="grid gap-3 rounded-md border p-3 md:grid-cols-[72px_minmax(0,1fr)_auto]"
                        key={product.id}
                      >
                        <ProductThumbnail product={product} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm">{product.name}</span>
                            <Badge variant="outline" className={commerceStatusClassName(product.status)}>
                              {formatCommerceStatus(product.status)}
                            </Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                            {product.description ?? "Aucune description."}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="secondary">{formatMoney(product.priceAmount, product.currency)}</Badge>
                            <Badge variant="secondary">Stock {product.stockQuantity}</Badge>
                            <Badge variant="secondary">{product.categoryName ?? "Sans categorie"}</Badge>
                          </div>
                        </div>
                        <div className="flex items-start justify-end">
                          <Button onClick={() => setEditProduct(product)} size="sm" variant="outline">
                            <Pencil className="size-4" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-muted-foreground text-sm">
                      Page {currentProductPage + 1} sur {productTotalPages}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <NativeSelect
                        onChange={(event) =>
                          updateProductFilters({
                            page: 0,
                            size: Number(event.target.value),
                          })
                        }
                        value={String(productFilters.size)}
                      >
                        {PRODUCT_SIZE_OPTIONS.map((size) => (
                          <NativeSelectOption key={size} value={String(size)}>
                            {size} par page
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                      <Button
                        disabled={products.first}
                        onClick={() => updateProductFilters({ page: Math.max(0, currentProductPage - 1) })}
                        size="sm"
                        variant="outline"
                      >
                        <ChevronLeft className="size-4" />
                        Precedent
                      </Button>
                      <Button
                        disabled={products.last}
                        onClick={() =>
                          updateProductFilters({ page: Math.min(productTotalPages - 1, currentProductPage + 1) })
                        }
                        size="sm"
                        variant="outline"
                      >
                        Suivant
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="size-5" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <EmptyPanel text="Aucune categorie rattachee a cette boutique." />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {categories.map((category) => (
                    <div className="rounded-md border p-3" key={category.id}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-sm">{category.name}</div>
                          <div className="text-muted-foreground text-xs">/{category.slug}</div>
                        </div>
                        <Badge variant="outline" className={commerceStatusClassName(category.status)}>
                          {formatCommerceStatus(category.status)}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
                        {category.description || "Aucune description."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button onClick={() => setEditCategory(category)} size="sm" variant="outline">
                          <Pencil className="size-4" />
                          Modifier
                        </Button>
                        <Button disabled={isBusy} onClick={() => deleteCategory(category)} size="sm" variant="outline">
                          <Trash2 className="size-4" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="orders">
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ReceiptText className="size-5" />
                  Commandes du marchand
                </CardTitle>
                <div className="text-muted-foreground text-sm">{pendingOrders} commande(s) en attente</div>
              </div>
              <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_220px]">
                <form className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={submitOrderSearch}>
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      onChange={(event) => setOrderQuery(event.target.value)}
                      placeholder="Recherche numero, client ou telephone"
                      value={orderQuery}
                    />
                  </div>
                  <Button type="submit" variant="outline">
                    Rechercher
                  </Button>
                </form>
                <NativeSelect
                  onChange={(event) => {
                    const value = event.target.value as CommerceOrderStatus | "all";
                    setOrderStatus(value);
                    updateOrderFilters({ page: 0, status: value === "all" ? "" : value });
                  }}
                  value={orderStatus}
                >
                  {ORDER_STATUSES.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {status === "all" ? "Tous les statuts" : formatOrderStatus(status)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </CardHeader>
            <CardContent>
              {visibleOrders.length === 0 ? (
                <EmptyPanel
                  text={
                    orderFilters.q || orderFilters.status
                      ? "Aucune commande ne correspond aux filtres."
                      : "Aucune commande rattachee a cette boutique."
                  }
                />
              ) : (
                <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
                  <div className="grid content-start gap-3">
                    {visibleOrders.map((order) => (
                      <button
                        className={`rounded-md border p-3 text-left transition hover:bg-muted/50 ${
                          selectedOrder?.id === order.id ? "border-primary bg-muted" : ""
                        }`}
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-sm">{order.orderNumber}</div>
                            <div className="truncate text-muted-foreground text-xs">{order.customerName}</div>
                          </div>
                          <Badge className={orderStatusClassName(order.status)} variant="outline">
                            {formatOrderStatus(order.status)}
                          </Badge>
                          <Badge className={paymentStatusClassName(order.paymentStatus)} variant="outline">
                            {formatPaymentStatus(order.paymentStatus)}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-1 truncate text-muted-foreground">
                            <Phone className="size-3.5" />
                            {order.customerPhone}
                          </span>
                          <span className="font-medium">{formatMoney(order.totalAmount, order.currency)}</span>
                        </div>
                      </button>
                    ))}
                    <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-muted-foreground text-sm">
                        Page {currentOrderPage + 1} sur {orderTotalPages} - {ordersPage.totalElements} commande(s)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <NativeSelect
                          onChange={(event) =>
                            updateOrderFilters({
                              page: 0,
                              size: Number(event.target.value),
                            })
                          }
                          value={String(orderFilters.size)}
                        >
                          {ORDER_SIZE_OPTIONS.map((size) => (
                            <NativeSelectOption key={size} value={String(size)}>
                              {size} par page
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                        <Button
                          disabled={ordersPage.first}
                          onClick={() => updateOrderFilters({ page: Math.max(0, currentOrderPage - 1) })}
                          size="sm"
                          variant="outline"
                        >
                          <ChevronLeft className="size-4" />
                          Precedent
                        </Button>
                        <Button
                          disabled={ordersPage.last}
                          onClick={() =>
                            updateOrderFilters({ page: Math.min(orderTotalPages - 1, currentOrderPage + 1) })
                          }
                          size="sm"
                          variant="outline"
                        >
                          Suivant
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {selectedOrder ? (
                    <CommerceOrderDetail
                      allowPaymentIntentManagement
                      isBusy={isBusy}
                      onPaymentStatusChange={changeOrderPaymentStatus}
                      onStatusChange={changeOrderStatus}
                      order={selectedOrder}
                      paymentIntentScope="admin"
                      showMerchantInfo
                    />
                  ) : (
                    <EmptyPanel text="Selectionnez une commande pour afficher le detail." />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sales">
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="size-5" />
                  Ventes du marchand
                </CardTitle>
                <Button disabled={salesOrdersPage.totalElements === 0} onClick={exportSalesCsv} variant="outline">
                  <Download className="size-4" />
                  Export CSV
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <SalesMetricCard
                  icon={TrendingUp}
                  label="CA encaisse"
                  value={formatMoney(salesSummary.paidRevenue, salesSummary.currency)}
                />
                <SalesMetricCard icon={ReceiptText} label="Commandes payees" value={String(salesSummary.paidOrders)} />
                <SalesMetricCard
                  icon={PackageCheck}
                  label="Panier moyen"
                  value={formatMoney(salesSummary.averagePaidBasket, salesSummary.currency)}
                />
                <SalesMetricCard icon={Ban} label="Annulees" value={String(salesSummary.cancelledOrders)} />
              </div>
              <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_180px_180px_170px_minmax(260px,1fr)]">
                <form className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={submitSalesSearch}>
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      onChange={(event) => setSalesQuery(event.target.value)}
                      placeholder="Commande, client ou telephone"
                      value={salesQuery}
                    />
                  </div>
                  <Button type="submit" variant="outline">
                    Rechercher
                  </Button>
                </form>
                <NativeSelect
                  onChange={(event) => {
                    const value = event.target.value as CommerceOrderStatus | "all";
                    setSalesStatus(value);
                    updateSalesFilters({ page: 0, status: value === "all" ? "" : value });
                  }}
                  value={salesStatus}
                >
                  {ORDER_STATUSES.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {status === "all" ? "Tous les statuts" : formatOrderStatus(status)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <NativeSelect
                  onChange={(event) => {
                    const value = event.target.value as CommercePaymentStatus | "all";
                    setSalesPaymentStatus(value);
                    updateSalesFilters({ page: 0, paymentStatus: value === "all" ? "" : value });
                  }}
                  value={salesPaymentStatus}
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {status === "all" ? "Tous paiements" : formatPaymentStatus(status)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <NativeSelect
                  onChange={(event) => updateSalesPeriod(event.target.value as PeriodFilter)}
                  value={salesPeriod}
                >
                  <NativeSelectOption value="today">Aujourd'hui</NativeSelectOption>
                  <NativeSelectOption value="7d">7 derniers jours</NativeSelectOption>
                  <NativeSelectOption value="30d">30 derniers jours</NativeSelectOption>
                  <NativeSelectOption value="all">Toutes les dates</NativeSelectOption>
                  <NativeSelectOption value="custom">Periode precise</NativeSelectOption>
                </NativeSelect>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <Input
                    disabled={salesPeriod !== "custom"}
                    onChange={(event) => setSalesFromDate(event.target.value)}
                    type="date"
                    value={salesFromDate}
                  />
                  <Input
                    disabled={salesPeriod !== "custom"}
                    onChange={(event) => setSalesToDate(event.target.value)}
                    type="date"
                    value={salesToDate}
                  />
                  <Button
                    disabled={salesPeriod !== "custom"}
                    onClick={() =>
                      updateSalesFilters({
                        from: salesFromDate,
                        page: 0,
                        period: "custom",
                        to: salesToDate,
                      })
                    }
                    type="button"
                    variant="outline"
                  >
                    Appliquer
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                {visibleSalesOrders.length} commande(s) affichee(s) sur {salesOrdersPage.totalElements}
              </p>
            </CardHeader>
            <CardContent>
              {visibleSalesOrders.length === 0 ? (
                <EmptyPanel text="Aucune vente ne correspond aux filtres." />
              ) : (
                <div className="grid gap-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Commande</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Paiement</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-12 text-right">Voir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleSalesOrders.map((order) => (
                        <TableRow
                          className="cursor-pointer"
                          key={order.id}
                          onClick={() => setSelectedSale(order)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedSale(order);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <TableCell>
                            <div className="font-medium">{order.orderNumber}</div>
                            <div className="text-muted-foreground text-xs">{order.items.length} ligne(s)</div>
                          </TableCell>
                          <TableCell>
                            <div>{order.customerName}</div>
                            <div className="text-muted-foreground text-xs">{order.customerPhone}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={orderStatusClassName(order.status)} variant="outline">
                              {formatOrderStatus(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={paymentStatusClassName(order.paymentStatus)} variant="outline">
                              {formatPaymentStatus(order.paymentStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMoney(order.totalAmount, order.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              aria-label={`Voir le detail de la commande ${order.orderNumber}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedSale(order);
                              }}
                              size="icon-sm"
                              type="button"
                              variant="ghost"
                            >
                              <Eye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-muted-foreground text-sm">
                      Page {currentSalesPage + 1} sur {salesTotalPages} - {salesOrdersPage.totalElements} vente(s)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <NativeSelect
                        onChange={(event) =>
                          updateSalesFilters({
                            page: 0,
                            size: Number(event.target.value),
                          })
                        }
                        value={String(salesFilters.size)}
                      >
                        {SALES_SIZE_OPTIONS.map((size) => (
                          <NativeSelectOption key={size} value={String(size)}>
                            {size} par page
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                      <Button
                        disabled={salesOrdersPage.first}
                        onClick={() => updateSalesFilters({ page: Math.max(0, currentSalesPage - 1) })}
                        size="sm"
                        variant="outline"
                      >
                        <ChevronLeft className="size-4" />
                        Precedent
                      </Button>
                      <Button
                        disabled={salesOrdersPage.last}
                        onClick={() =>
                          updateSalesFilters({ page: Math.min(salesTotalPages - 1, currentSalesPage + 1) })
                        }
                        size="sm"
                        variant="outline"
                      >
                        Suivant
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditStoreDialog
        isBusy={isBusy}
        onOpenChange={setEditOpen}
        onSubmit={saveStore}
        open={editOpen}
        store={selectedStore}
      />
      <EditProductDialog
        categories={categories}
        isBusy={isBusy}
        onDeleteImage={deleteProductImage}
        onOpenChange={(open) => {
          if (!open) {
            setEditProduct(null);
          }
        }}
        onSetPrimaryImage={setProductPrimaryImage}
        onSubmit={saveProduct}
        onUploadImage={uploadProductImage}
        product={editProduct}
      />
      <EditCategoryDialog
        category={editCategory}
        isBusy={isBusy}
        onOpenChange={(open) => {
          if (!open) {
            setEditCategory(null);
          }
        }}
        onSubmit={saveCategory}
      />
      <SalesOrderDialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSale(null);
          }
        }}
        order={selectedSale}
      />
    </div>
  );
}

function EditStoreDialog({
  isBusy,
  onOpenChange,
  onSubmit,
  open,
  store,
}: {
  isBusy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  store: CommerceStoreResponse | null;
}) {
  const contactConfig = store?.contactConfig ?? {};
  const themeConfig = store?.themeConfig ?? {};

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier la boutique</DialogTitle>
          <DialogDescription>Ces informations controlent la vitrine commerce publique du marchand.</DialogDescription>
        </DialogHeader>
        {store ? (
          <form className="grid gap-4" onSubmit={onSubmit}>
            <Field>
              <FieldLabel>Nom public</FieldLabel>
              <Input defaultValue={store.displayName} name="displayName" required />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Slug</FieldLabel>
                <Input defaultValue={store.slug} name="slug" required />
              </Field>
              <Field>
                <FieldLabel>Statut</FieldLabel>
                <NativeSelect name="status" defaultValue={store.status}>
                  {STATUS_OPTIONS.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {formatCommerceStatus(status)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea defaultValue={store.description ?? ""} name="description" rows={4} />
            </Field>
            <div className="grid gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel>Email contact</FieldLabel>
                <Input defaultValue={stringRecordValue(contactConfig, "email")} name="contactEmail" type="email" />
              </Field>
              <Field>
                <FieldLabel>Telephone contact</FieldLabel>
                <Input defaultValue={stringRecordValue(contactConfig, "phone")} name="contactPhone" />
              </Field>
              <Field>
                <FieldLabel>Couleur accent</FieldLabel>
                <Input
                  defaultValue={stringRecordValue(themeConfig, "accentColor")}
                  name="accentColor"
                  placeholder="#0f766e"
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button disabled={isBusy} type="submit">
                Enregistrer
              </Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditProductDialog({
  categories,
  isBusy,
  onDeleteImage,
  onOpenChange,
  onSetPrimaryImage,
  onSubmit,
  onUploadImage,
  product,
}: {
  categories: ProductCategoryResponse[];
  isBusy: boolean;
  onDeleteImage: (image: ProductImageResponse) => void;
  onOpenChange: (open: boolean) => void;
  onSetPrimaryImage: (image: ProductImageResponse) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUploadImage: (event: FormEvent<HTMLFormElement>) => void;
  product: ProductResponse | null;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(product)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le produit</DialogTitle>
          <DialogDescription>
            L'admin peut corriger le catalogue marchand apres controle operationnel.
          </DialogDescription>
        </DialogHeader>
        {product ? (
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Nom produit</FieldLabel>
                <Input defaultValue={product.name} name="name" required />
              </Field>
              <Field>
                <FieldLabel>Slug</FieldLabel>
                <Input defaultValue={product.slug} name="slug" required />
              </Field>
            </div>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea defaultValue={product.description ?? ""} name="description" rows={4} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Categorie</FieldLabel>
                <NativeSelect defaultValue={product.categoryId ?? ""} name="categoryId">
                  {product.categoryId ? null : <NativeSelectOption value="">Sans categorie</NativeSelectOption>}
                  {categories.map((category) => (
                    <NativeSelectOption key={category.id} value={category.id}>
                      {category.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel>Statut</FieldLabel>
                <NativeSelect defaultValue={product.status} name="status">
                  {STATUS_OPTIONS.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {formatCommerceStatus(status)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel>SKU</FieldLabel>
                <Input defaultValue={product.sku ?? ""} name="sku" />
              </Field>
              <Field>
                <FieldLabel>Prix</FieldLabel>
                <Input
                  defaultValue={String(product.priceAmount)}
                  min="0"
                  name="priceAmount"
                  required
                  step="0.001"
                  type="number"
                />
              </Field>
              <Field>
                <FieldLabel>Stock</FieldLabel>
                <Input
                  defaultValue={String(product.stockQuantity)}
                  min="0"
                  name="stockQuantity"
                  required
                  step="1"
                  type="number"
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button disabled={isBusy} type="submit">
                Enregistrer
              </Button>
            </div>
          </form>
        ) : null}
        {product ? (
          <div className="grid gap-3 border-t pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium text-sm">Images produit</div>
                <p className="text-muted-foreground text-xs">L'image principale est utilisee dans la boutique.</p>
              </div>
              <form className="flex flex-col gap-2 sm:flex-row" onSubmit={onUploadImage}>
                <Input accept="image/jpeg,image/png,image/webp" className="sm:w-64" name="file" required type="file" />
                <input name="primary" type="hidden" value={product.images.length === 0 ? "true" : "false"} />
                <Button disabled={isBusy} size="sm" type="submit" variant="outline">
                  <Upload className="size-4" />
                  Ajouter
                </Button>
              </form>
            </div>
            {product.images.length === 0 ? (
              <EmptyPanel text="Aucune image produit." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {product.images.map((image) => (
                  <div className="grid gap-2 rounded-md border p-2" key={image.id}>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                      <Image
                        alt={image.fileName}
                        className="object-cover"
                        fill
                        sizes="240px"
                        src={adminProductImageUrl(product.id, image.id)}
                        unoptimized
                      />
                      {image.primary ? (
                        <Badge className="absolute top-2 left-2" variant="secondary">
                          Principale
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={isBusy || image.primary}
                        onClick={() => onSetPrimaryImage(image)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Star className="size-4" />
                        Principale
                      </Button>
                      <Button
                        disabled={isBusy}
                        onClick={() => onDeleteImage(image)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Trash2 className="size-4" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditCategoryDialog({
  category,
  isBusy,
  onOpenChange,
  onSubmit,
}: {
  category: ProductCategoryResponse | null;
  isBusy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(category)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Modifier la categorie</DialogTitle>
          <DialogDescription>Les changements peuvent affecter la visibilite des produits publics.</DialogDescription>
        </DialogHeader>
        {category ? (
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Nom categorie</FieldLabel>
                <Input defaultValue={category.name} name="name" required />
              </Field>
              <Field>
                <FieldLabel>Slug</FieldLabel>
                <Input defaultValue={category.slug} name="slug" required />
              </Field>
            </div>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea defaultValue={category.description ?? ""} name="description" rows={4} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Statut</FieldLabel>
                <NativeSelect defaultValue={category.status} name="status">
                  {STATUS_OPTIONS.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {formatCommerceStatus(status)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel>Ordre</FieldLabel>
                <Input defaultValue={String(category.sortOrder)} min="0" name="sortOrder" step="1" type="number" />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button disabled={isBusy} type="submit">
                Enregistrer
              </Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SalesOrderDialog({
  onOpenChange,
  order,
}: {
  onOpenChange: (open: boolean) => void;
  order: CommerceOrderResponse | null;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(order)}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{order?.orderNumber ?? "Detail vente"}</DialogTitle>
          <DialogDescription>Detail client, produits vendus et historique de traitement.</DialogDescription>
        </DialogHeader>
        {order ? (
          <div className="max-h-[72vh] overflow-y-auto pr-1">
            <CommerceOrderDetail
              allowPaymentIntentManagement
              order={order}
              paymentIntentScope="admin"
              readonly
              showMerchantInfo
              variant="dialog"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SalesMetricCard({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="font-semibold text-lg">{value}</p>
        </div>
        <Icon className="size-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 break-words font-medium text-sm">{value}</div>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">{text}</div>;
}

function normalizeStoreTab(value: string | null) {
  return STORE_TABS.includes(value as StoreTab) ? (value as StoreTab) : "overview";
}

function ProductThumbnail({ product }: { product: ProductResponse }) {
  const image = primaryImage(product);

  return (
    <div className="relative size-[72px] overflow-hidden rounded-md border bg-muted">
      {image ? (
        <Image
          alt={product.name}
          className="object-cover"
          fill
          sizes="72px"
          src={adminProductImageUrl(product.id, image.id)}
          unoptimized
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <ImageIcon className="size-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function buildStoreOverview(
  store: CommerceStoreResponse | null,
  products: ProductResponse[],
  orders: CommerceOrderResponse[],
) {
  const activeProducts = products.filter((product) => product.status === "active");
  const productsWithoutImage = products.filter((product) => product.images.length === 0).length;
  const lowStockProducts = products.filter((product) => product.stockQuantity <= LOW_STOCK_THRESHOLD).length;
  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const paidOrders = orders.filter((order) => order.paymentStatus === "paid");
  const confirmedOrders = orders.filter((order) =>
    ["confirmed", "preparing", "ready", "fulfilled"].includes(order.status),
  );
  const currency = orders[0]?.currency ?? products[0]?.currency ?? "TND";
  const paidRevenue = paidOrders.reduce((total, order) => total + Number(order.totalAmount), 0);
  const orderedRevenue = confirmedOrders.reduce((total, order) => total + Number(order.totalAmount), 0);
  const latestOrders = [...orders].sort(compareOrdersByCreatedAtDesc).slice(0, 5);
  const alerts = buildStoreAlerts(store, products, productsWithoutImage, lowStockProducts, pendingOrders);

  return {
    activeProductsLabel: `${activeProducts.length}/${products.length}`,
    alerts,
    averagePaidBasket: paidOrders.length > 0 ? paidRevenue / paidOrders.length : 0,
    currency,
    latestOrders,
    lowStockProducts,
    orderedRevenue,
    paidRevenue,
    pendingOrders,
    productsWithoutImage,
  };
}

function buildStoreAlerts(
  store: CommerceStoreResponse | null,
  products: ProductResponse[],
  productsWithoutImage: number,
  lowStockProducts: number,
  pendingOrders: number,
) {
  const alerts: { detail: string; label: string }[] = [];

  if (store && store.status !== "active") {
    alerts.push({
      detail: "La vitrine publique peut etre invisible ou limitee tant que la boutique n'est pas active.",
      label: "Boutique non active",
    });
  }

  if (products.length === 0) {
    alerts.push({
      detail: "Le marchand doit ajouter au moins un produit pour exploiter la boutique.",
      label: "Catalogue vide",
    });
  }

  if (productsWithoutImage > 0) {
    alerts.push({
      detail: `${productsWithoutImage} produit(s) n'ont pas d'image principale visible.`,
      label: "Images produit manquantes",
    });
  }

  if (lowStockProducts > 0) {
    alerts.push({
      detail: `${lowStockProducts} produit(s) ont un stock inferieur ou egal a ${LOW_STOCK_THRESHOLD}.`,
      label: "Stock faible",
    });
  }

  if (pendingOrders > 0) {
    alerts.push({
      detail: `${pendingOrders} commande(s) attendent une action de confirmation ou d'annulation.`,
      label: "Commandes a traiter",
    });
  }

  return alerts;
}

function compareOrdersByCreatedAtDesc(left: CommerceOrderResponse, right: CommerceOrderResponse) {
  return dateTimestamp(right.createdAt) - dateTimestamp(left.createdAt);
}

function dateTimestamp(value?: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function primaryImage(product: ProductResponse) {
  return product.images.find((image) => image.primary) ?? product.images[0] ?? null;
}

function appendFilterParam(params: URLSearchParams, key: string, value: string) {
  if (value.trim()) {
    params.set(key, value.trim());
  }
}

function adminProductImageUrl(productId: string, imageId: string) {
  return `/api/commerce/admin/products/${productId}/images/${imageId}/file`;
}

function addProductImage(product: ProductResponse | null, image: ProductImageResponse | undefined) {
  if (!product || !image) {
    return product;
  }

  const images = image.primary ? product.images.map((item) => ({ ...item, primary: false })) : product.images;
  return {
    ...product,
    images: [...images, image].sort(sortProductImages),
  };
}

function setPrimaryProductImage(product: ProductResponse | null, image: ProductImageResponse | undefined) {
  if (!product || !image) {
    return product;
  }

  return {
    ...product,
    images: product.images.map((item) => ({
      ...item,
      primary: item.id === image.id,
    })),
  };
}

function removeProductImage(product: ProductResponse | null, imageId: string) {
  if (!product) {
    return product;
  }

  return {
    ...product,
    images: product.images.filter((image) => image.id !== imageId),
  };
}

function sortProductImages(left: ProductImageResponse, right: ProductImageResponse) {
  return left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt);
}

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
}

function stringRecordValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function jsonRequest(method: "PATCH", payload: unknown): RequestInit {
  return {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method,
  };
}
