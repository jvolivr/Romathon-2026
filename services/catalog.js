import { pool } from './db.js';
import { AppError, text, serviceId } from './validation.js';
const types = {
  guia: ['Guia turístico', 'guia'], oficina: ['Artesão ou oficina', 'barro'],
  cultura: ['Feira ou espaço cultural', 'cultura'], restaurante: ['Restaurante', 'sabores']
};
function item(row) {
  const [category, illustration] = types[row.tipo];
  return {
    id: row.id_servico, type: row.tipo, name: row.nome, description: row.descricao,
    neighborhood: row.bairro, address: row.endereco, contact: row.contato,
    category, image: `/images/${illustration}.svg`, imageAlt: `Ilustração: ${category}`,
    details: Object.fromEntries(Object.entries({ 'Horários': row.horarios, 'Especialidades': row.especialidades,
      'Idiomas': row.idiomas, 'Regiões atendidas': row.regioes_atendidas, 'Atividade': row.atividade, 'Duração': row.duracao }).filter(([,v]) => v))
  };
}
export async function listServices() {
  const { rows } = await pool.query('SELECT * FROM servico ORDER BY id_servico DESC');
  return rows.map(item);
}
export async function createService(userId, body) {
  if (!Object.hasOwn(types, body.type)) throw new AppError('Escolha um tipo de serviço válido.');
  const values = [userId, body.type, text(body.name,'nome do serviço',120,1), text(body.description,'descrição',2000,1),
    text(body.neighborhood,'bairro',100,1), text(body.address,'endereço',255), text(body.contact,'contato',255,1),
    text(body.hours,'horários',1000), text(body.specialties,'especialidades',1000), text(body.languages,'idiomas',150),
    text(body.regions,'regiões atendidas',1000), text(body.activity,'atividade',1000), text(body.duration,'duração',100)];
  try {
    const { rows } = await pool.query(`INSERT INTO servico (id_usuario,tipo,nome,descricao,bairro,endereco,contato,horarios,especialidades,idiomas,regioes_atendidas,atividade,duracao)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`, values);
    return item(rows[0]);
  } catch (error) {
    if (error.code === '23505') throw new AppError('Sua conta já possui um serviço cadastrado. É permitido um anúncio por conta.',409);
    throw error;
  }
}
export async function listInterests(userId) {
  const { rows } = await pool.query('SELECT id_servico FROM interesse WHERE id_usuario=$1 ORDER BY id_servico', [userId]);
  return rows.map(row => row.id_servico);
}
export async function saveInterest(userId, id) {
  id = serviceId(id);
  try {
    await pool.query('INSERT INTO interesse (id_usuario,id_servico) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId,id]);
  } catch (error) {
    if (error.code === '23503') throw new AppError('Serviço não encontrado.',404);
    throw error;
  }
}
export async function removeInterest(userId, id) {
  await pool.query('DELETE FROM interesse WHERE id_usuario=$1 AND id_servico=$2', [userId,serviceId(id)]);
}
