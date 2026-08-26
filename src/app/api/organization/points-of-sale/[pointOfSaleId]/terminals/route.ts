import { NextResponse } from "next/server";

import { createTerminal } from "@/lib/organization/organization.server";
import type { CreateTerminalRequest, LifecycleStatus } from "@/lib/organization/organization.types";

type RouteContext = {
  params: Promise<{ pointOfSaleId: string }>;
};

type TerminalPayloadInput = Partial<CreateTerminalRequest>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CREATE_STATUSES: LifecycleStatus[] = ["pending", "active", "suspended"];

export async function POST(request: Request, context: RouteContext) {
  const { pointOfSaleId } = await context.params;
  const body = (await request.json().catch(() => null)) as TerminalPayloadInput | null;

  try {
    const payload = normalizeTerminalPayload(body);
    const terminal = await createTerminal(pointOfSaleId, payload);
    return NextResponse.json({ terminal }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create terminal." },
      { status: 400 },
    );
  }
}

function normalizeTerminalPayload(body: TerminalPayloadInput | null): CreateTerminalRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Payload terminal invalide.");
  }

  const terminalCode = requiredText(body.terminalCode);
  const deviceType = requiredText(body.deviceType);
  const status = normalizeStatus(body.status);
  const apiClientId = normalizeOptionalUuid(body.apiClientId);

  return {
    terminalCode,
    deviceType,
    serialNumber: nullableText(body.serialNumber),
    status,
    ...(apiClientId ? { apiClientId } : {}),
    metadata: normalizeMetadata(body.metadata),
  };
}

function normalizeStatus(value: unknown): LifecycleStatus {
  const status = requiredText(value) as LifecycleStatus;
  if (!CREATE_STATUSES.includes(status)) {
    throw new Error("Statut terminal invalide.");
  }
  return status;
}

function normalizeOptionalUuid(value: unknown) {
  const text = nullableText(value);
  if (!text) {
    return undefined;
  }
  if (!UUID_PATTERN.test(text)) {
    throw new Error("API client ID doit etre un UUID valide.");
  }
  return text;
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown) {
  const text = requiredText(value);
  return text ? text : null;
}
