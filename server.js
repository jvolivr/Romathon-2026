import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import web from './routes/web.js';
import { AppError } from './services/validation.js';

const root = path.dirname(fileURLToPath(import.meta.url));
export const app = express();

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(root, 'views'));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));

app.use(express.static(path.join(root, 'public'), {
  setHeaders(res, file) {
    if (file.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

app.use(web);

app.use((req, res) => res.status(404).type('text').send('Página não encontrada.'));

app.use((error, req, res, next) => {
  res.set('Cache-Control', 'no-store');
  const status = error instanceof AppError ? error.status : error.type === 'entity.parse.failed' ? 400 : error.type === 'entity.too.large' ? 413 : 503;
  const message = error instanceof AppError ? error.message : status === 400 ? 'Dados inválidos.' : status === 413 ? 'Dados muito grandes.' : 'Não foi possível acessar os dados. Confira o PostgreSQL e tente novamente.';
  if (req.path.startsWith('/api/')) return res.status(status).json({ error: message });
  res.status(status).type('text').send(message);
});

const PORT = Number(process.env.PORT) || 3000;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
