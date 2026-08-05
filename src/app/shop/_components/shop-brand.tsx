import Image from "next/image";

type ShopBrandProps = {
  logoUrl?: string;
  name: string;
};

export function ShopBrand({ logoUrl, name }: ShopBrandProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
        {logoUrl ? (
          <Image alt={`${name} logo`} className="object-cover" fill sizes="44px" src={logoUrl} unoptimized />
        ) : (
          <span className="font-semibold text-[color:var(--shop-accent)] text-sm">{monogram(name)}</span>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate font-semibold">{name}</div>
        <div className="truncate text-muted-foreground text-xs">Boutique propulsee par Neutrino</div>
      </div>
    </div>
  );
}

function monogram(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
