import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  COUNTRY_CODES,
  DISTRIBUTION_GROUPINGS,
  EMPLOYMENT_STATUSES,
  type CountryCode,
  type DataQualityDto,
  type DistributionGrouping,
  type DistributionQuery,
  type DistributionRowDto,
  type EmploymentStatus,
  type OverviewDto,
} from '@acme/contracts';
import { INSIGHTS_THROTTLE } from '../auth/auth.constants';
import { Roles } from '../auth/auth.decorators';
import { Trim } from '../common/validators';
import { InsightsRepository } from './insights.repository';

export class DistributionQueryDto implements DistributionQuery {
  @IsOptional()
  @IsIn(DISTRIBUTION_GROUPINGS)
  groupBy?: DistributionGrouping;

  @IsOptional()
  @IsIn(COUNTRY_CODES)
  countryCode?: CountryCode;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  jobTitle?: string;

  @IsOptional()
  @IsIn(EMPLOYMENT_STATUSES)
  employmentStatus?: EmploymentStatus;
}

@Roles('hr_manager')
@Throttle(INSIGHTS_THROTTLE)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insights: InsightsRepository) {}

  @Get('overview')
  overview(): Promise<OverviewDto> {
    return this.insights.overview();
  }

  @Get('salary-distribution')
  distribution(@Query() query: DistributionQueryDto): Promise<readonly DistributionRowDto[]> {
    return this.insights.distribution(query.groupBy ?? 'none', {
      countryCode: query.countryCode,
      department: query.department,
      jobTitle: query.jobTitle,
      employmentStatus: query.employmentStatus,
    });
  }

  @Get('data-quality')
  dataQuality(): Promise<DataQualityDto> {
    return this.insights.dataQuality();
  }
}
