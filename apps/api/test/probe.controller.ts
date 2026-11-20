import { Controller, Get } from '@nestjs/common';

@Controller('probe')
export class ProbeController {
  @Get()
  read(): { readonly ok: true } {
    return { ok: true };
  }
}
