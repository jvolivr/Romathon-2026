import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { pool } from './db.js';
import { AppError, profile, password as validatePassword } from './validation.js';

const scrypt = promisify(scryptCallback);
const cookieName = 'rota_session';
const sessionAge = 30 * 24 * 60 * 60 * 1000;
const publicUser = row => row && ({ id: row.id_usuario, name: row.nome, email: row.email });
const tokenDigest = token => createHash('sha256').update(token).digest('hex');
export const sessionToken = req => req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
async function credentials(password) {
  const salt = randomBytes(16).toString('hex');
  return { salt, hash: (await scrypt(password, salt, 64)).toString('hex') };
}
async function matches(password, user) {
  const actual = await scrypt(password, user?.salt || '0'.repeat(32), 64);
  const expected = Buffer.from(user?.senha_hash || '0'.repeat(128), 'hex');
  return Boolean(user && expected.length === actual.length && timingSafeEqual(actual, expected));
}
function duplicate(error) {
  if (error.code === '23505') throw new AppError('Este e-mail já possui uma conta.', 409);
  throw error;
}
export async function register(body) {
  const { name, email } = profile(body);
  const { salt, hash } = await credentials(validatePassword(body.password));
  try {
    const { rows } = await pool.query('INSERT INTO usuario (nome,email,salt,senha_hash) VALUES ($1,$2,$3,$4) RETURNING id_usuario,nome,email', [name,email,salt,hash]);
    return publicUser(rows[0]);
  } catch (error) { duplicate(error); }
}
export async function login(body) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (typeof body.password !== 'string' || body.password.length > 128) throw new AppError('E-mail ou senha incorretos.', 401);
  const { rows } = await pool.query('SELECT * FROM usuario WHERE LOWER(TRIM(email))=$1', [email]);
  if (!await matches(body.password, rows[0])) throw new AppError('E-mail ou senha incorretos.', 401);
  const token = randomBytes(32).toString('hex');
  await pool.query('DELETE FROM sessao WHERE expira_em <= CURRENT_TIMESTAMP');
  await pool.query('INSERT INTO sessao (token_hash,id_usuario,expira_em) VALUES ($1,$2,$3)', [tokenDigest(token),rows[0].id_usuario,new Date(Date.now()+sessionAge)]);
  return { user: publicUser(rows[0]), token };
}
export async function logout(token) {
  if (token) await pool.query('DELETE FROM sessao WHERE token_hash=$1', [tokenDigest(token)]);
}
export async function updateProfile(userId, body) {
  const { name, email } = profile(body);
  try {
    const { rows } = await pool.query('UPDATE usuario SET nome=$1,email=$2 WHERE id_usuario=$3 RETURNING id_usuario,nome,email', [name,email,userId]);
    return publicUser(rows[0]);
  } catch (error) { duplicate(error); }
}
export async function changePassword(userId, body) {
  validatePassword(body.password);
  if (typeof body.current !== 'string' || body.current.length > 128) throw new AppError('Senha atual incorreta.');
  const { rows } = await pool.query('SELECT salt,senha_hash FROM usuario WHERE id_usuario=$1', [userId]);
  if (!await matches(body.current, rows[0])) throw new AppError('Senha atual incorreta.');
  const { salt, hash } = await credentials(body.password);
  // A condição evita sobrescrever uma troca simultânea feita em outra sessão.
  const result = await pool.query('UPDATE usuario SET salt=$1,senha_hash=$2 WHERE id_usuario=$3 AND senha_hash=$4', [salt,hash,userId,rows[0].senha_hash]);
  if (!result.rowCount) throw new AppError('A senha mudou. Entre novamente e tente outra vez.', 409);
}
export async function loadAuth(req, res, next) {
  try {
    const token = sessionToken(req);
    if (token && /^[a-f0-9]{64}$/.test(token)) {
      const { rows } = await pool.query('SELECT u.id_usuario,u.nome,u.email FROM sessao s JOIN usuario u ON u.id_usuario=s.id_usuario WHERE s.token_hash=$1 AND s.expira_em>CURRENT_TIMESTAMP', [tokenDigest(token)]);
      req.user = publicUser(rows[0]);
    }
    res.locals.user = req.user || null;
    next();
  } catch (error) { next(error); }
}
export function setSession(res, token) { res.cookie(cookieName, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: sessionAge, path: '/' }); }
export function clearSession(res) { res.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' }); }
