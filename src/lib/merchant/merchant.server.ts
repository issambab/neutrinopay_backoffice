import { redirect } from "next/navigation";

import { DASHBOARD_PATH, LOGIN_PATH } from "@/lib/auth/auth.constants";
import { getCurrentUserProfile, isMerchantAuthorities } from "@/lib/auth/auth.server";
import {
  listBusinesses,
  listBusinessPointsOfSale,
  listBusinessStations,
  listPointOfSaleTerminals,
} from "@/lib/organization/organization.server";
import type {
  BusinessResponse,
  PointOfSaleResponse,
  StationResponse,
  TerminalResponse,
} from "@/lib/organization/organization.types";

export type MerchantWorkspace = {
  business: BusinessResponse | null;
  pointsOfSale: PointOfSaleResponse[];
  stations: StationResponse[];
  terminals: TerminalResponse[];
};

export async function requireMerchantProfile() {
  try {
    const profile = await getCurrentUserProfile();
    const isMerchant = profile.user.userType === "merchant" || isMerchantAuthorities(profile.authorities);

    if (!isMerchant) {
      redirect(DASHBOARD_PATH);
    }

    return profile;
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    redirect(LOGIN_PATH);
  }
}

export async function getMerchantWorkspace(): Promise<MerchantWorkspace> {
  await requireMerchantProfile();

  const businesses = await listBusinesses({ size: 1, sort: "createdAt,asc" });
  const business = businesses.content[0] ?? null;

  if (!business) {
    return {
      business: null,
      pointsOfSale: [],
      stations: [],
      terminals: [],
    };
  }

  const [stations, pointsOfSale] = await Promise.all([
    listBusinessStations(business.id, { size: 100, sort: "createdAt,desc" }),
    listBusinessPointsOfSale(business.id, { size: 100, sort: "createdAt,desc" }),
  ]);
  const terminalPages = await Promise.all(
    pointsOfSale.content.map((pointOfSale) => listPointOfSaleTerminals(pointOfSale.id, { size: 100 })),
  );

  return {
    business,
    pointsOfSale: pointsOfSale.content,
    stations: stations.content,
    terminals: terminalPages.flatMap((page) => page.content),
  };
}

function isNextRedirect(error: unknown) {
  return error instanceof Error && error.message === "NEXT_REDIRECT";
}
