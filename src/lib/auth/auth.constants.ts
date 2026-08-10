export const AUTH_COOKIE_NAMES = {
  accessToken: "np_access_token",
  refreshToken: "np_refresh_token",
  tenantId: "np_tenant_id",
  userId: "np_user_id",
  username: "np_username",
  authorities: "np_authorities",
  passwordChangeRequired: "np_password_change_required",
} as const;

export const LOGIN_PATH = "/auth/v2/login";
export const CHANGE_PASSWORD_PATH = "/auth/change-password";
export const DASHBOARD_PATH = "/dashboard/default";
export const MERCHANT_DASHBOARD_PATH = "/merchant/dashboard";
export const CUSTOMER_DASHBOARD_PATH = "/user/dashboard";
export const AGENT_DASHBOARD_PATH = "/agent/dashboard";
export const DEFAULT_TENANT_ID = "11111111-1111-1111-1111-111111111111";
