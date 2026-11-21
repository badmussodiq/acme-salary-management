import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { AcceptedResponse, SessionUser } from '@acme/contracts';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { LOGIN_THROTTLE, SESSION_COOKIE } from './auth.constants';
import { CurrentUser, Public } from './auth.decorators';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { readCookie } from './session-cookie';
import { TokenService } from './token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Public()
  @Throttle(LOGIN_THROTTLE)
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionUser> {
    const { user, token } = await this.auth.login(body.email, body.password);
    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: this.config.cookieSecure,
      sameSite: 'strict',
      path: '/',
      maxAge: this.tokens.maxAgeMs,
    });
    return user;
  }

  @Public()
  @Throttle(LOGIN_THROTTLE)
  @Post('forgot-password')
  @HttpCode(202)
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<AcceptedResponse> {
    await this.auth.requestPasswordReset(body.email);
    return { accepted: true };
  }

  @Public()
  @Throttle(LOGIN_THROTTLE)
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() body: ResetPasswordDto): Promise<AcceptedResponse> {
    await this.auth.resetPassword(body.token, body.password);
    return { accepted: true };
  }

  @Throttle(LOGIN_THROTTLE)
  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: SessionUser,
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AcceptedResponse> {
    const token = await this.auth.changePassword(user.id, body.currentPassword, body.newPassword);
    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: this.config.cookieSecure,
      sameSite: 'strict',
      path: '/',
      maxAge: this.tokens.maxAgeMs,
    });
    return { accepted: true };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ readonly loggedOut: true }> {
    await this.auth.logout(readCookie(request.headers.cookie, SESSION_COOKIE));
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: this.config.cookieSecure,
      sameSite: 'strict',
      path: '/',
    });
    return { loggedOut: true };
  }

  @Get('me')
  me(@CurrentUser() user: SessionUser): SessionUser {
    return user;
  }
}
