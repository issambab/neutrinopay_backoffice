import { NextResponse } from "next/server";

import type { UpdateRoleRequest } from "@/lib/iam/iam.types";
import { deleteRole, updateRole } from "@/lib/iam/roles.server";

type RouteContext = {
  params: Promise<{
    roleId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { roleId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as UpdateRoleRequest;

  try {
    const role = await updateRole(roleId, body);
    return NextResponse.json({ role });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to update role.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { roleId } = await context.params;

  try {
    await deleteRole(roleId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to delete role.",
      },
      { status: 400 },
    );
  }
}
