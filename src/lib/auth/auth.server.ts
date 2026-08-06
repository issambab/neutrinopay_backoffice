import { cookies } from "next/headers";

import {
  AUTH_COOKIE_NAMES,
  CHANGE_PASSWORD_PATH,
  CUSTOMER_DASHBOARD_PATH,
  DASHBOARD_PATH,
  DEFAULT_TENANT_ID,
  MERCHANT_DASHBOARD_PATH,
} from "./auth.constants";
import type {
  ApiResponse,
  AuthTokenResponse,
  ChangePasswordRequest,
  CurrentUserResponse,
  LoginRequest,
  OtpChallengeResponse,
  RegisterAccountRequest,
  SessionUser,
} from "./auth.types";

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";
const DEFAULT_REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

type ApiErrorResponse = {
  details?: Array<{ field?: string; message?: string }>;
  message?: string;
};

function getApiBaseUrl() {
  return (
    process.env.BACKEND_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_BASE_URL
  ).replace(/\/$/, "");
}

function getDefaultTenantId() {
  return process.env.BACKOFFICE_DEFAULT_TENANT_ID ?? DEFAULT_TENANT_ID;
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure:
      process.env.AUTH_COOKIE_SECURE !== "false" &&
      process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function getRefreshTokenMaxAge(refreshTokenExpiresAt: string) {
  const expiresAt = new Date(refreshTokenExpiresAt).getTime();

  if (Number.isNaN(expiresAt)) {
    return DEFAULT_REFRESH_TOKEN_MAX_AGE;
  }

  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}

export async function loginToBackend(
  payload: LoginRequest,
): Promise<AuthTokenResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": getDefaultTenantId(),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const apiResponse = (await response
    .json()
    .catch(() => null)) as ApiResponse<AuthTokenResponse> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(apiErrorMessage(apiResponse, "Authentication failed."));
  }

  return apiResponse.data;
}

export async function verifyMfaToBackend(payload: {
  challengeId: string;
  code: string;
  deviceFingerprint?: string;
}) {
  const response = await fetch(`${getApiBaseUrl()}/auth/mfa/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": getDefaultTenantId(),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const apiResponse = (await response
    .json()
    .catch(() => null)) as ApiResponse<AuthTokenResponse> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(apiErrorMessage(apiResponse, "MFA verification failed."));
  }

  return apiResponse.data;
}

export async function resendMfaChallenge(challengeId: string) {
  const response = await fetch(`${getApiBaseUrl()}/auth/mfa/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": getDefaultTenantId(),
    },
    body: JSON.stringify({ challengeId }),
    cache: "no-store",
  });
  return readPublicApiResponse<OtpChallengeResponse>(
    response,
    "Unable to send MFA code.",
  );
}

export async function registerCustomerAccount(payload: RegisterAccountRequest) {
  const response = await fetch(`${getApiBaseUrl()}/accounts/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": getDefaultTenantId(),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  return readPublicApiResponse<CurrentUserResponse["user"]>(
    response,
    "Unable to register account.",
  );
}

export async function sendAccountVerification(identifier: string) {
  const response = await fetch(
    `${getApiBaseUrl()}/accounts/verification/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Id": getDefaultTenantId(),
      },
      body: JSON.stringify({ identifier }),
      cache: "no-store",
    },
  );
  return readPublicApiResponse<OtpChallengeResponse>(
    response,
    "Unable to send verification code.",
  );
}

export async function confirmAccountVerification(
  identifier: string,
  code: string,
) {
  const response = await fetch(
    `${getApiBaseUrl()}/accounts/verification/confirm`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Id": getDefaultTenantId(),
      },
      body: JSON.stringify({ identifier, code }),
      cache: "no-store",
    },
  );
  const apiResponse = (await response
    .json()
    .catch(() => null)) as ApiResponse<unknown> | null;

  if (!response.ok || !apiResponse?.success) {
    throw new Error(apiErrorMessage(apiResponse, "Unable to verify account."));
  }
}

export async function persistAuthSession(auth: AuthTokenResponse) {
  if (
    auth.mfaRequired ||
    !auth.accessToken ||
    !auth.refreshToken ||
    !auth.refreshTokenExpiresAt
  ) {
    throw new Error(
      "Authentication MFA is required before creating a session.",
    );
  }

  const cookieStore = await cookies();
  const refreshTokenMaxAge = getRefreshTokenMaxAge(auth.refreshTokenExpiresAt);

  cookieStore.set(
    AUTH_COOKIE_NAMES.accessToken,
    auth.accessToken,
    getCookieOptions(auth.accessTokenExpiresInSeconds),
  );
  cookieStore.set(
    AUTH_COOKIE_NAMES.refreshToken,
    auth.refreshToken,
    getCookieOptions(refreshTokenMaxAge),
  );
  cookieStore.set(
    AUTH_COOKIE_NAMES.tenantId,
    auth.tenantId,
    getCookieOptions(refreshTokenMaxAge),
  );
  cookieStore.set(
    AUTH_COOKIE_NAMES.userId,
    auth.userId,
    getCookieOptions(refreshTokenMaxAge),
  );
  cookieStore.set(
    AUTH_COOKIE_NAMES.username,
    auth.username,
    getCookieOptions(refreshTokenMaxAge),
  );
  cookieStore.set(
    AUTH_COOKIE_NAMES.authorities,
    JSON.stringify(auth.authorities),
    getCookieOptions(refreshTokenMaxAge),
  );
  cookieStore.set(
    AUTH_COOKIE_NAMES.passwordChangeRequired,
    String(auth.passwordChangeRequired),
    getCookieOptions(refreshTokenMaxAge),
  );
}

async function readPublicApiResponse<T>(
  response: Response,
  fallbackMessage: string,
) {
  const apiResponse = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(apiErrorMessage(apiResponse, fallbackMessage));
  }

  return apiResponse.data;
}

function apiErrorMessage(payload: unknown, fallbackMessage: string) {
  const error = payload as ApiErrorResponse | null;
  const detailMessages = error?.details
    ?.map((detail) => [detail.field, detail.message].filter(Boolean).join(": "))
    .filter(Boolean);

  if (detailMessages?.length) {
    return detailMessages.join(" | ");
  }

  return error?.message ?? fallbackMessage;
}

export async function clearAuthSession() {
  const cookieStore = await cookies();

  Object.values(AUTH_COOKIE_NAMES).forEach((cookieName) => {
    cookieStore.delete(cookieName);
  });
}

export async function logoutFromBackend() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const refreshToken = cookieStore.get(AUTH_COOKIE_NAMES.refreshToken)?.value;
  const tenantId = cookieStore.get(AUTH_COOKIE_NAMES.tenantId)?.value;

  if (!accessToken || !refreshToken) {
    return;
  }

  await fetch(`${getApiBaseUrl()}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(tenantId ? { "X-Tenant-Id": tenantId } : {}),
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  }).catch(() => undefined);
}

export async function refreshAuthSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(AUTH_COOKIE_NAMES.refreshToken)?.value;
  const tenantId =
    cookieStore.get(AUTH_COOKIE_NAMES.tenantId)?.value ?? getDefaultTenantId();

  if (!refreshToken) {
    throw new Error("Authentication session is missing.");
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  const apiResponse = (await response
    .json()
    .catch(() => null)) as ApiResponse<AuthTokenResponse> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    await clearAuthSession();
    throw new Error(apiResponse?.message ?? "Authentication refresh failed.");
  }

  await persistAuthSession(apiResponse.data);
  return apiResponse.data;
}

export async function authenticatedBackendFetch(
  path: string,
  init: RequestInit = {},
) {
  const response = await fetchWithCurrentAccessToken(path, init);

  if (response.status !== 401) {
    return response;
  }

  try {
    await refreshAuthSession();
  } catch {
    return response;
  }

  return fetchWithCurrentAccessToken(path, init);
}

async function fetchWithCurrentAccessToken(
  path: string,
  init: RequestInit = {},
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const tenantId =
    cookieStore.get(AUTH_COOKIE_NAMES.tenantId)?.value ?? getDefaultTenantId();
  const headers = new Headers(init.headers);

  if (!accessToken) {
    throw new Error("Authentication session is missing.");
  }

  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("X-Tenant-Id", tenantId);

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export function getPostLoginRedirect(
  authorities: string[] = [],
  passwordChangeRequired = false,
) {
  if (passwordChangeRequired) {
    return CHANGE_PASSWORD_PATH;
  }

  if (isAdminAuthorities(authorities)) {
    return DASHBOARD_PATH;
  }

  if (isMerchantAuthorities(authorities)) {
    return MERCHANT_DASHBOARD_PATH;
  }

  if (isCustomerAuthorities(authorities)) {
    return CUSTOMER_DASHBOARD_PATH;
  }

  return DASHBOARD_PATH;
}

export function isAdminAuthorities(authorities: string[] = []) {
  return authorities.some((authority) =>
    [
      "ROLE_PLATFORM_ADMIN",
      "ROLE_TENANT_ADMIN",
      "ROLE_OPS",
      "iam.users.read",
      "iam.roles.read",
      "merchant.admin.read",
      "compliance.cases.read",
    ].includes(authority),
  );
}

export function isMerchantAuthorities(authorities: string[] = []) {
  return authorities.some(
    (authority) =>
      authority === "ROLE_MERCHANT_ADMIN" || authority === "ROLE_MERCHANT",
  );
}

export function isCustomerAuthorities(authorities: string[] = []) {
  return authorities.some((authority) => authority.startsWith("customer."));
}

export async function getCurrentUserProfile() {
  const response = await authenticatedBackendFetch("/me");
  const apiResponse = (await response
    .json()
    .catch(() => null)) as ApiResponse<CurrentUserResponse> | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(apiResponse?.message ?? "Unable to load current user.");
  }

  return apiResponse.data;
}

export async function updateCurrentUserProfile(payload: {
  fullName?: string | null;
  phoneNumber?: string | null;
}) {
  const response = await authenticatedBackendFetch("/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const apiResponse = (await response.json().catch(() => null)) as ApiResponse<
    CurrentUserResponse["user"]
  > | null;

  if (!response.ok || !apiResponse?.success || !apiResponse.data) {
    throw new Error(
      apiErrorMessage(apiResponse, "Unable to update current user."),
    );
  }

  return apiResponse.data;
}

export async function changeBackendPassword(payload: ChangePasswordRequest) {
  const response = await authenticatedBackendFetch("/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const apiResponse = (await response
    .json()
    .catch(() => null)) as ApiResponse<unknown> | null;

  if (!response.ok || !apiResponse?.success) {
    throw new Error(apiResponse?.message ?? "Unable to change password.");
  }

  const cookieStore = await cookies();
  cookieStore.set(
    AUTH_COOKIE_NAMES.passwordChangeRequired,
    "false",
    getCookieOptions(DEFAULT_REFRESH_TOKEN_MAX_AGE),
  );
}

export async function isPasswordChangeRequired() {
  const cookieStore = await cookies();
  return (
    cookieStore.get(AUTH_COOKIE_NAMES.passwordChangeRequired)?.value === "true"
  );
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(AUTH_COOKIE_NAMES.userId)?.value;
  const username = cookieStore.get(AUTH_COOKIE_NAMES.username)?.value;
  const authoritiesCookie = cookieStore.get(
    AUTH_COOKIE_NAMES.authorities,
  )?.value;

  if (!userId || !username) {
    return null;
  }

  const authorities = authoritiesCookie
    ? parseAuthorities(authoritiesCookie)
    : [];
  const primaryAuthority = authorities[0] ?? "authenticated";
  let userType: string | undefined;

  try {
    userType = (await getCurrentUserProfile()).user.userType;
  } catch {
    userType = isMerchantAuthorities(authorities) ? "merchant" : undefined;
  }

  return {
    id: userId,
    name: username,
    email: username,
    avatar: "",
    authorities,
    role: primaryAuthority.replace(/^ROLE_/, "").toLowerCase(),
    userType,
  };
}

function parseAuthorities(authoritiesCookie: string) {
  try {
    const parsed = JSON.parse(authoritiesCookie);

    return Array.isArray(parsed)
      ? parsed.filter(
          (authority): authority is string => typeof authority === "string",
        )
      : [];
  } catch {
    return [];
  }
}
