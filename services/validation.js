export class AppError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function text(value, label, max, min = 0) {
  if (value == null && min === 0) return '';
  if (typeof value !== 'string') throw new AppError(`Informe ${label}.`);
  const result = value.trim();
  if (result.length < min || result.length > max) throw new AppError(`${label}: use entre ${min} e ${max} caracteres.`);
  return result;
}
export function profile(body) {
  const name = text(body.name, 'nome', 80, 2);
  const email = text(body.email, 'e-mail', 254, 1).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Informe um e-mail válido.');
  return { name, email };
}
export function password(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) throw new AppError('A senha deve ter entre 8 e 128 caracteres.');
  return value;
}
export function serviceId(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || Number(value) > 2147483647) throw new AppError('Serviço inválido.');
  return Number(value);
}
