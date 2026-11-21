import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@acme/contracts';

export class ForgotPasswordDto implements ForgotPasswordRequest {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto implements ResetPasswordRequest {
  @IsString()
  @MinLength(20)
  @MaxLength(2048)
  token!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
}

export class ChangePasswordDto implements ChangePasswordRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword!: string;
}
