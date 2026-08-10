import { NextResponse } from "next/server";

import { createUser } from "@/lib/iam/users.server";
import type { CreateUserRequest } from "@/lib/iam/iam.types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateUserRequest;

  try {
    const user = await createUser(body);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create user." },
      { status: 400 },
    );
  }
}
