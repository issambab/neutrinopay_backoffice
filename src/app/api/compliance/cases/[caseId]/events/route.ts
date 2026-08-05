import { NextResponse } from "next/server";

import { addComplianceCaseEvent } from "@/lib/compliance/compliance.server";
import type { CreateComplianceEventRequest } from "@/lib/compliance/compliance.types";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { caseId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreateComplianceEventRequest;

  try {
    const event = await addComplianceCaseEvent(caseId, body);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to add compliance event." },
      { status: 400 },
    );
  }
}
