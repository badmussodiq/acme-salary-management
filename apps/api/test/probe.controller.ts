import { Controller, Get } from '@nestjs/common';
import { Public } from '../src/auth/auth.decorators';

@Public()
@Controller('probe')
export class ProbeController {
  @Get()
  read(): { readonly ok: true } {
    return { ok: true };
  }
}
