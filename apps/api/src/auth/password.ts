import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const COST = 2 ** 15;
const BLOCK_SIZE = 8;
const PARALLELISM = 3;
const SCHEME = 'scrypt';

interface ScryptParams {
  readonly cost: number;
  readonly blockSize: number;
  readonly parallelism: number;
}

const derive = (password: string, salt: Buffer, params: ScryptParams): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      KEY_LENGTH,
      {
        N: params.cost,
        r: params.blockSize,
        p: params.parallelism,
        maxmem: 256 * params.cost * params.blockSize,
      },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_LENGTH);
  const params: ScryptParams = { cost: COST, blockSize: BLOCK_SIZE, parallelism: PARALLELISM };
  const key = await derive(password, salt, params);
  return [
    SCHEME,
    params.cost,
    params.blockSize,
    params.parallelism,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$');
};

const parseStored = (
  stored: string,
): { params: ScryptParams; salt: Buffer; key: Buffer } | null => {
  const [scheme, cost, blockSize, parallelism, salt, key, ...rest] = stored.split('$');
  if (scheme !== SCHEME || rest.length > 0 || !salt || !key) return null;
  const params: ScryptParams = {
    cost: Number(cost),
    blockSize: Number(blockSize),
    parallelism: Number(parallelism),
  };
  const valid = Object.values(params).every((value) => Number.isInteger(value) && value > 0);
  return valid
    ? { params, salt: Buffer.from(salt, 'base64'), key: Buffer.from(key, 'base64') }
    : null;
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const parsed = parseStored(stored);
  if (!parsed) return false;
  const candidate = await derive(password, parsed.salt, parsed.params);
  return candidate.length === parsed.key.length && timingSafeEqual(candidate, parsed.key);
};

let dummyHash: Promise<string> | undefined;

export const burnPasswordCheck = async (password: string): Promise<void> => {
  dummyHash ??= hashPassword('not-a-real-password');
  await verifyPassword(password, await dummyHash);
};
