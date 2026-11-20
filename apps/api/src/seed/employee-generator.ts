import type { CountryCode, CurrencyCode, EmploymentStatus, PayFrequency } from '@acme/contracts';
import { createRandom, deterministicUuid, type Random } from './random';
import {
  COUNTRY_PROFILES,
  DEPARTMENTS,
  FIRST_NAMES,
  HOURLY_ROLES,
  LAST_NAMES,
  type CountryProfile,
} from './seed-data';

export const DEFAULT_SEED = 20250101;
export const SEED_NAMESPACE = 'acme-salary-seed';
export const SEED_EMAIL_DOMAIN = 'acme-synthetic.example';

const DAY_MS = 86_400_000;
const FIRST_HIRE_MS = Date.UTC(2015, 0, 1);
const LAST_DATE_MS = Date.UTC(2025, 5, 30);
const HOURS_PER_YEAR = 2080;
const INACTIVE_SHARE = 0.07;
const MISSING_PAY_SHARE = 0.012;
const ANOMALY_SHARE = 0.004;

export interface SeedCompensation {
  readonly amount: string;
  readonly currencyCode: CurrencyCode;
  readonly payFrequency: PayFrequency;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
}

export interface SeedEmployee {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly countryCode: CountryCode;
  readonly department: string;
  readonly jobTitle: string;
  readonly employmentStatus: EmploymentStatus;
  readonly hiredOn: string;
  readonly compensations: readonly SeedCompensation[];
}

const isoDate = (milliseconds: number): string => new Date(milliseconds).toISOString().slice(0, 10);

const slug = (value: string): string => value.toLowerCase().replaceAll(/[^a-z]/g, '');

const formatAmount = (annualAmount: number, frequency: PayFrequency): string => {
  if (frequency === 'annual') return (Math.max(1, Math.round(annualAmount / 100)) * 100).toFixed(2);
  if (frequency === 'monthly') {
    return (Math.max(1, Math.round(annualAmount / 12 / 10)) * 10).toFixed(2);
  }
  return Math.max(0.01, Math.round((annualAmount / HOURS_PER_YEAR) * 100) / 100).toFixed(2);
};

const raiseDates = (random: Random, hiredMs: number): readonly number[] => {
  const tenureYears = (LAST_DATE_MS - hiredMs) / (365 * DAY_MS);
  const raises =
    tenureYears >= 5
      ? random.weighted([
          [0, 25],
          [1, 35],
          [2, 40],
        ])
      : tenureYears >= 2
        ? random.weighted([
            [0, 45],
            [1, 55],
          ])
        : 0;

  const dates: number[] = [];
  for (let step = 1; step <= raises; step += 1) {
    const date = hiredMs + step * (365 + random.int(0, 90)) * DAY_MS;
    if (date > LAST_DATE_MS) break;
    dates.push(date);
  }
  return dates;
};

const chooseFrequency = (
  random: Random,
  profile: CountryProfile,
  jobTitle: string,
  paidInUsd: boolean,
): PayFrequency => {
  if (paidInUsd) return 'monthly';
  if (profile.frequency === 'annual' && HOURLY_ROLES.has(jobTitle) && random.chance(0.25)) {
    return 'hourly';
  }
  return profile.frequency;
};

const buildCompensations = (
  random: Random,
  profile: CountryProfile,
  baseUsd: number,
  jobTitle: string,
  hiredMs: number,
): readonly SeedCompensation[] => {
  const paidInUsd = random.chance(profile.usdContractorShare);
  const currencyCode: CurrencyCode = paidInUsd ? 'USD' : profile.currency;
  const payFrequency = chooseFrequency(random, profile, jobTitle, paidInUsd);
  const toCurrency = paidInUsd ? 1 : profile.perUsd;

  const startingAnnual = baseUsd * profile.costFactor * (0.85 + random.next() * 0.35) * toCurrency;
  const dates = raiseDates(random, hiredMs);
  const starts = [hiredMs, ...dates];

  let annual = startingAnnual;
  const annuals = starts.map((_, index) => {
    if (index > 0) annual *= 1 + (3 + random.next() * 9) / 100;
    return annual;
  });

  const lastIndex = annuals.length - 1;
  if (random.chance(ANOMALY_SHARE)) {
    annuals[lastIndex] = (annuals[lastIndex] ?? annual) * (random.chance(0.5) ? 4 : 0.25);
  }

  return starts.map((start, index) => ({
    amount: formatAmount(annuals[index] ?? annual, payFrequency),
    currencyCode,
    payFrequency,
    effectiveFrom: isoDate(start),
    effectiveTo: index < lastIndex ? isoDate(starts[index + 1] ?? start) : null,
  }));
};

export const generateEmployees = (count: number, seed: number = DEFAULT_SEED): SeedEmployee[] => {
  const random = createRandom(seed);
  const countries = Object.entries(COUNTRY_PROFILES).flatMap(([code, profile]) =>
    isCountry(code) ? [[code, profile.weight] as const] : [],
  );
  const departments = Object.entries(DEPARTMENTS).map(
    ([name, profile]) => [name, profile.weight] as const,
  );

  return Array.from({ length: count }, (_, index) => {
    const countryCode = random.weighted(countries);
    const profile = COUNTRY_PROFILES[countryCode];
    const department = random.weighted(departments);
    const departmentProfile = DEPARTMENTS[department];
    if (!departmentProfile) throw new Error(`Unknown department ${department}`);
    const role = random.weighted(
      departmentProfile.roles.map((entry) => [entry, entry.weight] as const),
    );

    const firstName = random.pick(FIRST_NAMES[profile.names]);
    const lastName = random.pick(LAST_NAMES[profile.names]);
    const hiredMs =
      FIRST_HIRE_MS + random.int(0, Math.floor((LAST_DATE_MS - FIRST_HIRE_MS) / DAY_MS)) * DAY_MS;
    const employmentStatus: EmploymentStatus = random.chance(INACTIVE_SHARE)
      ? 'inactive'
      : 'active';
    const withoutPay = employmentStatus === 'active' && random.chance(MISSING_PAY_SHARE);

    return {
      id: deterministicUuid(`${SEED_NAMESPACE}:${seed}`, index),
      firstName,
      lastName,
      email: `${slug(firstName)}.${slug(lastName)}.${index + 1}@${SEED_EMAIL_DOMAIN}`,
      countryCode,
      department,
      jobTitle: role.title,
      employmentStatus,
      hiredOn: isoDate(hiredMs),
      compensations: withoutPay
        ? []
        : buildCompensations(random, profile, role.baseUsd, role.title, hiredMs),
    };
  });
};

const isCountry = (code: string): code is CountryCode => code in COUNTRY_PROFILES;
