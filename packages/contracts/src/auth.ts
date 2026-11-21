import type { UserRole } from './domain';

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
}

export interface ForgotPasswordRequest {
  readonly email: string;
}

export interface ResetPasswordRequest {
  readonly token: string;
  readonly password: string;
}

export interface AcceptedResponse {
  readonly accepted: true;
}

export interface ChangePasswordRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
}
