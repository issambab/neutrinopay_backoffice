import { NextResponse } from "next/server";

import { deleteStation, updateStation } from "@/lib/organization/organization.server";
import type { UpdateStationRequest } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{ stationId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { stationId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateStationRequest;

  try {
    const station = await updateStation(stationId, body);
    return NextResponse.json({ station });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update station." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { stationId } = await context.params;

  try {
    await deleteStation(stationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete station." },
      { status: 400 },
    );
  }
}
