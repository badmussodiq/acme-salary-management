import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AvatarController } from './avatar.controller';
import { AvatarService } from './avatar.service';

@Module({ imports: [AuditModule], controllers: [AvatarController], providers: [AvatarService] })
export class AvatarModule {}
