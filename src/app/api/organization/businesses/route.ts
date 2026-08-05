import { NextResponse } from "next/server";

import { createBusiness } from "@/lib/organization/organization.server";
import type { CreateBusinessRequest } from "@/lib/organization/organization.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateBusinessRequest;

  try {
    const business = await createBusiness(body);
    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create merchant." },
      { status: 400 },
    );
  }
}
