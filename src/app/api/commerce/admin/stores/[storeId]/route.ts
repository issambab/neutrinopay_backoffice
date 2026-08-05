import { NextResponse } from "next/server";

import { updateAdminCommerceStore } from "@/lib/commerce/commerce.server";
import type { UpdateCommerceStoreRequest } from "@/lib/commerce/commerce.types";

type RouteContext = {
  params: Promise<{ storeId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { storeId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateCommerceStoreRequest;

  try {
    const store = await updateAdminCommerceStore(storeId, body);
    return NextResponse.json({ store });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update commerce store." },
      { status: 400 },
    );
  }
}
