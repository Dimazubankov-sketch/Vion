/**
 * Local account registry for the demo build.
 *
 * There is no backend, so accounts live in localStorage. Passwords are stored
 * as a SHA-256 digest rather than plain text — still not what a real service
 * should do (that needs a salted KDF server-side), but it keeps the demo from
 * modelling the worst possible pattern.
 */

export const EMAIL_DOMAIN = "voidops.ru";

export interface StoredAccount {
  username: string;
  name: string;
  phone?: string;
  passwordHash: string;
}

const STORAGE_KEY = "vion.accounts";

/** Everything before the @, lowercased and stripped of stray characters. */
export function normalizeUsername(input: string) {
  return input.trim().toLowerCase().split("@")[0].replace(/[^a-z0-9._-]/g, "");
}

export function emailFor(username: string) {
  return `${normalizeUsername(username)}@${EMAIL_DOMAIN}`;
}

export function listAccounts(): StoredAccount[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function save(accounts: StoredAccount[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    /* ignore */
  }
}

export function findAccount(username: string) {
  const key = normalizeUsername(username);
  return listAccounts().find((a) => a.username === key);
}

export function usernameTaken(username: string) {
  return !!findAccount(username);
}

async function hash(password: string) {
  try {
    const bytes = new TextEncoder().encode(`vion:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Non-secure contexts have no crypto.subtle; the demo still needs to work.
    return `plain:${password}`;
  }
}

export async function createAccount(input: {
  username: string;
  name: string;
  phone?: string;
  password: string;
}) {
  const username = normalizeUsername(input.username);
  const account: StoredAccount = {
    username,
    name: input.name,
    phone: input.phone,
    passwordHash: await hash(input.password),
  };
  save([...listAccounts().filter((a) => a.username !== username), account]);
  return account;
}

/** True when the username exists and the password matches. */
export async function verifyAccount(username: string, password: string) {
  const account = findAccount(username);
  if (!account) return false;
  return account.passwordHash === (await hash(password));
}

/** Find an account by the phone number used at sign-up. */
export function findAccountByPhone(phone: string) {
  return listAccounts().find((a) => a.phone && a.phone === phone);
}
