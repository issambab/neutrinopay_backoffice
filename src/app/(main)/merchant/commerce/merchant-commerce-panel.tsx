"use client";

import type { ComponentType, FormEvent } from "react";
import { useMemo, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Boxes,
  Eye,
  ImageIcon,
  ImageUp,
  PackagePlus,
  Pencil,
  Plus,
  Save,
  Search,
  Settings2,
  Store,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  CommerceStoreResponse,
  LifecycleStatus,
  ProductCategoryResponse,
  ProductResponse,
} from "@/lib/commerce/commerce.types";
import {
  commerceStatusClassName,
  formatBytes,
  formatCommerceStatus,
  formatMoney,
} from "@/lib/commerce/commerce-format";
import type { BusinessResponse } from "@/lib/organization/organization.types";
import { cn } from "@/lib/utils";

type MerchantCommercePanelProps = {
  business: BusinessResponse;
  categories: ProductCategoryResponse[];
  products: ProductResponse[];
  store: CommerceStoreResponse | null;
};

const STATUS_OPTIONS: LifecycleStatus[] = ["pending", "active", "suspended", "archived"];
const PRODUCT_FILTER_STATUSES: ("all" | LifecycleStatus)[] = ["all", "pending", "active", "suspended", "archived"];

export function MerchantCommercePanel({ business, categories, products, store }: MerchantCommercePanelProps) {
  const router = useRouter();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingCategory, setEditingCategory] = useState<ProductCategoryResponse | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [imageDialogProduct, setImageDialogProduct] = useState<ProductResponse | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LifecycleStatus>("all");
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);

  const canPublish = business.status === "active" && business.kycStatus === "verified";
  const activeProducts = products.filter((product) => product.status === "active").length;
  const stockTotal = products.reduce((total, product) => total + product.stockQuantity, 0);
  const productsByCategory = useMemo(() => groupProductsByCategory(products), [products]);
  const filteredProducts = useMemo(
    () => filterProducts(products, query, statusFilter, categoryFilter),
    [categoryFilter, products, query, statusFilter],
  );

  async function saveStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      const response = await fetch("/api/merchant/commerce/store", jsonRequest(store ? "PATCH" : "POST", payload));
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        store?: CommerceStoreResponse;
      } | null;

      if (!response.ok || !result?.store) {
        toast.error(result?.message ?? "Impossible d'enregistrer la boutique.");
        return;
      }

      toast.success(store ? "Boutique mise a jour." : "Boutique creee.");
      setStoreDialogOpen(false);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const payload = {
        description: textValue(formData, "description"),
        name: textValue(formData, "name"),
        slug: textValue(formData, "slug"),
        sortOrder: numberValue(formData, "sortOrder"),
        status: formData.get("status"),
      };
      const url = editingCategory
        ? `/api/merchant/commerce/categories/${editingCategory.id}`
        : "/api/merchant/commerce/categories";
      const response = await fetch(url, jsonRequest(editingCategory ? "PATCH" : "POST", payload));
      const result = (await response.json().catch(() => null)) as {
        category?: ProductCategoryResponse;
        message?: string;
      } | null;

      if (!response.ok || !result?.category) {
        toast.error(result?.message ?? "Impossible d'enregistrer la categorie.");
        return;
      }

      toast.success(editingCategory ? "Categorie mise a jour." : "Categorie creee.");
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const categoryId = textValue(formData, "categoryId");
      const payload = {
        categoryId: categoryId || null,
        description: textValue(formData, "description"),
        metadata: {},
        name: textValue(formData, "name"),
        priceAmount: numberValue(formData, "priceAmount"),
        sku: textValue(formData, "sku"),
        slug: textValue(formData, "slug"),
        status: formData.get("status"),
        stockQuantity: numberValue(formData, "stockQuantity"),
      };
      const url = editingProduct
        ? `/api/merchant/commerce/products/${editingProduct.id}`
        : "/api/merchant/commerce/products";
      const response = await fetch(url, jsonRequest(editingProduct ? "PATCH" : "POST", payload));
      const result = (await response.json().catch(() => null)) as {
        message?: string;
        product?: ProductResponse;
      } | null;

      if (!response.ok || !result?.product) {
        toast.error(result?.message ?? "Impossible d'enregistrer le produit.");
        return;
      }

      toast.success(editingProduct ? "Produit mis a jour." : "Produit cree.");
      setEditingProduct(null);
      setProductDialogOpen(false);
      form.reset();
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteCategory(category: ProductCategoryResponse) {
    if (!window.confirm(`Supprimer la categorie ${category.name} ?`)) {
      return;
    }

    await mutateDelete(`/api/merchant/commerce/categories/${category.id}`, "Categorie supprimee.");
  }

  async function deleteProduct(product: ProductResponse) {
    if (!window.confirm(`Supprimer le produit ${product.name} ?`)) {
      return;
    }

    await mutateDelete(`/api/merchant/commerce/products/${product.id}`, "Produit supprime.");
  }

  async function uploadImage(event: FormEvent<HTMLFormElement>, productId: string) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const form = event.currentTarget;
      const response = await fetch(`/api/merchant/commerce/products/${productId}/images`, {
        body: new FormData(form),
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as { image?: unknown; message?: string } | null;

      if (!response.ok || !result?.image) {
        toast.error(result?.message ?? "Impossible d'uploader l'image.");
        return;
      }

      toast.success("Image ajoutee.");
      form.reset();
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteImage(productId: string, imageId: string) {
    await mutateDelete(`/api/merchant/commerce/products/${productId}/images/${imageId}`, "Image supprimee.");
  }

  async function mutateDelete(url: string, successMessage: string) {
    setIsBusy(true);
    try {
      const response = await fetch(url, { method: "DELETE" });
      const result = (await response.json().catch(() => null)) as { message?: string; success?: boolean } | null;

      if (!response.ok || !result?.success) {
        toast.error(result?.message ?? "Action impossible.");
        return;
      }

      toast.success(successMessage);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  function openCategoryDialog(category: ProductCategoryResponse | null) {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  }

  function openProductDialog(product: ProductResponse | null) {
    setEditingProduct(product);
    setProductDialogOpen(true);
  }

  if (!store) {
    return (
      <div className="grid gap-5">
        <CommerceHeader
          business={business}
          canPublish={canPublish}
          store={store}
          onOpenStore={() => setStoreDialogOpen(true)}
        />
        <EmptyStoreSetup isBusy={isBusy} onSubmit={saveStore} />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <CommerceHeader
        business={business}
        canPublish={canPublish}
        store={store}
        onOpenStore={() => setStoreDialogOpen(true)}
      />

      {!canPublish && <PublishWarning />}

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={Store} label="Boutique" value={formatCommerceStatus(store.status)} />
        <MetricCard icon={Tag} label="Categories" value={String(categories.length)} />
        <MetricCard icon={Boxes} label="Produits actifs" value={`${activeProducts}/${products.length}`} />
        <MetricCard icon={PackagePlus} label="Stock total" value={String(stockTotal)} />
      </div>

      <Tabs defaultValue="products" className="gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="store">Boutique</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openCategoryDialog(null)} variant="outline">
              <Tag />
              Categorie
            </Button>
            <Button onClick={() => openProductDialog(null)}>
              <Plus />
              Produit
            </Button>
          </div>
        </div>

        <TabsContent value="products">
          <ProductToolbar
            categories={categories}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            onQueryChange={setQuery}
            onStatusChange={setStatusFilter}
            query={query}
            statusFilter={statusFilter}
          />
          <ProductCatalog
            onDelete={deleteProduct}
            onDeleteImage={deleteImage}
            onEdit={openProductDialog}
            onOpenImages={setImageDialogProduct}
            onUploadImage={uploadImage}
            products={filteredProducts}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryBoard
            categories={categories}
            onDelete={deleteCategory}
            onEdit={openCategoryDialog}
            productsByCategory={productsByCategory}
          />
        </TabsContent>

        <TabsContent value="store">
          <StoreSummary onEdit={() => setStoreDialogOpen(true)} store={store} />
        </TabsContent>
      </Tabs>

      <Dialog open={storeDialogOpen} onOpenChange={setStoreDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Parametres boutique</DialogTitle>
            <DialogDescription>Nom, URL publique, contact et statut de publication.</DialogDescription>
          </DialogHeader>
          <StoreForm isBusy={isBusy} onSubmit={saveStore} store={store} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Modifier categorie" : "Nouvelle categorie"}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            isBusy={isBusy}
            onCancel={() => setCategoryDialogOpen(false)}
            onSubmit={saveCategory}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={productDialogOpen}
        onOpenChange={(open) => {
          setProductDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Modifier produit" : "Nouveau produit"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            categories={categories}
            isBusy={isBusy}
            onCancel={() => setProductDialogOpen(false)}
            onSubmit={saveProduct}
            product={editingProduct}
          />
        </DialogContent>
      </Dialog>

      <ImageGalleryDialog
        isBusy={isBusy}
        onDeleteImage={deleteImage}
        onOpenChange={(open) => {
          if (!open) {
            setImageDialogProduct(null);
          }
        }}
        onUploadImage={uploadImage}
        product={imageDialogProduct}
      />
    </div>
  );
}

function CommerceHeader({
  business,
  canPublish,
  onOpenStore,
  store,
}: {
  business: BusinessResponse;
  canPublish: boolean;
  onOpenStore: () => void;
  store: CommerceStoreResponse | null;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Commerce</h1>
        <p className="text-muted-foreground text-sm">{business.name}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={commerceStatusClassName(store?.status ?? "pending")}>
          {store ? formatCommerceStatus(store.status) : "Boutique a creer"}
        </Badge>
        <Badge
          variant="outline"
          className={canPublish ? commerceStatusClassName("active") : commerceStatusClassName("suspended")}
        >
          {canPublish ? "Publication autorisee" : "KYB requis pour publier"}
        </Badge>
        <Button onClick={onOpenStore} variant="outline">
          <Settings2 />
          Boutique
        </Button>
      </div>
    </div>
  );
}

function EmptyStoreSetup({
  isBusy,
  onSubmit,
}: {
  isBusy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Creer la boutique</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="rounded-md border border-dashed bg-muted/20 p-4 text-muted-foreground text-sm">
          Commencez par definir le nom et le slug public. Les categories, produits, prix, stock et images seront
          disponibles ensuite.
        </div>
        <StoreForm isBusy={isBusy} onSubmit={onSubmit} store={null} />
      </CardContent>
    </Card>
  );
}

function PublishWarning() {
  return (
    <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-amber-800 text-sm dark:text-amber-300">
      Le catalogue peut etre prepare maintenant. La publication publique reste bloquee tant que le marchand n'est pas
      actif avec KYB valide.
    </div>
  );
}

function StoreForm({
  isBusy,
  onSubmit,
  store,
}: {
  isBusy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  store: CommerceStoreResponse | null;
}) {
  const contact = (store?.contactConfig ?? {}) as { email?: string; phone?: string };
  const theme = (store?.themeConfig ?? {}) as { accentColor?: string };

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <Field>
        <FieldLabel>Nom boutique</FieldLabel>
        <Input name="displayName" defaultValue={store?.displayName ?? ""} required />
      </Field>
      <Field>
        <FieldLabel>Slug public</FieldLabel>
        <Input name="slug" defaultValue={store?.slug ?? ""} placeholder="ma-boutique" />
      </Field>
      <Field>
        <FieldLabel>Statut</FieldLabel>
        <StatusSelect defaultValue={store?.status ?? "pending"} />
      </Field>
      <Field>
        <FieldLabel>Couleur accent</FieldLabel>
        <Input name="accentColor" defaultValue={theme.accentColor ?? "#0f766e"} placeholder="#0f766e" />
      </Field>
      <Field>
        <FieldLabel>Email contact</FieldLabel>
        <Input name="contactEmail" defaultValue={contact.email ?? ""} type="email" />
      </Field>
      <Field>
        <FieldLabel>Telephone contact</FieldLabel>
        <Input name="contactPhone" defaultValue={contact.phone ?? ""} />
      </Field>
      <Field className="md:col-span-2">
        <FieldLabel>Description</FieldLabel>
        <Textarea name="description" defaultValue={store?.description ?? ""} rows={3} />
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isBusy}>
          <Save />
          {store ? "Enregistrer boutique" : "Creer boutique"}
        </Button>
      </div>
    </form>
  );
}

function StoreSummary({ onEdit, store }: { onEdit: () => void; store: CommerceStoreResponse }) {
  const contact = (store.contactConfig ?? {}) as { email?: string; phone?: string };
  const theme = (store.themeConfig ?? {}) as { accentColor?: string };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>{store.displayName}</CardTitle>
          <Button onClick={onEdit} variant="outline">
            <Pencil />
            Modifier
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <Info label="Slug public" value={`/${store.slug}`} />
        <Info label="Statut" value={formatCommerceStatus(store.status)} />
        <Info label="Email contact" value={contact.email ?? "-"} />
        <Info label="Telephone" value={contact.phone ?? "-"} />
        <Info label="Couleur accent" value={theme.accentColor ?? "-"} />
        <Info label="Description" value={store.description ?? "-"} />
      </CardContent>
    </Card>
  );
}

function ProductToolbar({
  categories,
  categoryFilter,
  onCategoryChange,
  onQueryChange,
  onStatusChange,
  query,
  statusFilter,
}: {
  categories: ProductCategoryResponse[];
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: "all" | LifecycleStatus) => void;
  query: string;
  statusFilter: "all" | LifecycleStatus;
}) {
  return (
    <Card className="mb-4">
      <CardContent className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Rechercher par nom, SKU ou slug"
            value={query}
          />
        </div>
        <NativeSelect
          onChange={(event) => onStatusChange(event.target.value as "all" | LifecycleStatus)}
          value={statusFilter}
        >
          {PRODUCT_FILTER_STATUSES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {status === "all" ? "Tous les statuts" : formatCommerceStatus(status)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect onChange={(event) => onCategoryChange(event.target.value)} value={categoryFilter}>
          <NativeSelectOption value="all">Toutes les categories</NativeSelectOption>
          <NativeSelectOption value="none">Sans categorie</NativeSelectOption>
          {categories.map((category) => (
            <NativeSelectOption key={category.id} value={category.id}>
              {category.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </CardContent>
    </Card>
  );
}

function ProductCatalog({
  onDelete,
  onDeleteImage,
  onEdit,
  onOpenImages,
  onUploadImage,
  products,
}: {
  onDelete: (product: ProductResponse) => void;
  onDeleteImage: (productId: string, imageId: string) => void;
  onEdit: (product: ProductResponse) => void;
  onOpenImages: (product: ProductResponse) => void;
  onUploadImage: (event: FormEvent<HTMLFormElement>, productId: string) => void;
  products: ProductResponse[];
}) {
  if (!products.length) {
    return <EmptyPanel text="Aucun produit ne correspond aux filtres." />;
  }

  return (
    <div className="grid gap-3">
      {products.map((product) => (
        <ProductRow
          key={product.id}
          onDelete={onDelete}
          onDeleteImage={onDeleteImage}
          onEdit={onEdit}
          onOpenImages={onOpenImages}
          onUploadImage={onUploadImage}
          product={product}
        />
      ))}
    </div>
  );
}

function ProductRow({
  onDelete,
  onDeleteImage,
  onEdit,
  onOpenImages,
  onUploadImage,
  product,
}: {
  onDelete: (product: ProductResponse) => void;
  onDeleteImage: (productId: string, imageId: string) => void;
  onEdit: (product: ProductResponse) => void;
  onOpenImages: (product: ProductResponse) => void;
  onUploadImage: (event: FormEvent<HTMLFormElement>, productId: string) => void;
  product: ProductResponse;
}) {
  const image = primaryImage(product);

  return (
    <Card size="sm">
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[96px_1fr_auto] lg:items-center">
          <button
            className="group relative aspect-square overflow-hidden rounded-md border bg-muted text-left"
            onClick={() => onOpenImages(product)}
            type="button"
          >
            {image ? (
              <Image
                alt={product.name}
                fill
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                sizes="96px"
                src={productImageUrl(product, image.id)}
                unoptimized
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <ImageIcon className="size-6 text-muted-foreground" />
              </span>
            )}
            <span className="absolute right-1 bottom-1 rounded bg-background/90 px-1.5 py-0.5 text-[11px] shadow-sm">
              {product.images.length}
            </span>
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{product.name}</span>
              <Badge variant="outline" className={commerceStatusClassName(product.status)}>
                {formatCommerceStatus(product.status)}
              </Badge>
              {product.categoryName && <Badge variant="secondary">{product.categoryName}</Badge>}
            </div>
            <div className="mt-1 text-muted-foreground text-xs">
              /{product.slug}
              {product.sku ? ` - SKU ${product.sku}` : ""}
            </div>
            {product.description && (
              <p className="mt-2 line-clamp-2 text-muted-foreground text-sm">{product.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => onEdit(product)} size="sm" variant="outline">
                <Pencil />
                Modifier
              </Button>
              <Button onClick={() => onOpenImages(product)} size="sm" variant="outline">
                <Eye />
                Images
              </Button>
              <Button onClick={() => onDelete(product)} size="icon" title="Supprimer" variant="ghost">
                <Trash2 />
              </Button>
            </div>
          </div>

          <div className="grid gap-2 lg:min-w-40 lg:text-right">
            <span className="font-semibold text-base">{formatMoney(product.priceAmount, product.currency)}</span>
            <span
              className={cn(
                "text-sm",
                product.stockQuantity <= 0 ? "text-red-600 dark:text-red-300" : "text-muted-foreground",
              )}
            >
              Stock {product.stockQuantity}
            </span>
            {product.images.length === 0 && (
              <form className="mt-2 grid gap-2" onSubmit={(event) => onUploadImage(event, product.id)}>
                <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
                <input name="sortOrder" type="hidden" value="0" />
                <input name="primary" type="hidden" value="true" />
                <Button type="submit" size="sm" variant="outline">
                  <ImageUp />
                  Ajouter image
                </Button>
              </form>
            )}
          </div>
        </div>
      </CardContent>

      {product.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t px-4 py-3">
          {product.images.slice(0, 6).map((item) => (
            <button
              className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted"
              key={item.id}
              onClick={() => onOpenImages(product)}
              type="button"
            >
              <Image
                alt={item.fileName}
                className="h-full w-full object-cover"
                fill
                sizes="56px"
                src={productImageUrl(product, item.id)}
                unoptimized
              />
              {item.primary && (
                <span className="absolute inset-x-1 bottom-1 rounded bg-background/90 text-[10px]">Main</span>
              )}
            </button>
          ))}
          {product.images.length > 6 && (
            <button
              className="flex size-14 shrink-0 items-center justify-center rounded-md border bg-muted text-xs"
              onClick={() => onOpenImages(product)}
              type="button"
            >
              +{product.images.length - 6}
            </button>
          )}
          <button
            className="flex size-14 shrink-0 items-center justify-center rounded-md border border-dashed text-muted-foreground"
            onClick={() => onOpenImages(product)}
            type="button"
          >
            <Plus className="size-4" />
          </button>
        </div>
      )}

      <InlineImageDelete product={product} onDeleteImage={onDeleteImage} />
    </Card>
  );
}

function InlineImageDelete({
  onDeleteImage,
  product,
}: {
  onDeleteImage: (productId: string, imageId: string) => void;
  product: ProductResponse;
}) {
  if (!product.images.length) {
    return null;
  }

  return (
    <div className="sr-only">
      {product.images.map((image) => (
        <button key={image.id} onClick={() => onDeleteImage(product.id, image.id)} type="button">
          Supprimer {image.fileName}
        </button>
      ))}
    </div>
  );
}

function ImageGalleryDialog({
  isBusy,
  onDeleteImage,
  onOpenChange,
  onUploadImage,
  product,
}: {
  isBusy: boolean;
  onDeleteImage: (productId: string, imageId: string) => void;
  onOpenChange: (open: boolean) => void;
  onUploadImage: (event: FormEvent<HTMLFormElement>, productId: string) => void;
  product: ProductResponse | null;
}) {
  const mainImage = product ? primaryImage(product) : null;

  return (
    <Dialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{product?.name ?? "Images produit"}</DialogTitle>
          <DialogDescription>Visualisez les images et ajoutez de nouveaux visuels produit.</DialogDescription>
        </DialogHeader>

        {product && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-hidden rounded-md border bg-muted">
              {mainImage ? (
                <Image
                  alt={product.name}
                  className="max-h-[520px] w-full object-contain"
                  height={800}
                  src={productImageUrl(product, mainImage.id)}
                  unoptimized
                  width={1200}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center">
                  <ImageIcon className="size-10 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="grid content-start gap-4">
              <form className="grid gap-3 rounded-md border p-3" onSubmit={(event) => onUploadImage(event, product.id)}>
                <Field>
                  <FieldLabel>Nouvelle image</FieldLabel>
                  <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Ordre</FieldLabel>
                    <Input name="sortOrder" defaultValue={product.images.length} min={0} type="number" />
                  </Field>
                  <Field>
                    <FieldLabel>Type</FieldLabel>
                    <NativeSelect name="primary" defaultValue={product.images.length === 0 ? "true" : "false"}>
                      <NativeSelectOption value="false">Secondaire</NativeSelectOption>
                      <NativeSelectOption value="true">Principale</NativeSelectOption>
                    </NativeSelect>
                  </Field>
                </div>
                <Button type="submit" disabled={isBusy}>
                  <ImageUp />
                  Ajouter image
                </Button>
              </form>

              <div className="grid gap-2">
                {product.images.length ? (
                  product.images.map((image) => (
                    <div
                      key={image.id}
                      className="grid grid-cols-[56px_1fr_auto] items-center gap-2 rounded-md border p-2"
                    >
                      <Image
                        alt={image.fileName}
                        className="size-14 rounded border object-cover"
                        height={56}
                        src={productImageUrl(product, image.id)}
                        unoptimized
                        width={56}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-xs">{image.fileName}</div>
                        <div className="text-muted-foreground text-xs">
                          {formatBytes(image.fileSizeBytes)} - ordre {image.sortOrder}
                        </div>
                        {image.primary && <Badge variant="outline">Principale</Badge>}
                      </div>
                      <Button
                        onClick={() => onDeleteImage(product.id, image.id)}
                        size="icon"
                        title="Supprimer"
                        variant="ghost"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))
                ) : (
                  <EmptyPanel text="Aucune image pour ce produit." />
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CategoryBoard({
  categories,
  onDelete,
  onEdit,
  productsByCategory,
}: {
  categories: ProductCategoryResponse[];
  onDelete: (category: ProductCategoryResponse) => void;
  onEdit: (category: ProductCategoryResponse) => void;
  productsByCategory: Map<string, number>;
}) {
  if (!categories.length) {
    return <EmptyPanel text="Aucune categorie. Ajoutez une categorie pour mieux organiser le catalogue." />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <Card key={category.id} size="sm">
          <CardContent className="grid gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">{category.name}</span>
                  <Badge variant="outline" className={commerceStatusClassName(category.status)}>
                    {formatCommerceStatus(category.status)}
                  </Badge>
                </div>
                <div className="text-muted-foreground text-xs">/{category.slug}</div>
              </div>
              <Badge variant="secondary">{productsByCategory.get(category.id) ?? 0} produits</Badge>
            </div>
            {category.description && (
              <p className="line-clamp-2 text-muted-foreground text-sm">{category.description}</p>
            )}
            <div className="flex justify-between gap-2 border-t pt-3">
              <span className="text-muted-foreground text-xs">Ordre {category.sortOrder}</span>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(category)} title="Modifier">
                  <Pencil />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(category)} title="Supprimer">
                  <Trash2 />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CategoryForm({
  category,
  isBusy,
  onCancel,
  onSubmit,
}: {
  category: ProductCategoryResponse | null;
  isBusy: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form key={category?.id ?? "new"} className="grid gap-3" onSubmit={onSubmit}>
      <Field>
        <FieldLabel>Nom</FieldLabel>
        <Input name="name" defaultValue={category?.name ?? ""} required />
      </Field>
      <Field>
        <FieldLabel>Slug</FieldLabel>
        <Input name="slug" defaultValue={category?.slug ?? ""} placeholder="boissons" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel>Ordre</FieldLabel>
          <Input name="sortOrder" defaultValue={category?.sortOrder ?? 0} min={0} type="number" />
        </Field>
        <Field>
          <FieldLabel>Statut</FieldLabel>
          <StatusSelect defaultValue={category?.status ?? "pending"} />
        </Field>
      </div>
      <Field>
        <FieldLabel>Description</FieldLabel>
        <Textarea name="description" defaultValue={category?.description ?? ""} rows={3} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isBusy}>
          {category ? <Save /> : <Plus />}
          {category ? "Enregistrer" : "Ajouter"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function ProductForm({
  categories,
  isBusy,
  onCancel,
  onSubmit,
  product,
}: {
  categories: ProductCategoryResponse[];
  isBusy: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  product: ProductResponse | null;
}) {
  return (
    <form key={product?.id ?? "new"} className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <Field>
        <FieldLabel>Nom</FieldLabel>
        <Input name="name" defaultValue={product?.name ?? ""} required />
      </Field>
      <Field>
        <FieldLabel>Slug</FieldLabel>
        <Input name="slug" defaultValue={product?.slug ?? ""} placeholder="produit" />
      </Field>
      <Field>
        <FieldLabel>SKU</FieldLabel>
        <Input name="sku" defaultValue={product?.sku ?? ""} />
      </Field>
      <Field>
        <FieldLabel>Categorie</FieldLabel>
        <NativeSelect name="categoryId" defaultValue={product?.categoryId ?? ""}>
          <NativeSelectOption value="">Sans categorie</NativeSelectOption>
          {categories.map((category) => (
            <NativeSelectOption key={category.id} value={category.id}>
              {category.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field>
        <FieldLabel>Prix</FieldLabel>
        <Input
          name="priceAmount"
          defaultValue={product?.priceAmount ?? 0}
          min={0}
          step="0.001"
          type="number"
          required
        />
      </Field>
      <Field>
        <FieldLabel>Stock</FieldLabel>
        <Input name="stockQuantity" defaultValue={product?.stockQuantity ?? 0} min={0} type="number" />
      </Field>
      <Field>
        <FieldLabel>Statut</FieldLabel>
        <StatusSelect defaultValue={product?.status ?? "pending"} />
      </Field>
      <Field className="md:col-span-2">
        <FieldLabel>Description</FieldLabel>
        <Textarea name="description" defaultValue={product?.description ?? ""} rows={4} />
      </Field>
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <Button type="submit" disabled={isBusy}>
          {product ? <Save /> : <Plus />}
          {product ? "Enregistrer produit" : "Ajouter produit"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md border bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </span>
        <div className="grid gap-1">
          <span className="text-muted-foreground text-xs">{label}</span>
          <span className="font-semibold text-sm">{value}</span>
        </div>
      </CardContent>
    </Card>
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

function StatusSelect({ defaultValue }: { defaultValue: LifecycleStatus }) {
  return (
    <NativeSelect name="status" defaultValue={defaultValue}>
      {STATUS_OPTIONS.map((status) => (
        <NativeSelectOption key={status} value={status}>
          {formatCommerceStatus(status)}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

function filterProducts(
  products: ProductResponse[],
  query: string,
  statusFilter: "all" | LifecycleStatus,
  categoryFilter: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return products.filter((product) => {
    const matchesQuery =
      !normalizedQuery ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.slug.toLowerCase().includes(normalizedQuery) ||
      product.sku?.toLowerCase().includes(normalizedQuery);
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "none" && !product.categoryId) ||
      product.categoryId === categoryFilter;

    return matchesQuery && matchesStatus && matchesCategory;
  });
}

function groupProductsByCategory(products: ProductResponse[]) {
  const counts = new Map<string, number>();

  for (const product of products) {
    if (product.categoryId) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }
  }

  return counts;
}

function primaryImage(product: ProductResponse) {
  return product.images.find((image) => image.primary) ?? product.images[0] ?? null;
}

function productImageUrl(product: ProductResponse, imageId: string) {
  return `/api/merchant/commerce/products/${product.id}/images/${imageId}/file`;
}

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
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
