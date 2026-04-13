import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

type UserRole = 'user' | 'admin';

interface StoredAccount {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
}

interface AuthStoreData {
  accounts: StoredAccount[];
}

const dataDir = path.resolve(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'auth-store.json');

function hashPassword(password: string) {
  const salt = randomUUID().replaceAll('-', '');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });

  try {
    const raw = await readFile(dataFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AuthStoreData>;
    return {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
    } satisfies AuthStoreData;
  } catch {
    const initial: AuthStoreData = { accounts: [] };
    await writeFile(dataFile, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

async function saveStore(data: AuthStoreData) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

export async function registerAccount(username: string, password: string, displayName?: string) {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) {
    return { success: false, message: 'Username is required.' };
  }

  if (password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }

  const store = await ensureStore();
  const exists = store.accounts.some((account) => account.username === normalizedUsername);
  if (exists) {
    return { success: false, message: 'Account already exists.' };
  }

  const account: StoredAccount = {
    id: randomUUID(),
    username: normalizedUsername,
    displayName: displayName?.trim() || normalizedUsername,
    passwordHash: hashPassword(password),
    phone: normalizedUsername,
    email: null,
    role: 'user',
    created_at: new Date().toISOString(),
  };

  store.accounts.push(account);
  await saveStore(store);

  return {
    success: true,
    userId: account.id,
    username: account.username,
    displayName: account.displayName,
    message: 'Register success.',
  };
}

export async function loginAccount(username: string, password: string) {
  const normalizedUsername = username.trim();
  const store = await ensureStore();
  const account = store.accounts.find((item) => item.username === normalizedUsername);

  if (!account || !verifyPassword(password, account.passwordHash)) {
    return {
      success: false,
      message: 'Invalid username or password.',
    };
  }

  return {
    success: true,
    userId: account.id,
    username: account.username,
    displayName: account.displayName,
    message: 'Login success.',
  };
}

export async function getProfileByUserId(userId: string) {
  const store = await ensureStore();
  const account = store.accounts.find((item) => item.id === userId);

  if (!account) {
    return null;
  }

  return {
    id: account.id,
    phone: account.phone,
    email: account.email,
    role: account.role,
    created_at: account.created_at,
  };
}

