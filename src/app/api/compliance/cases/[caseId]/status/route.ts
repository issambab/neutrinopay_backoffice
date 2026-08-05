import { NextResponse } from "next/server";

import { updateComplianceCaseStatus } from "@/lib/compliance/compliance.server";
import type { UpdateComplianceCaseStatusRequest } from "@/lib/compliance/compliance.types";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { caseId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateComplianceCaseStatusRequest;

  try {
    const complianceCase = await updateComplianceCaseStatus(caseId, body);
    return NextResponse.json({ case: complianceCase });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update compliance case status." },
      { status: 400 },
    );
  }
}
