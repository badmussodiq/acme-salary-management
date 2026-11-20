import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CompensationRepository } from '../compensation/compensation.repository';
import { CompensationService } from '../compensation/compensation.service';
import { EmployeesController } from './employees.controller';
import { EmployeesRepository } from './employees.repository';
import { EmployeesService } from './employees.service';

@Module({
  imports: [AuditModule],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeesRepository, CompensationService, CompensationRepository],
})
export class EmployeesModule {}
