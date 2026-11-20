import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type {
  CompensationDto,
  EmployeeDetailDto,
  EmployeeFacetsDto,
  EmployeeSummaryDto,
  Paginated,
  AuditEventDto,
  SessionUser,
} from '@acme/contracts';
import { AuditRepository } from '../audit/audit.repository';
import { WRITE_THROTTLE } from '../auth/auth.constants';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { RequestId } from '../common/request-id.decorator';
import { toPageRequest, toPaginated } from '../common/pagination';
import { CompensationService } from '../compensation/compensation.service';
import {
  AuditQueryDto,
  CompensationInputDto,
  CreateEmployeeDto,
  ListEmployeesQueryDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';
import { EmployeesService } from './employees.service';

@Roles('hr_manager')
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employees: EmployeesService,
    private readonly compensations: CompensationService,
    private readonly audit: AuditRepository,
  ) {}

  @Get()
  list(@Query() query: ListEmployeesQueryDto): Promise<Paginated<EmployeeSummaryDto>> {
    return this.employees.list(query);
  }

  @Get('facets')
  facets(): Promise<EmployeeFacetsDto> {
    return this.employees.facets();
  }

  @Throttle(WRITE_THROTTLE)
  @Post()
  create(
    @Body() body: CreateEmployeeDto,
    @CurrentUser() user: SessionUser,
    @RequestId() requestId: string,
  ): Promise<EmployeeDetailDto> {
    return this.employees.create(body, user, requestId);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<EmployeeDetailDto> {
    return this.employees.get(id);
  }

  @Throttle(WRITE_THROTTLE)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateEmployeeDto,
    @CurrentUser() user: SessionUser,
    @RequestId() requestId: string,
  ): Promise<EmployeeDetailDto> {
    return this.employees.update(id, body, user, requestId);
  }

  @Get(':id/compensation')
  compensationHistory(@Param('id', ParseUUIDPipe) id: string): Promise<readonly CompensationDto[]> {
    return this.compensations.history(id);
  }

  @Throttle(WRITE_THROTTLE)
  @Post(':id/compensation')
  addCompensation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CompensationInputDto,
    @CurrentUser() user: SessionUser,
    @RequestId() requestId: string,
  ): Promise<CompensationDto> {
    return this.compensations.add(id, body, user, requestId);
  }

  @Get(':id/audit')
  async auditTrail(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AuditQueryDto,
  ): Promise<Paginated<AuditEventDto>> {
    await this.employees.ensureExists(id);
    const request = toPageRequest(query);
    const { events, total } = await this.audit.listForEmployee(id, request.limit, request.offset);
    return toPaginated(events, total, request);
  }
}
