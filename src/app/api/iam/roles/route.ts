import { NextResponse } from "next/server";

import type { CreateRoleRequest } from "@/lib/iam/iam.types";
import { createRole } from "@/lib/iam/roles.server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateRoleRequest;

  try {
    const role = await createRole(body);
    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to create role.",
      },
      { status: 400 },
    );
  }
}
