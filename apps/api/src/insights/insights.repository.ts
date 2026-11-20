import { Injectable } from '@nestjs/common';
import { sql, type Expression, type SqlBool } from 'kysely';
import {
  OUTLIER_FACTOR,
  OUTLIER_MIN_GROUP_SIZE,
  OUTLIER_SAMPLE_SIZE,
  type CountryCode,
  type CurrencyCode,
  type DataQualityDto,
  type DistributionGrouping,
  type DistributionRowDto,
  type EmploymentStatus,
  type HeadcountEntry,
  type OverviewDto,
  type PayFrequency,
  type PayMixEntry,
} from '@acme/contracts';
import { DatabaseService } from '../database/database.service';
import {
  CURRENT_COMPENSATION_SQL,
  withCurrentCompensation,
} from '../employees/current-compensation';

export interface DistributionFilters {
  readonly countryCode?: CountryCode | undefined;
  readonly department?: string | undefined;
  readonly jobTitle?: string | undefined;
  readonly employmentStatus?: EmploymentStatus | undefined;
}

interface OutlierRow {
  readonly employee_id: string;
  readonly employee_number: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly job_title: string;
  readonly amount: string;
  readonly currency_code: CurrencyCode;
  readonly pay_frequency: PayFrequency;
  readonly group_median: string;
  readonly total: number;
}

const GROUP_COLUMNS: Readonly<Record<DistributionGrouping, string>> = {
  none: 'NULL::text',
  countryCode: 'e.country_code',
  department: 'e.department',
  jobTitle: 'e.job_title',
};

@Injectable()
export class InsightsRepository {
  constructor(private readonly database: DatabaseService) {}

  async overview(): Promise<OverviewDto> {
    const { db } = this.database;
    const [totals, byCountry, byDepartment, payMix] = await Promise.all([
      withCurrentCompensation(db)
        .select([
          sql<number>`count(*)::int`.as('total'),
          sql<number>`(count(*) FILTER (WHERE e.employment_status = 'active'))::int`.as('active'),
          sql<number>`(count(*) FILTER (WHERE e.employment_status = 'inactive'))::int`.as(
            'inactive',
          ),
          sql<number>`(count(*) FILTER (WHERE c.id IS NULL))::int`.as('missing'),
        ])
        .executeTakeFirstOrThrow(),
      this.headcountBy('e.country_code'),
      this.headcountBy('e.department'),
      this.payMix(),
    ]);

    return {
      totalEmployees: totals.total,
      activeEmployees: totals.active,
      inactiveEmployees: totals.inactive,
      withoutCurrentCompensation: totals.missing,
      byCountry,
      byDepartment,
      payMix,
    };
  }

  private async headcountBy(column: string): Promise<readonly HeadcountEntry[]> {
    const { rows } = await sql<{ key: string; headcount: number }>`
      SELECT ${sql.ref(column)} AS key, count(*)::int AS headcount
      FROM employees e
      GROUP BY 1
      ORDER BY headcount DESC, key
    `.execute(this.database.db);
    return rows;
  }

  private async payMix(): Promise<readonly PayMixEntry[]> {
    const rows = await withCurrentCompensation(this.database.db)
      .where('c.id', 'is not', null)
      .select(['c.currency_code', 'c.pay_frequency', sql<number>`count(*)::int`.as('headcount')])
      .groupBy(['c.currency_code', 'c.pay_frequency'])
      .orderBy('headcount', 'desc')
      .orderBy('c.currency_code')
      .orderBy('c.pay_frequency')
      .execute();
    return rows.flatMap((row) =>
      row.currency_code && row.pay_frequency
        ? [
            {
              currencyCode: row.currency_code,
              payFrequency: row.pay_frequency,
              headcount: row.headcount,
            },
          ]
        : [],
    );
  }

  async distribution(
    groupBy: DistributionGrouping,
    filters: DistributionFilters,
  ): Promise<readonly DistributionRowDto[]> {
    const groupColumn = sql.raw(GROUP_COLUMNS[groupBy]);
    const rows = await withCurrentCompensation(this.database.db)
      .where('c.id', 'is not', null)
      .where((eb) => {
        const conditions: Expression<SqlBool>[] = [];
        if (filters.countryCode) conditions.push(eb('e.country_code', '=', filters.countryCode));
        if (filters.department) conditions.push(eb('e.department', '=', filters.department));
        if (filters.jobTitle) conditions.push(eb('e.job_title', '=', filters.jobTitle));
        if (filters.employmentStatus) {
          conditions.push(eb('e.employment_status', '=', filters.employmentStatus));
        }
        return eb.and(conditions);
      })
      .select([
        sql<string | null>`${groupColumn}`.as('group_key'),
        'c.currency_code',
        'c.pay_frequency',
        sql<number>`count(*)::int`.as('headcount'),
        sql<string>`min(c.amount)::text`.as('minimum'),
        sql<string>`round((percentile_cont(0.5) WITHIN GROUP (ORDER BY c.amount))::numeric, 2)::text`.as(
          'median',
        ),
        sql<string>`round(avg(c.amount), 2)::text`.as('average'),
        sql<string>`max(c.amount)::text`.as('maximum'),
      ])
      .groupBy([sql`1`, 'c.currency_code', 'c.pay_frequency'])
      .orderBy(sql`1`)
      .orderBy('c.currency_code')
      .orderBy('c.pay_frequency')
      .execute();

    return rows.flatMap((row) =>
      row.currency_code && row.pay_frequency
        ? [
            {
              group: row.group_key,
              currencyCode: row.currency_code,
              payFrequency: row.pay_frequency,
              headcount: row.headcount,
              minimum: row.minimum,
              median: row.median,
              average: row.average,
              maximum: row.maximum,
            },
          ]
        : [],
    );
  }

  async dataQuality(): Promise<DataQualityDto> {
    const { db } = this.database;
    const [counts, outliers] = await Promise.all([
      withCurrentCompensation(db)
        .select([
          sql<number>`(count(*) FILTER (WHERE e.employment_status = 'active' AND c.id IS NULL))::int`.as(
            'active_missing',
          ),
          sql<number>`(count(*) FILTER (WHERE e.employment_status = 'inactive' AND c.id IS NOT NULL))::int`.as(
            'inactive_paid',
          ),
        ])
        .executeTakeFirstOrThrow(),
      sql<OutlierRow>`
        WITH current_pay AS (
          SELECT e.id AS employee_id, e.employee_number, e.first_name, e.last_name, e.job_title,
                 c.amount, c.currency_code, c.pay_frequency
          FROM employees e
          JOIN compensations c ON c.employee_id = e.id AND ${CURRENT_COMPENSATION_SQL}
          WHERE e.employment_status = 'active'
        ),
        medians AS (
          SELECT job_title, currency_code, pay_frequency,
                 percentile_cont(0.5) WITHIN GROUP (ORDER BY amount) AS median
          FROM current_pay
          GROUP BY job_title, currency_code, pay_frequency
          HAVING count(*) >= ${OUTLIER_MIN_GROUP_SIZE}
        )
        SELECT p.employee_id, p.employee_number, p.first_name, p.last_name, p.job_title,
               p.amount::text AS amount, p.currency_code, p.pay_frequency,
               round(m.median::numeric, 2)::text AS group_median,
               (count(*) OVER ())::int AS total
        FROM current_pay p
        JOIN medians m USING (job_title, currency_code, pay_frequency)
        WHERE p.amount > m.median * ${OUTLIER_FACTOR} OR p.amount < m.median / ${OUTLIER_FACTOR}
        ORDER BY abs(ln(p.amount / m.median)) DESC, p.employee_number
        LIMIT ${OUTLIER_SAMPLE_SIZE}
      `.execute(db),
    ]);

    return {
      activeWithoutCompensation: counts.active_missing,
      inactiveWithCurrentCompensation: counts.inactive_paid,
      outlierCount: outliers.rows[0]?.total ?? 0,
      outliers: outliers.rows.map((row) => ({
        employeeId: row.employee_id,
        employeeNumber: row.employee_number,
        name: `${row.first_name} ${row.last_name}`,
        jobTitle: row.job_title,
        amount: row.amount,
        currencyCode: row.currency_code,
        payFrequency: row.pay_frequency,
        groupMedian: row.group_median,
      })),
    };
  }
}
