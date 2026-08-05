import { NextResponse } from "next/server";

import { changeStationStatus } from "@/lib/organization/organization.server";
import type { UpdateStatusRequest } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{ stationId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { stationId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateStatusRequest;

  try {
    const station = await changeStationStatus(stationId, body);
    return NextResponse.json({ station });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update station status." },
      { status: 400 },
    );
  }
}
