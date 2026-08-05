import { redirect } from "next/navigation";

import { MERCHANT_DASHBOARD_PATH } from "@/lib/auth/auth.constants";

export default function MerchantPage() {
  redirect(MERCHANT_DASHBOARD_PATH);
}
