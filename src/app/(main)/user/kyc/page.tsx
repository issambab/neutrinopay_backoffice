import { getCustomerKycProfile, listCustomerKycDocuments } from "@/lib/kyc/kyc.server";
import type { KycDocumentResponse } from "@/lib/kyc/kyc.types";

import { UserKycPanel } from "./user-kyc-panel";

export default async function UserKycPage() {
  const profile = await safeGetProfile();
  const documents = profile ? await safeGetDocuments() : [];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">KYC user</h1>
        <p className="text-muted-foreground text-sm">Documents d'identification du compte wallet personnel.</p>
      </div>
      <UserKycPanel documents={documents} profile={profile} />
    </div>
  );
}

async function safeGetProfile() {
  try {
    return await getCustomerKycProfile();
  } catch {
    return null;
  }
}

async function safeGetDocuments() {
  try {
    const page = await listCustomerKycDocuments();
    return page.content;
  } catch {
    return [] as KycDocumentResponse[];
  }
}
