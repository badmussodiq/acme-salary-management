import { writeFileSync } from 'node:fs';

const SOURCES = {
  countries: 'https://cdn.jsdelivr.net/npm/world-countries@5.1.0/countries.json',
  rates: 'https://open.er-api.com/v6/latest/USD',
  gdp: 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&date=2020:2023&per_page=20000',
  population:
    'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2020:2023&per_page=20000',
};

const UNINHABITED = new Set(['AQ', 'BV', 'HM']);
const CURRENCY_OVERRIDES = { FM: 'USD', CK: 'NZD', CU: 'CUP' };
const RATE_OVERRIDES = { KPW: 900 };
const DEFAULT_COST_FACTOR = 0.5;
const REQUIRED_CURRENCIES = ['USD', 'EUR', 'GBP'];

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
};

const latestByIso3 = (payload) => {
  const latest = new Map();
  for (const row of payload[1]) {
    if (row.value === null || !row.countryiso3code) continue;
    const known = latest.get(row.countryiso3code);
    if (!known || row.date > known.date) latest.set(row.countryiso3code, row);
  }
  return new Map([...latest].map(([iso3, row]) => [iso3, row.value]));
};

const namePool = ({ region, subregion }) => {
  if (region === 'Africa' || subregion === 'Western Asia') return 'african';
  if (region === 'Asia') return 'asian';
  if (subregion === 'North America') return 'western';
  if (region === 'Americas') return 'latin';
  return 'western';
};

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const round = (value, places) => Number(value.toFixed(places));

const costFactorOf = (gdpPerCapita) =>
  gdpPerCapita === undefined
    ? DEFAULT_COST_FACTOR
    : round(clamp(0.2 + 0.8 * Math.sqrt(clamp(gdpPerCapita / 65000, 0, 1)), 0.2, 1), 2);

const significant = (rate) => Number(rate.toPrecision(rate >= 100 ? 4 : 4));

const [countries, rates, gdpPayload, populationPayload] = await Promise.all([
  fetchJson(SOURCES.countries),
  fetchJson(SOURCES.rates),
  fetchJson(SOURCES.gdp),
  fetchJson(SOURCES.population),
]);

const gdp = latestByIso3(gdpPayload);
const population = latestByIso3(populationPayload);

const included = countries
  .filter((country) => !UNINHABITED.has(country.cca2))
  .map((country) => {
    const currency = CURRENCY_OVERRIDES[country.cca2] ?? Object.keys(country.currencies ?? {})[0];
    if (!currency) throw new Error(`${country.cca2} has no currency`);
    const perUsd = RATE_OVERRIDES[currency] ?? rates.rates[currency];
    if (!perUsd) throw new Error(`No exchange rate for ${currency} (${country.cca2})`);
    const costFactor = costFactorOf(gdp.get(country.cca3));
    const populationMillions = (population.get(country.cca3) ?? 1_000_000) / 1_000_000;
    return {
      code: country.cca2,
      name: country.name.common,
      currency,
      perUsd: significant(perUsd),
      costFactor,
      weight: Math.max(1, Math.round(Math.sqrt(populationMillions) * (0.5 + costFactor))),
      frequency: costFactor >= 0.7 ? 'annual' : 'monthly',
      usdContractorShare: currency === 'USD' ? 0 : costFactor <= 0.45 ? 0.1 : 0,
      names: namePool(country),
    };
  })
  .toSorted((a, b) => a.name.localeCompare(b.name, 'en'));

const currencyNames = new Map();
for (const country of countries) {
  for (const [code, details] of Object.entries(country.currencies ?? {})) {
    if (!currencyNames.has(code)) currencyNames.set(code, details.name);
  }
}

const currencies = [
  ...new Set([...included.map((country) => country.currency), ...REQUIRED_CURRENCIES]),
].toSorted((a, b) => a.localeCompare(b, 'en'));

const quote = (value) => JSON.stringify(value).replaceAll('"', "'");

const contractsSource = `export const COUNTRIES = [
${included.map((c) => `  { code: ${quote(c.code)}, name: ${quote(c.name)}, currency: ${quote(c.currency)} },`).join('\n')}
] as const;

export const CURRENCY_CODES = [
${currencies.map((code) => `  ${quote(code)},`).join('\n')}
] as const;

export const CURRENCY_NAMES = {
${currencies.map((code) => `  ${code}: ${quote(currencyNames.get(code) ?? code)},`).join('\n')}
} as const;
`;

const profilesSource = `export const WORLD_PROFILES = {
${included
  .map(
    (c) =>
      `  ${c.code}: { weight: ${c.weight}, currency: ${quote(c.currency)}, costFactor: ${c.costFactor}, perUsd: ${c.perUsd}, frequency: ${quote(c.frequency)}, usdContractorShare: ${c.usdContractorShare}, names: ${quote(c.names)} },`,
  )
  .join('\n')}
} as const;
`;

writeFileSync(
  new URL('../packages/contracts/src/world.generated.ts', import.meta.url),
  contractsSource,
);
writeFileSync(
  new URL('../apps/api/src/seed/world-profiles.generated.ts', import.meta.url),
  profilesSource,
);

const totalWeight = included.reduce((sum, country) => sum + country.weight, 0);
process.stdout.write(
  `${included.length} countries, ${currencies.length} currencies, total weight ${totalWeight}\n`,
);
