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
