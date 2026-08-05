import { NextResponse } from "next/server";

import { createComplianceCase } from "@/lib/compliance/compliance.server";
import type { CreateComplianceCaseRequest } from "@/lib/compliance/compliance.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateComplianceCaseRequest;

  try {
    const complianceCase = await createComplianceCase(body);
    return NextResponse.json({ case: complianceCase }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create compliance case." },
      { status: 400 },
    );
  }
}
