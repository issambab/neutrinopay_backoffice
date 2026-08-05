import { NextResponse } from "next/server";

import { setAdminProductImagePrimary } from "@/lib/commerce/commerce.server";

type RouteContext = {
  params: Promise<{ imageId: string; productId: string }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  const { imageId, productId } = await context.params;

  try {
    const image = await setAdminProductImagePrimary(productId, imageId);
    return NextResponse.json({ image });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update primary product image." },
      { status: 400 },
    );
  }
}
