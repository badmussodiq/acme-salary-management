import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { FeaturesDto, SessionUser } from '@acme/contracts';
import { WRITE_THROTTLE } from '../auth/auth.constants';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { RequestId } from '../common/request-id.decorator';
import { AvatarService } from './avatar.service';

@Controller()
export class AvatarController {
  constructor(private readonly avatars: AvatarService) {}

  @Get('features')
  features(): FeaturesDto {
    return { profilePictures: this.avatars.enabled };
  }

  @Roles('hr_manager')
  @Get('employees/:id/avatar')
  async fetch(@Param('id', ParseUUIDPipe) id: string, @Res() response: Response): Promise<void> {
    const { body, contentType } = await this.avatars.fetch(id);
    response
      .status(200)
      .set({
        'Content-Type': contentType,
        'Content-Length': String(body.length),
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      })
      .end(body);
  }

  @Roles('hr_manager')
  @Throttle(WRITE_THROTTLE)
  @Put('employees/:id/avatar')
  @HttpCode(204)
  async upload(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
    @CurrentUser() user: SessionUser,
    @RequestId() requestId: string,
  ): Promise<void> {
    await this.avatars.upload(id, request.body, user, requestId);
  }

  @Roles('hr_manager')
  @Throttle(WRITE_THROTTLE)
  @Delete('employees/:id/avatar')
  @HttpCode(204)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
    @RequestId() requestId: string,
  ): Promise<void> {
    return this.avatars.remove(id, user, requestId);
  }
}
