import { NextResponse } from "next/server";

import { createBusinessMerchantUser, listBusinessMerchantUsers } from "@/lib/organization/organization.server";
import type { CreateMerchantUserRequest } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{
    businessId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { businessId } = await context.params;

  try {
    const merchantUsers = await listBusinessMerchantUsers(businessId);
    return NextResponse.json({ merchantUsers });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load merchant users." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { businessId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreateMerchantUserRequest;

  try {
    const merchantUser = await createBusinessMerchantUser(businessId, body);
    return NextResponse.json({ merchantUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create merchant user." },
      { status: 400 },
    );
  }
}
