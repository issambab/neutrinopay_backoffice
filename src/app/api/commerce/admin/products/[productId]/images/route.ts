import { NextResponse } from "next/server";

import { uploadAdminProductImage } from "@/lib/commerce/commerce.server";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { productId } = await context.params;
  const formData = await request.formData();

  try {
    const image = await uploadAdminProductImage(productId, formData);
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to upload product image." },
      { status: 400 },
    );
  }
}
