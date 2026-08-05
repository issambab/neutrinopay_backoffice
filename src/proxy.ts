import { type NextRequest, NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAMES,
  CHANGE_PASSWORD_PATH,
  DASHBOARD_PATH,
  DEFAULT_TENANT_ID,
  LOGIN_PATH,
  MERCHANT_DASHBOARD_PATH,
} from "@/lib/auth/auth.constants";

const LOGIN_PATHS = ["/auth/v1/login", "/auth/v2/login"];
const PROTECTED_PATHS = ["/dashboard", "/merchant"];
const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";
const REFRESH_THRESHOLD_SECONDS = 60;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const refreshToken = req.cookies.get(AUTH_COOKIE_NAMES.refreshToken)?.value;
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isLoginPath = LOGIN_PATHS.includes(pathname);

  if (isProtectedPath && !accessToken) {
    if (!refreshToken) {
      return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
    }

    const refreshed = await refreshSession(req, refreshToken);
    return refreshed ?? NextResponse.redirect(new URL(LOGIN_PATH, req.url));
  }

  if (isProtectedPath && accessToken && refreshToken && shouldRefreshAccessToken(accessToken)) {
    const refreshed = await refreshSession(req, refreshToken);
    if (refreshed) {
      return refreshed;
    }
  }

  if (isLoginPath && accessToken) {
    const authorities = parseJsonCookie(req.cookies.get(AUTH_COOKIE_NAMES.authorities)?.value);
    const passwordChangeRequired = req.cookies.get(AUTH_COOKIE_NAMES.passwordChangeRequired)?.value === "true";
    return NextResponse.redirect(new URL(getPostLoginRedirect(authorities, passwordChangeRequired), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

type RefreshResponse = {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  authorities: string[];
  passwordChangeRequired: boolean;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  tenantId: string;
  userId: string;
  username: string;
};

async function refreshSession(req: NextRequest, refreshToken: string) {
  const tenantId = req.cookies.get(AUTH_COOKIE_NAMES.tenantId)?.value ?? getDefaultTenantId();
  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => null);
  const apiResponse = (await response?.json().catch(() => null)) as
    | { data?: RefreshResponse; success?: boolean }
    | null;

  if (!response?.ok || !apiResponse?.success || !apiResponse.data) {
    return null;
  }

  const auth = apiResponse.data;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("cookie", mergeCookieHeader(req.headers.get("cookie") ?? "", {
    [AUTH_COOKIE_NAMES.accessToken]: auth.accessToken,
    [AUTH_COOKIE_NAMES.refreshToken]: auth.refreshToken,
    [AUTH_COOKIE_NAMES.tenantId]: auth.tenantId,
    [AUTH_COOKIE_NAMES.userId]: auth.userId,
    [AUTH_COOKIE_NAMES.username]: auth.username,
    [AUTH_COOKIE_NAMES.authorities]: JSON.stringify(auth.authorities),
    [AUTH_COOKIE_NAMES.passwordChangeRequired]: String(auth.passwordChangeRequired),
  }));

  const nextResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  setAuthCookies(nextResponse, auth);
  return nextResponse;
}

function setAuthCookies(response: NextResponse, auth: RefreshResponse) {
  const refreshTokenMaxAge = getRefreshTokenMaxAge(auth.refreshTokenExpiresAt);

  response.cookies.set(AUTH_COOKIE_NAMES.accessToken, auth.accessToken, getCookieOptions(auth.accessTokenExpiresInSeconds));
  response.cookies.set(AUTH_COOKIE_NAMES.refreshToken, auth.refreshToken, getCookieOptions(refreshTokenMaxAge));
  response.cookies.set(AUTH_COOKIE_NAMES.tenantId, auth.tenantId, getCookieOptions(refreshTokenMaxAge));
  response.cookies.set(AUTH_COOKIE_NAMES.userId, auth.userId, getCookieOptions(refreshTokenMaxAge));
  response.cookies.set(AUTH_COOKIE_NAMES.username, auth.username, getCookieOptions(refreshTokenMaxAge));
  response.cookies.set(AUTH_COOKIE_NAMES.authorities, JSON.stringify(auth.authorities), getCookieOptions(refreshTokenMaxAge));
  response.cookies.set(
    AUTH_COOKIE_NAMES.passwordChangeRequired,
    String(auth.passwordChangeRequired),
    getCookieOptions(refreshTokenMaxAge),
  );
}

function shouldRefreshAccessToken(accessToken: string) {
  const payload = parseJwtPayload(accessToken);
  if (typeof payload?.exp !== "number") {
    return false;
  }

  return payload.exp - Math.floor(Date.now() / 1000) <= REFRESH_THRESHOLD_SECONDS;
}

function parseJwtPayload(token: string) {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(atob(payload.replaceAll("-", "+").replaceAll("_", "/"))) as { exp?: number };
  } catch {
    return null;
  }
}

function getApiBaseUrl() {
  return (process.env.BACKEND_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
    /\/$/,
    "",
  );
}

function getDefaultTenantId() {
  return process.env.BACKOFFICE_DEFAULT_TENANT_ID ?? DEFAULT_TENANT_ID;
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function getRefreshTokenMaxAge(refreshTokenExpiresAt: string) {
  const expiresAt = new Date(refreshTokenExpiresAt).getTime();

  if (Number.isNaN(expiresAt)) {
    return 60 * 60 * 24 * 30;
  }

  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}

function mergeCookieHeader(currentCookieHeader: string, values: Record<string, string>) {
  const cookies = new Map(
    currentCookieHeader
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separatorIndex = item.indexOf("=");
        return separatorIndex === -1
          ? [item, ""]
          : [item.slice(0, separatorIndex), item.slice(separatorIndex + 1)];
      }),
  );

  Object.entries(values).forEach(([key, value]) => {
    cookies.set(key, encodeURIComponent(value));
  });

  return Array.from(cookies.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

function parseJsonCookie(value?: string) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function getPostLoginRedirect(authorities: string[] = [], passwordChangeRequired = false) {
  if (passwordChangeRequired) {
    return CHANGE_PASSWORD_PATH;
  }

  return isMerchantAuthorities(authorities) ? MERCHANT_DASHBOARD_PATH : DASHBOARD_PATH;
}

function isMerchantAuthorities(authorities: string[] = []) {
  return authorities.some((authority) => authority === "ROLE_MERCHANT_ADMIN" || authority === "ROLE_MERCHANT");
}
