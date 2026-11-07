import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const scrypt = promisify(scryptCallback);
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
await mkdir(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, 'rota.sqlite'));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
`);

const cookieName = 'rota_session';
const sessionAge = 30 * 24 * 60 * 60 * 1000;
const publicUser = row => row && ({ id: row.id, name: row.name, email: row.email });
const emailKey = email => String(email || '').trim().toLowerCase();
const tokenDigest = token => createHash('sha256').update(token).digest('hex');

export async function register({ name, email, password }) {
  name = String(name || '').trim(); email = String(email || '').trim(); password = String(password || '');
  if (name.length < 2 || name.length > 80) throw new Error('Informe um nome entre 2 e 80 caracteres.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido.');
  if (password.length < 8 || password.length > 128) throw new Error('A senha deve ter entre 8 e 128 caracteres.');
  const salt = randomBytes(16).toString('hex');
  const passwordHash = (await scrypt(password, salt, 64)).toString('hex');
  const user = { id: randomBytes(16).toString('hex'), name, email, salt, passwordHash, createdAt: new Date().toISOString() };
  try {
    db.prepare('INSERT INTO users (id,name,email,salt,password_hash,created_at) VALUES (?,?,?,?,?,?)')
      .run(user.id, user.name, user.email, user.salt, user.passwordHash, user.createdAt);
  } catch (error) {
    if (String(error.code).startsWith('SQLITE_CONSTRAINT')) throw new Error('Este e-mail já possui uma conta.');
    throw error;
  }
  return publicUser(user);
}

export async function login({ email, password }) {
  const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(emailKey(email));
  const actual = await scrypt(String(password || ''), user?.salt || '0'.repeat(32), 64);
  const expected = Buffer.from(user?.password_hash || '0'.repeat(128), 'hex');
  if (!user || !timingSafeEqual(actual, expected)) throw new Error('E-mail ou senha incorretos.');
  const token = randomBytes(32).toString('hex'); const now = Date.now();
  const insert = db.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)');
  const cleanup = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');
  db.exec('BEGIN');
  try { cleanup.run(now); insert.run(tokenDigest(token), user.id, now + sessionAge); db.exec('COMMIT'); }
  catch (error) { db.exec('ROLLBACK'); throw error; }
  return { user: publicUser(user), token };
}

export async function logout(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenDigest(token));
}

export async function updateProfile(userId, { name, email }) {
  name = String(name || '').trim(); email = String(email || '').trim();
  if (name.length < 2 || name.length > 80) throw new Error('Informe um nome entre 2 e 80 caracteres.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido.');
  try { db.prepare('UPDATE users SET name=?,email=? WHERE id=?').run(name, email, userId); }
  catch (error) { if (String(error.code).startsWith('SQLITE_CONSTRAINT')) throw new Error('Este e-mail já possui uma conta.'); throw error; }
  return publicUser(db.prepare('SELECT id,name,email FROM users WHERE id=?').get(userId));
}

export function loadAuth(req, res, next) {
  try {
    const token = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (token && /^[a-f0-9]{64}$/.test(token)) {
      const row = db.prepare('SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(tokenDigest(token), Date.now());
      req.user = publicUser(row);
    }
    res.locals.user = req.user || null;
    next();
  } catch (error) { next(error); }
}

export function setSession(res, token) { res.cookie(cookieName, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: sessionAge, path: '/' }); }
export function clearSession(res) { res.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' }); }
