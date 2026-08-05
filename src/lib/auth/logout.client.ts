"use client";

import { LOGIN_PATH } from "./auth.constants";

export async function logout() {
  await fetch("/api/auth/logout", {
    method: "POST",
  });

  window.location.assign(LOGIN_PATH);
}
