export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

export type LoginRequest = {
  identifier: string;
  password: string;
  deviceFingerprint?: string;
};

export type AuthTokenResponse = {
  tokenType: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresAt?: string | null;
  tenantId: string;
  userId: string;
  username: string;
  authorities: string[];
  passwordChangeRequired: boolean;
  mfaRequired?: boolean;
  mfaChallengeId?: string | null;
};

export type RegisterAccountRequest = {
  externalReference?: string | null;
  phoneNumber?: string | null;
  email: string;
  fullName: string;
  password: string;
  metadata?: Record<string, unknown> | null;
};

export type OtpChallengeResponse = {
  challengeId: string;
  usage: "email_verification" | "login_mfa";
  destination: string;
  expiresAt: string;
  remainingAttempts: number;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type CurrentUserResponse = {
  authorities: string[];
  user: {
    id: string;
    tenantId: string;
    externalReference?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    fullName?: string | null;
    userType: string;
    status: string;
    kycStatus: string;
    mfaEnabled: boolean;
    emailVerifiedAt?: string | null;
    lastLoginAt?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
    updatedAt?: string | null;
  };
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  authorities?: string[];
  role: string;
  userType?: string;
};
