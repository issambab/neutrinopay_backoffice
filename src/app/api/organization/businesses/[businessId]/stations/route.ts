import { NextResponse } from "next/server";

import { createStation } from "@/lib/organization/organization.server";
import type { CreateStationRequest } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{ businessId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { businessId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreateStationRequest;

  try {
    const station = await createStation(businessId, body);
    return NextResponse.json({ station }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create station." },
      { status: 400 },
    );
  }
}
