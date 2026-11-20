import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { InitialHrService } from './initial-hr.service';
import { OriginGuard } from './origin.guard';
import { RolesGuard } from './roles.guard';
import { TokenService } from './token.service';
import { UsersRepository } from './users.repository';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    UsersRepository,
    InitialHrService,
    AuthGuard,
    RolesGuard,
    OriginGuard,
  ],
  exports: [AuthGuard, RolesGuard, OriginGuard, UsersRepository, TokenService],
})
export class AuthModule {}
